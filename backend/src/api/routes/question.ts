import express, { Request, Response } from 'express';
import { existsSync, readFile, writeFile } from 'fs';
import models from '../../database/containers/models';
import { QuestionInfo, UserInfo } from '../../config/types';
import { Util } from '../../util/util';
import { authenticate, loginRequired } from '../auth';
import { resCode } from '../../config/settings';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';

var router = express.Router();
const client = Container.get(DatabaseProvider).client();

router.get(
    '/question/:id/:fileType/:op?',
    authenticate,
    loginRequired,
    (req, res) => {
        let id = req.params.id;
        let fileType = req.params.fileType;
        const user: UserInfo = res.locals.user;

        if (id == null) {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }

        models.questions.findAll(
            {
                id: id,
            },
            (questions: Array<QuestionInfo>) => {
                if (questions.length == 0) {
                    Util.sendResponse(res, resCode.notFound);
                    return;
                }

                models.competitions.findAll(
                    {
                        id: questions[0].competition_id,
                    },
                    0,
                    -1,
                    (competitions) => {
                        if (competitions.length == 0) {
                            Util.sendResponse(res, resCode.notFound);
                            return;
                        }

                        let fileName = `src/database/files/${competitions[0].id}_${id}_${fileType[0]}.txt`;

                        if (competitions[0].host_user_id == user.id) {
                            if (req.params.op == 'download') {
                                if (existsSync(fileName)) {
                                    readFile(
                                        fileName,
                                        { encoding: 'utf-8' },
                                        (err, data) => {
                                            if (err) {
                                                Util.sendResponse(
                                                    res,
                                                    resCode.serverError
                                                );
                                                return;
                                            }
                                            Util.sendResponseJson(
                                                res,
                                                resCode.success,
                                                {
                                                    exists: true,
                                                    data: data,
                                                }
                                            );
                                        }
                                    );
                                } else {
                                    Util.sendResponseJson(
                                        res,
                                        resCode.success,
                                        { exists: false }
                                    );
                                }
                            } else {
                                Util.sendResponseJson(res, resCode.success, {
                                    exists: existsSync(fileName),
                                });
                            }
                        } else {
                            Util.sendResponse(res, resCode.forbidden);
                        }
                    },
                    (err) => {}
                );
            }
        );
    }
);

router.post(
    '/question/:id/:fileType',
    authenticate,
    loginRequired,
    (req, res) => {
        if (!req.params.id) {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }

        const fileType = req.params.fileType;
        const file = req.body.file;
        const user: UserInfo = res.locals.user;

        if (!file || !fileType) {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }
        if (!['testcases', 'solutions'].includes(fileType)) {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }

        if (file.length > 1572864) {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }

        models.questions.findAll({ id: req.params.id }, (questions) => {
            if (questions.length == 0) {
                Util.sendResponse(res, resCode.notFound);
                return;
            }
            models.competitions.findAll(
                { id: questions[0].competition_id },
                0,
                -1,
                (competitions) => {
                    if (competitions.length == 0) {
                        Util.sendResponse(res, resCode.notFound);
                        return;
                    }

                    if (competitions[0].host_user_id != user.id) {
                        Util.sendResponse(res, resCode.forbidden);
                        return;
                    }
                    let fileName = `src/database/files/${competitions[0].id}_${questions[0].id}_${fileType[0]}.txt`;

                    writeFile(fileName, file, { flag: 'w' }, (err) => {
                        if (err) {
                            console.log(err);
                            Util.sendResponse(res, resCode.serverError);
                            return;
                        }
                        Util.sendResponse(res, resCode.success);
                    });
                },
                () => {}
            );
        });
    }
);

router.delete('/question/:id', authenticate, loginRequired, (req, res) => {
    if (!req.params.id) {
        Util.sendResponse(res, resCode.badRequest);
        return;
    }
    const user: UserInfo = res.locals.user;

    models.questions.findAll({ id: req.params.id }, (questions) => {
        if (questions.length == 0) {
            Util.sendResponse(res, resCode.notFound);
            return;
        }
        models.competitions.findAll(
            { id: questions[0].competition_id },
            0,
            -1,
            (competitions) => {
                if (competitions.length == 0) {
                    Util.sendResponse(res, resCode.notFound);
                    return;
                }

                if (competitions[0].host_user_id != user.id) {
                    Util.sendResponse(res, resCode.forbidden);
                    return;
                }

                models.questions.delete(
                    { id: req.params.id as string },
                    (err) => {
                        if (!err) {
                            Util.sendResponse(res, resCode.success);
                            return;
                        }
                    }
                );
            },
            () => {}
        );
    });
});

router.post('/question', authenticate, loginRequired, (req, res) => {
    const user: UserInfo = res.locals.user;

    models.competitions.findAll(
        { id: req.body.competition_id },
        0,
        -1,
        (competitions) => {
            if (competitions.length == 0) {
                Util.sendResponse(res, resCode.notFound);
                return;
            }

            const competition = competitions[0];
            if (competition.host_user_id != user.id) {
                Util.sendResponse(res, resCode.forbidden);
                return;
            }
            models.questions.add(
                competition.id,
                (question_id) => {
                    Util.sendResponse(res, resCode.success);
                },
                (err) => {
                    console.log(err);
                    Util.sendResponse(res, resCode.serverError);
                }
            );
        },

        (err) => {
            console.log(err);
            Util.sendResponse(res, resCode.serverError);
        }
    );
});

router.put('/question', authenticate, loginRequired, (req, res) => {
    var params = req.body;
    const user: UserInfo = res.locals.user;

    models.questions.findAll({ id: params.id }, (questions) => {
        if (questions.length == 0) {
            Util.sendResponse(res, resCode.notFound);
            return;
        }
        models.competitions.findAll(
            { id: questions[0].competition_id },
            0,
            -1,
            (competitions) => {
                if (competitions.length == 0) {
                    Util.sendResponse(res, resCode.notFound);
                    return;
                }

                if (competitions[0].host_user_id != user.id) {
                    Util.sendResponse(res, resCode.forbidden);
                    return;
                }

                models.questions.update(params, (err) => {
                    if (err) {
                        console.log(err);
                        Util.sendResponse(res, resCode.serverError);
                        return;
                    }

                    Util.sendResponse(res, resCode.success);
                });
            },
            () => {}
        );
    });
});
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

router.get('/question', authenticate, loginRequired, (req, res) => {
    var competition_id: string | null = req.query.competition_id as string;
    var id: string | null = req.query.id as string;
    const user: UserInfo = res.locals.user;

    if (competition_id == null && id == null) {
        Util.sendResponse(res, resCode.badRequest);
        return;
    }

    models.questions.findAll(
        {
            competition_id: competition_id,
            id: id,
        },
        (questions: Array<QuestionInfo>) => {
            if (questions.length == 0) {
                Util.sendResponseJson(res, resCode.success, questions);
                return;
            }

            models.competitions.findAll(
                {
                    id: questions[0].competition_id,
                },
                0,
                -1,
                (competitions) => {
                    if (competitions.length == 0) {
                        // todo : delete all questions
                        Util.sendResponse(res, resCode.notFound);
                        return;
                    }

                    if (competitions[0].public) {
                        if (competitions[0].host_user_id == user.id) {
                            Util.sendResponseJson(
                                res,
                                resCode.success,
                                questions
                            );
                        } else {
                            if (
                                models.competitions.isLiveNow(
                                    competitions[0].scheduled_at
                                )
                            ) {
                                if (competitions[0].duration == 0) {
                                    Util.sendResponseJson(
                                        res,
                                        resCode.success,
                                        questions
                                    );
                                } else {
                                    if (
                                        models.competitions.hasNotEnded(
                                            competitions[0].scheduled_at,
                                            competitions[0].duration
                                        )
                                    ) {
                                        Util.sendResponseJson(
                                            res,
                                            resCode.success,
                                            questions
                                        );
                                    } else {
                                        Util.sendResponse(
                                            res,
                                            resCode.forbidden,
                                            'has ended'
                                        );
                                    }
                                }
                            } else {
                                Util.sendResponse(
                                    res,
                                    resCode.forbidden,
                                    'is not live yet'
                                );
                            }
                        }
                    } else {
                        if (competitions[0].host_user_id == user.id) {
                            Util.sendResponseJson(
                                res,
                                resCode.success,
                                questions
                            );
                        } else {
                            Util.sendResponse(
                                res,
                                resCode.forbidden,
                                'not host'
                            );
                        }
                    }
                },
                (err) => {}
            );
        }
    );
});

module.exports = router;
