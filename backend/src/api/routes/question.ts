import express, { Request, Response } from 'express';
import { existsSync, readFile, writeFile } from 'fs';
import models from '../../database/containers/models';
import { HunterExecutable, QuestionInfo, UserInfo } from '../../config/types';
import { Util } from '../../util/util';
import { authenticate, loginRequired } from '../auth';
import { resCode } from '../../config/settings';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';
import path from 'path';
import fileUpload from 'express-fileupload';
import { JudgeService } from '../../services/judgeService';

var router = express.Router();
const client = Container.get(DatabaseProvider).client();
const judgeService = Container.get(JudgeService);

router.get(
    '/competitions/:comp_id/questions/:id/verification',
    authenticate,
    loginRequired,
    (req, res) => {
        const comp_id = parseInt(req.params.comp_id);
        const ques_id = parseInt(req.params.id);
        const user: UserInfo = res.locals.user;

        client.question_verification
            .findUnique({
                where: {
                    question_id: ques_id,
                    question: {
                        competition_id: comp_id,
                        competitions: {
                            host_user_id: user.id,
                        },
                    },
                },
            })
            .then((question_verification) => {
                if (!question_verification) {
                    Util.sendResponse(res, resCode.notFound);
                    return;
                }

                Util.sendResponseJson(
                    res,
                    resCode.success,
                    question_verification
                );
            })
            .catch((err) => {
                Util.sendResponse(res, resCode.serverError, err);
            });
    }
);

router.post(
    '/competitions/:comp_id/questions/:id/verification',
    authenticate,
    loginRequired,
    (req, res) => {
        const comp_id = parseInt(req.params.comp_id);
        const ques_id = parseInt(req.params.id);
        const user: UserInfo = res.locals.user;
        const language = req.body?.solution?.lang;
        const code = req.body?.solution?.code;

        const execReq: HunterExecutable = {
            for: {
                competition_id: comp_id,
                question_id: ques_id,
            },
            solution: {
                code: code,
                lang: language,
            },
        };

        if (!Util.isValidExecRequest(execReq)) {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }

        client.questions
            .findUnique({
                where: {
                    id: ques_id,
                    competition_id: comp_id,
                    competitions: {
                        host_user_id: user.id,
                        deleted_at: null,
                    },
                    deleted_at: null,
                },
                select: { id: true },
            })
            .then((question) => {
                if (!question) {
                    Util.sendResponse(res, resCode.notFound);
                    return;
                }

                if (!Util.doesTestFilesExist(execReq)) {
                    Util.sendResponse(
                        res,
                        resCode.badRequest,
                        'Test files must exist for this question.'
                    );
                    return;
                }

                judgeService
                    .execute(execReq, false, null, null)
                    .then((exeRes) => {
                        client.question_verification
                            .upsert({
                                where: {
                                    question_id: ques_id,
                                },
                                create: {
                                    created_at: new Date(),
                                    submission: code,
                                    success: exeRes.success,
                                    question_id: ques_id,
                                    reason: exeRes.meta,
                                    language: execReq.solution.lang,
                                },
                                update: {
                                    created_at: new Date(),
                                    submission: code,
                                    success: exeRes.success,
                                    question_id: ques_id,
                                    reason: exeRes.meta,
                                    language: execReq.solution.lang,
                                },
                            })
                            .then((verification) => {
                                Util.sendResponseJson(
                                    res,
                                    resCode.success,
                                    verification
                                );
                                return;
                            })
                            .catch((err) => {
                                Util.sendResponse(
                                    res,
                                    resCode.serverError,
                                    err
                                );
                                return;
                            });
                    })
                    .catch((err) => {
                        Util.sendResponse(res, resCode.serverError, err);
                        return;
                    });
            })
            .catch((err) => {
                if (err) {
                    Util.sendResponse(res, resCode.serverError, err);
                    return;
                }
            });
    }
);

router.get(
    '/competitions/:comp_id/questions/:id/:fileType/:op?',
    authenticate,
    loginRequired,
    (req, res) => {
        const fileType = req.params.fileType;
        const comp_id = parseInt(req.params.comp_id);
        const ques_id = parseInt(req.params.id);
        const user: UserInfo = res.locals.user;

        if (!['testcases', 'solutions'].includes(fileType)) {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }

        client.questions
            .findUnique({
                where: {
                    id: ques_id,
                    competition_id: comp_id,
                    competitions: {
                        host_user_id: user.id,
                        deleted_at: null,
                    },
                    deleted_at: null,
                },
                select: { id: true },
            })
            .then((question) => {
                if (!question) {
                    Util.sendResponse(res, resCode.notFound);
                    return;
                }

                const fileName = Util.getAbsoluteFilePath(
                    comp_id,
                    ques_id,
                    fileType
                );

                if (req.params.op == 'download') {
                    if (existsSync(fileName)) {
                        res.sendFile(fileName, (err) => {
                            if (err) {
                                Util.sendResponse(res, resCode.serverError);
                            }
                        });
                    } else {
                        Util.sendResponseJson(res, resCode.success, {
                            exists: false,
                        });
                    }
                } else {
                    Util.sendResponseJson(res, resCode.success, {
                        exists: existsSync(fileName),
                    });
                }
            })
            .catch((err) => Util.sendResponse(res, resCode.badRequest, err));
    }
);

router.post(
    '/competitions/:comp_id/questions/:id/:fileType',
    authenticate,
    loginRequired,
    (req, res) => {
        if (!req.params.id || !req.files?.file) {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }

        const file = req.files.file as fileUpload.UploadedFile;
        const fileType = req.params.fileType;
        const comp_id = parseInt(req.params.comp_id);
        const ques_id = parseInt(req.params.id);
        const user: UserInfo = res.locals.user;

        if (!['testcases', 'solutions'].includes(fileType)) {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }

        if (file.size > 1.5 * 1024 * 1024) {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }

        client.questions
            .findUnique({
                where: {
                    id: ques_id,
                    competition_id: comp_id,
                    competitions: {
                        host_user_id: user.id,
                        deleted_at: null,
                    },
                    deleted_at: null,
                },
                select: { id: true },
            })
            .then((question) => {
                if (!question) {
                    Util.sendResponse(res, resCode.notFound);
                    return;
                }

                const fileName = Util.getAbsoluteFilePath(
                    comp_id,
                    ques_id,
                    fileType
                );

                writeFile(fileName, file.data, { flag: 'w' }, (err) => {
                    if (err) {
                        console.log(err);
                        Util.sendResponse(res, resCode.serverError);
                        return;
                    }
                    Util.sendResponse(res, resCode.success);
                });
            })
            .catch((err) => Util.sendResponse(res, resCode.badRequest, err));
    }
);

router.delete(
    '/competitions/:comp_id/questions/:id',
    authenticate,
    loginRequired,
    (req, res) => {
        const comp_id = parseInt(req.params.comp_id);
        const id = parseInt(req.params.id);
        const user: UserInfo = res.locals.user;

        client.questions
            .update({
                where: {
                    id: id,
                    competition_id: comp_id,
                    competitions: {
                        host_user_id: user.id,
                        deleted_at: null,
                    },
                    deleted_at: null,
                },
                data: {
                    deleted_at: new Date(),
                },
            })
            .then((question) => {
                if (!question) {
                    Util.sendResponse(res, resCode.notFound);
                    return;
                }
                Util.sendResponse(res, resCode.success);
            })
            .catch((err) => Util.sendResponse(res, resCode.badRequest, err));
    }
);

router.post(
    '/competitions/:comp_id/questions',
    authenticate,
    loginRequired,
    (req, res) => {
        const comp_id = parseInt(req.params.comp_id);
        const user: UserInfo = res.locals.user;

        client.competitions
            .findUnique({
                where: { id: comp_id },
            })
            .then((competition) => {
                if (!competition || competition?.host_user_id !== user.id) {
                    Util.sendResponse(res, resCode.forbidden);
                    return;
                }

                client.questions
                    .create({
                        data: {
                            competition_id: competition.id,
                            created_at: new Date(),
                        },
                    })
                    .then((question) =>
                        Util.sendResponseJson(res, resCode.success, question)
                    )
                    .catch((err) =>
                        Util.sendResponse(res, resCode.serverError, err)
                    );
            })
            .catch((err) => Util.sendResponse(res, resCode.serverError, err));
    }
);

router.put(
    '/competitions/:comp_id/questions/:id',
    authenticate,
    loginRequired,
    (req, res) => {
        const comp_id = parseInt(req.params.comp_id);
        const id = parseInt(req.params.id);
        var params = req.body as QuestionInfo;
        const user: UserInfo = res.locals.user;

        const validate = (): boolean => {
            if (params.points < 0 || params.points > 9) {
                return false;
            }

            if (params.neg_points < 0 || params.neg_points > 4) {
                return false;
            }

            return true;
        };

        if (!validate()) {
            Util.sendResponse(
                res,
                resCode.badRequest,
                'Values are not correct'
            );
        }

        client.questions
            .update({
                where: {
                    id: id,
                    competition_id: comp_id,
                    competitions: { host_user_id: user.id },
                    deleted_at: null,
                },
                data: {
                    title: params.title,
                    statement: params.statement,
                    points: params.points,
                    neg_points: params.neg_points,
                },
            })
            .then((question) =>
                Util.sendResponseJson(res, resCode.success, question)
            )
            .catch((err) => Util.sendResponse(res, resCode.serverError, err));
    }
);
/**
 * GET question
 *  authenticate
 *    get competition associated
 *    private competition
 *      if same host
 *        send
 *      if diff host
 *        forbid
 *    public competition
 *      if same host
 *        send
 *      if diff host
 *        if live
 *          if duration 0
 *            send
 *          else if time < live + duration
 *            send
 *          else
 *            forbid
 *        if not live
 *          forbid
 *
 *
 */

router.get(
    '/competitions/:comp_id/questions/:id?',
    authenticate,
    loginRequired,
    (req, res) => {
        const competition_id: number = parseInt(req.params.comp_id);
        const ques_id: number | '' = req.params.id && parseInt(req.params.id);
        const user: UserInfo = res.locals.user;

        if (isNaN(competition_id)) {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }

        client.competitions
            .findUnique({
                where: {
                    id: competition_id,
                    deleted_at: null,
                },
                include: {
                    questions: {
                        where: {
                            deleted_at: null,
                            ...(ques_id !== '' && { id: ques_id }),
                        },
                    },
                },
            })
            .then((competition) => {
                if (!competition) {
                    Util.sendResponse(res, resCode.notFound);
                    return;
                }

                if (competition.host_user_id === user.id) {
                    Util.sendResponseJson(res, resCode.success, competition);
                    return;
                }

                const now = new Date();
                const endDate = competition.scheduled_end_at;

                if (
                    !competition.public ||
                    (competition.scheduled_at &&
                        competition.scheduled_at > now) ||
                    (endDate && endDate < now)
                ) {
                    competition.questions = competition.questions.map(
                        (ques) => {
                            ques.statement = '';
                            ques.title = '';
                            ques.sample_cases = '';
                            ques.sample_sols = '';
                            return ques;
                        }
                    );
                }

                Util.sendResponseJson(res, resCode.success, competition);
            })
            .catch((err) => {
                Util.sendResponse(res, resCode.serverError, err);
            });
    }
);

module.exports = router;
