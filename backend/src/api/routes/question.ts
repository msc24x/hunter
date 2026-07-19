import express, { Request, Response } from 'express';
import fs, { existsSync, readFile, writeFile } from 'fs';
import models from '../../database/containers/models';
import {
    CodeSolution,
    CompetitionInfo,
    HunterExecutable,
    QuestionInfo,
    UserInfo,
} from '../../config/types';
import { Util } from '../../util/util';
import { authenticate, loginRequired } from '../auth';
import { resCode } from '../../config/settings';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';
import path from 'path';
import fileUpload from 'express-fileupload';
import { JudgeService } from '../../services/judgeService';
import config from '../../config/config';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import { Competitions } from '../../database/models/Competitions';

function seededShuffle<T>(array: T[], seed: number): T[] {
    const shuffled = [...array];
    let s = seed >>> 0;
    const next = () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 4294967296;
    };
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

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
                    question_verification,
                );
            })
            .catch((err) => {
                Util.sendResponse(res, resCode.serverError, err);
            });
    },
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
                type: config.questionTypes.code,
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
                        'Test solution file must exist for this question.',
                    );
                    return;
                }

                judgeService
                    .execute(execReq, true, null, null)
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
                                    language: (execReq.solution as CodeSolution)
                                        .lang,
                                },
                                update: {
                                    created_at: new Date(),
                                    submission: code,
                                    success: exeRes.success,
                                    question_id: ques_id,
                                    reason: exeRes.meta,
                                    language: (execReq.solution as CodeSolution)
                                        .lang,
                                },
                            })
                            .then((verification) => {
                                Util.sendResponseJson(
                                    res,
                                    resCode.success,
                                    verification,
                                );
                                return;
                            })
                            .catch((err) => {
                                Util.sendResponse(
                                    res,
                                    resCode.serverError,
                                    err,
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
    },
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
                    fileType,
                );

                if (req.params.op == 'download') {
                    if (existsSync(fileName)) {
                        const basename = path.basename(fileName);

                        res.setHeader(
                            'Content-Disposition',
                            `attachment; filename="${basename}"`,
                        );

                        res.setHeader(
                            'Content-Type',
                            'application/octet-stream',
                        );

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
    },
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
                    fileType,
                );

                writeFile(fileName, file.data, { flag: 'w' }, (err) => {
                    if (err) {
                        console.log(err);
                        Util.sendResponse(res, resCode.serverError);
                        return;
                    }

                    client.question_verification
                        .updateMany({
                            where: {
                                question_id: question.id,
                            },
                            data: {
                                success: false,
                            },
                        })
                        .then(() => {
                            Util.sendResponse(res, resCode.success);
                        })
                        .catch((err) => {
                            console.error(err);
                            Util.sendResponse(res, resCode.serverError);
                        });
                });
            })
            .catch((err) => Util.sendResponse(res, resCode.badRequest, err));
    },
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
    },
);

router.post(
    '/competitions/:comp_id/questions',
    authenticate,
    loginRequired,
    (req, res) => {
        const comp_id = parseInt(req.params.comp_id);
        const user: UserInfo = res.locals.user;

        const quest_type = parseInt(req.body.type);

        if (!Object.values(config.questionTypes).includes(quest_type)) {
            Util.sendResponse(
                res,
                resCode.badRequest,
                'Question type not supported',
            );
            return;
        }

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
                            type: quest_type,
                            points: 2,
                        },
                    })
                    .then((question) =>
                        Util.sendResponseJson(res, resCode.success, question),
                    )
                    .catch((err) =>
                        Util.sendResponse(res, resCode.serverError, err),
                    );
            })
            .catch((err) => Util.sendResponse(res, resCode.serverError, err));
    },
);

function validateQuestionInfo(data: QuestionInfo) {
    var errors: any = {};

    if (data.points < 0) {
        errors.points = 'Points cannot be negative for correct submissions';
    }

    if (data.points > 40) {
        errors.points = 'Points more than 40 are not allowed to be set';
    }

    if (data.neg_points < 0) {
        errors.neg_points =
            'Please refrain from entering negative numbers manually. Write positive integers, as they are automatically considered negative';
    }

    if (data.neg_points > 40) {
        errors.neg_points =
            'Negative points are not allowed to be more than 40';
    }

    if ((data.title || '').length > 400) {
        errors.title = 'Characters more than 400 are not allowed in title';
    }

    if ((data.statement || '').length > 4000) {
        errors.statement =
            'Characters more than 4000 are not allowed in statement';
    }

    if (data.type === config.questionTypes.code) {
        if ((data.sample_cases || '').length > 1000) {
            errors.sample_cases =
                'Characters more than 1000 are not allowed in sample cases';
        }

        if ((data.sample_sols || '').length > 1000) {
            errors.sample_sols =
                'Characters more than 1000 are not allowed in sample cases';
        }
    }

    if (
        [config.questionTypes.fill, config.questionTypes.mcq].includes(
            data.type,
        )
    ) {
        data.question_choices?.forEach((ch) => {
            if (ch.delete) {
                return;
            }

            if (!ch.text) {
                errors.question_choices =
                    'Some choices are empty, please write the required text';
            }

            if ((ch.text || '').length > 150) {
                errors.question_choices =
                    'Characters in input cannot be more than 150';
            }
        });
    }

    if (config.questionTypes.long === data.type) {
        if ((data.char_limit || 0) < 0) {
            errors.char_limit = 'Word limit cannot be in negative';
        }
    }

    return errors;
}

router.put(
    '/competitions/:comp_id/questions/:id',
    authenticate,
    loginRequired,
    (req, res) => {
        const comp_id = parseInt(req.params.comp_id);
        const id = parseInt(req.params.id);
        var params = req.body as QuestionInfo;
        const user: UserInfo = res.locals.user;

        var errors = validateQuestionInfo(params);

        if (Object.keys(errors).length) {
            Util.sendResponseJson(res, resCode.badRequest, errors);
            return;
        }

        var promises: Promise<any>[] = [];

        var resolvePromisesAndSendRes = function () {
            Promise.all(promises)
                .then(() => {
                    Util.sendResponse(res, resCode.success);
                })
                .catch((err) => {
                    Util.sendResponse(res, resCode.serverError, err);
                });
        };

        const window = new JSDOM('').window;
        const purify = DOMPurify(window);
        const clean_statement = purify.sanitize(params.statement || '');

        const saveQuestionDataPr = client.questions.update({
            where: {
                id: id,
                competition_id: comp_id,
                competitions: { host_user_id: user.id },
                deleted_at: null,
            },
            data: {
                title: params.title,
                statement: clean_statement,
                points: params.points,
                neg_points: params.neg_points,
                case_sensitive: params.case_sensitive,
                char_limit: params.char_limit,
                sample_cases: params.sample_cases,
                sample_sols: params.sample_sols,
            },
        });

        promises.push(saveQuestionDataPr);

        if (
            ![config.questionTypes.mcq, config.questionTypes.fill].includes(
                params.type,
            )
        ) {
            resolvePromisesAndSendRes();
            return;
        }

        var choicesToCreate = params.question_choices?.filter(
            (val) => (!val.id || val.id < 0) && !val.delete,
        );

        var choicesToUpdate = params.question_choices?.filter(
            (val) => val.id && val.id > 0 && !val.delete,
        );
        var choicesToDelete = params.question_choices?.filter(
            (val) => val.id && val.id > 0 && val.delete,
        );

        if (choicesToCreate) {
            choicesToCreate.map((val) => {
                delete val.delete;
                delete val.id;
                val.question_id = params.id;
            });
            promises.push(
                client.question_choice.createMany({
                    data: choicesToCreate,
                }),
            );
        }

        if (choicesToUpdate) {
            choicesToUpdate.map((val) => {
                delete val.delete;
            });

            choicesToUpdate.forEach((choiceToUpdate) => {
                promises.push(
                    client.question_choice.update({
                        data: choiceToUpdate,
                        where: {
                            question: {
                                competitions: {
                                    host_user_id: user.id,
                                },
                            },
                            id: choiceToUpdate.id,
                        },
                    }),
                );
            });
        }

        if (choicesToDelete) {
            promises.push(
                client.question_choice.deleteMany({
                    where: {
                        id: {
                            in: choicesToDelete.map((val) => val.id!),
                        },
                        question: {
                            competitions: {
                                host_user_id: user.id,
                            },
                            id: params.id,
                        },
                    },
                }),
            );
        }

        resolvePromisesAndSendRes();
        return;
    },
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
    (req, res) => {
        const competition_id: number = parseInt(req.params.comp_id);
        const ques_id: number | null =
            (req.params.id && parseInt(req.params.id)) || null;
        const user: UserInfo | null = res.locals.user;
        const is_editor = req.headers.referer?.includes('/editor/');

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
                            ...(ques_id && { id: ques_id }),
                        },
                        include: {
                            question_choices: true,
                        },
                    },
                    host_user: {
                        select: {
                            id: true,
                            name: true,
                            avatar_url: true,
                        },
                    },
                    community: {
                        select: {
                            id: true,
                            name: true,
                            status: true,
                            members: {
                                where: {
                                    user_id: user?.id,
                                    status: 'APPROVED',
                                },
                            },
                        },
                    },
                    ...(user && {
                        competition_sessions: {
                            where: {
                                user_id: user.id,
                            },
                            select: {
                                created_at: true,
                            },
                        },
                        competition_invites: {
                            where: {
                                user_id: user.id,
                            },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        avatar_url: true,
                                    },
                                },
                            },
                        },
                    }),
                },
            })
            .then(async (competition) => {
                // If not found, then not found
                if (!competition) {
                    Util.sendResponse(res, resCode.notFound);
                    return;
                }

                const isEditor = req.headers.referer?.includes('/editor/');

                // If its the host, send everything
                if (isEditor && competition.host_user_id === user?.id) {
                    var response: any = competition;
                    response.competition_invites =
                        await Competitions.getInvites(competition.id);

                    Util.sendResponseJson(res, resCode.success, response);
                    return;
                }

                // If not public, then not found
                if (competition.visibility === 'PRIVATE') {
                    Util.sendResponse(res, resCode.notFound);
                    return;
                }

                const now = new Date();
                const endDate = competition.scheduled_end_at;

                // If its not live yet or non-practice not started by user, remove questions info
                if (
                    !(
                        competition.visibility === 'PUBLIC' ||
                        (competition.visibility === 'INVITE' &&
                            competition.competition_invites?.[0]?.accepted_at)
                    ) ||
                    (competition.scheduled_at &&
                        competition.scheduled_at > now) ||
                    (!competition.competition_sessions?.[0]?.created_at &&
                        !competition.practice)
                ) {
                    competition.questions = competition.questions.map(
                        (ques) => {
                            ques.statement = '';
                            ques.title = '';
                            ques.sample_cases = '';
                            ques.sample_sols = '';
                            ques.case_sensitive = false;
                            ques.char_limit = null;
                            ques.question_choices = [];

                            return ques;
                        },
                    );
                }

                // Remove just sensitive info
                competition.questions.map((ques: QuestionInfo) => {
                    var correctCount = 0;

                    if (ques.type === config.questionTypes.mcq) {
                        ques?.question_choices?.map((choice) => {
                            if (choice.is_correct) {
                                correctCount++;
                            }
                            choice.is_correct = false;
                        });

                        ques.correct_count = correctCount;
                    } else if (ques.type === config.questionTypes.fill) {
                        ques.question_choices = [];
                    }
                });

                // Shuffle the questions except for the host
                if (
                    competition.host_user_id !== user?.id &&
                    competition.randomize_questions &&
                    competition.competition_sessions?.[0]?.created_at
                ) {
                    const seed = new Date(
                        competition.competition_sessions[0].created_at,
                    ).getTime();
                    competition.questions = seededShuffle(
                        competition.questions,
                        seed,
                    );
                }

                Util.sendResponseJson(res, resCode.success, competition);
            })
            .catch((err) => {
                Util.sendResponse(res, resCode.serverError, err);
            });
    },
);

// GET /competitions/questions/import/schema — returns config.importSchema.
router.get(
    '/competitions/questions/import/schema',
    authenticate,
    loginRequired,
    (req, res) => {
        Util.sendResponseJson(res, resCode.success, config.importSchema);
    },
);

function validateImportQuestion(data: any): Record<string, string> {
    const errors: Record<string, string> = {};

    if (
        data.type == null ||
        !Object.values(config.questionTypes).includes(data.type)
    ) {
        errors.type =
            'Question type must be one of 0 (code), 1 (mcq), 2 (fill), 3 (long)';
        return errors;
    }

    if (data.points != null && isNaN(Number(data.points))) {
        errors.points = 'points must be a number';
    }
    if (data.neg_points != null && isNaN(Number(data.neg_points))) {
        errors.neg_points = 'neg_points must be a number';
    }

    const baseErrors = validateQuestionInfo({
        ...data,
        id: 0,
        competition_id: 0,
        position: 0,
        created_at: new Date(),
        deleted_at: null,
    } as QuestionInfo);
    Object.assign(errors, baseErrors);

    if (
        [config.questionTypes.fill, config.questionTypes.mcq].includes(
            data.type,
        ) &&
        Array.isArray(data.question_choices)
    ) {
        data.question_choices.forEach((ch: any, ci: number) => {
            if (typeof ch !== 'object' || ch == null) {
                errors[`question_choices[${ci}]`] =
                    'Each choice must be an object { text, is_correct }';
                return;
            }
            if (ch.text == null) {
                errors[`question_choices[${ci}].text`] =
                    'Choice text is required';
            } else if (String(ch.text).length > 150) {
                errors[`question_choices[${ci}].text`] =
                    'Characters in input cannot be more than 150';
            }
            if (typeof ch.is_correct !== 'boolean') {
                errors[`question_choices[${ci}].is_correct`] =
                    'is_correct must be a boolean';
            }
        });
    }

    if (data.type === config.questionTypes.code) {
        const hasCode = data.solution_code != null && data.solution_code !== '';
        const hasLang = data.solution_lang != null && data.solution_lang !== '';
        if (hasCode && !hasLang) {
            errors.solution_lang =
                'solution_lang is required when solution_code is provided';
        }
        if (hasLang && !hasCode) {
            errors.solution_code =
                'solution_code is required when solution_lang is provided';
        }
        if (hasLang && !Util.getValidLangs().includes(data.solution_lang)) {
            errors.solution_lang =
                'solution_lang must be one of: ' +
                Util.getValidLangs().join(', ');
        }
    }

    return errors;
}

// POST /competitions/:comp_id/questions/import
// Atomically creates a batch of questions (optionally after soft-deleting the
// existing ones). Coding questions may include test_cases/solutions file
// contents (written to disk) and solution_code/solution_lang (verified
// synchronously after the transaction commits).
router.post(
    '/competitions/:comp_id/questions/import',
    authenticate,
    loginRequired,
    async (req, res) => {
        const comp_id = parseInt(req.params.comp_id);
        const user: UserInfo = res.locals.user;
        const body = req.body || {};

        const delete_existing = !!body.delete_existing;
        const default_points =
            body.default_points == null ? 0 : Number(body.default_points);
        const default_neg_points =
            body.default_neg_points == null
                ? 0
                : Number(body.default_neg_points);
        const questions = Array.isArray(body.questions) ? body.questions : null;

        const topErrors: Record<string, string> = {};
        if (!questions || questions.length === 0) {
            topErrors.questions = 'Expected a non-empty questions array';
        } else if (questions.length > 10) {
            topErrors.questions =
                'Cannot import more than 10 questions at once';
        }
        if (
            !Number.isFinite(default_points) ||
            default_points < 0 ||
            default_points > 40
        ) {
            topErrors.default_points =
                'Default points must be a number between 0 and 40';
        }
        if (
            !Number.isFinite(default_neg_points) ||
            default_neg_points < 0 ||
            default_neg_points > 40
        ) {
            topErrors.default_neg_points =
                'Default negative points must be a number between 0 and 40';
        }
        if (Object.keys(topErrors).length) {
            Util.sendResponseJson(res, resCode.badRequest, topErrors);
            return;
        }

        const allErrors: Record<string, string> = {};
        questions.forEach((q: any, i: number) => {
            const qErrors = validateImportQuestion(q);
            for (const field in qErrors) {
                allErrors[`questions[${i}].${field}`] = qErrors[field];
            }
        });
        if (Object.keys(allErrors).length) {
            Util.sendResponseJson(res, resCode.badRequest, allErrors);
            return;
        }

        const competition = await client.competitions
            .findUnique({
                where: {
                    id: comp_id,
                    host_user_id: user.id,
                    deleted_at: null,
                },
                select: { id: true },
            })
            .catch(() => null);
        if (!competition) {
            Util.sendResponse(res, resCode.forbidden);
            return;
        }

        let startPosition = 1;
        if (!delete_existing) {
            const maxPos = await client.questions
                .aggregate({
                    where: { competition_id: comp_id, deleted_at: null },
                    _max: { position: true },
                })
                .catch(() => null);
            if (maxPos?._max?.position != null) {
                startPosition = maxPos._max.position + 1;
            }
        }

        const purify = DOMPurify(new JSDOM('').window);
        const verificationsPending: Array<{
            id: number;
            code: string;
            lang: string;
        }> = [];
        const filesToWrite: Array<{
            path: string;
            content: string;
        }> = [];

        try {
            await client.$transaction(async (tranc) => {
                if (delete_existing) {
                    await tranc.questions.updateMany({
                        where: {
                            competition_id: comp_id,
                            deleted_at: null,
                        },
                        data: { deleted_at: new Date() },
                    });
                }

                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    const created = await tranc.questions.create({
                        data: {
                            competition_id: comp_id,
                            type: q.type,
                            title: q.title ?? null,
                            statement: purify.sanitize(q.statement || ''),
                            points:
                                q.points == null
                                    ? default_points
                                    : Number(q.points),
                            neg_points:
                                q.neg_points == null
                                    ? default_neg_points
                                    : Number(q.neg_points),
                            position:
                                q.position == null
                                    ? startPosition + i
                                    : Number(q.position),
                            case_sensitive: q.case_sensitive ?? false,
                            char_limit: q.char_limit ?? null,
                            sample_cases: q.sample_cases ?? null,
                            sample_sols: q.sample_sols ?? null,
                            created_at: new Date(),
                        },
                    });

                    if (
                        [config.questionTypes.fill, config.questionTypes.mcq].includes(
                            q.type,
                        ) &&
                        Array.isArray(q.question_choices) &&
                        q.question_choices.length > 0
                    ) {
                        await tranc.question_choice.createMany({
                            data: q.question_choices.map(
                                (ch: any, ci: number) => ({
                                    text: ch.text,
                                    is_correct: ch.is_correct,
                                    position:
                                        ch.position == null
                                            ? ci
                                            : Number(ch.position),
                                    question_id: created.id,
                                }),
                            ),
                        });
                    }

                    if (q.type === config.questionTypes.code) {
                        if (q.test_cases != null) {
                            filesToWrite.push({
                                path: Util.getAbsoluteFilePath(
                                    comp_id,
                                    created.id,
                                    'testcases',
                                ),
                                content: String(q.test_cases),
                            });
                        }
                        if (q.solutions != null) {
                            filesToWrite.push({
                                path: Util.getAbsoluteFilePath(
                                    comp_id,
                                    created.id,
                                    'solutions',
                                ),
                                content: String(q.solutions),
                            });
                        }

                        if (
                            q.solution_code &&
                            q.solution_lang &&
                            (q.test_cases != null || q.solutions != null)
                        ) {
                            verificationsPending.push({
                                id: created.id,
                                code: String(q.solution_code),
                                lang: String(q.solution_lang),
                            });
                        }
                    }
                }
            });

            // Write files after the transaction commits so a rollback
            // doesn't leave orphaned files on disk.
            for (const f of filesToWrite) {
                await fs.promises.writeFile(f.path, f.content);
            }

            for (const v of verificationsPending) {
                try {
                    const exeRes = await judgeService.execute(
                        {
                            for: {
                                competition_id: comp_id,
                                question_id: v.id,
                                type: config.questionTypes.code,
                            },
                            solution: { code: v.code, lang: v.lang as any },
                        } as HunterExecutable,
                        false,
                        null,
                        null,
                    );
                    await client.question_verification.upsert({
                        where: { question_id: v.id },
                        create: {
                            question_id: v.id,
                            submission: v.code,
                            language: v.lang,
                            success: exeRes.success,
                            reason: exeRes.meta ?? null,
                            created_at: new Date(),
                        },
                        update: {
                            submission: v.code,
                            language: v.lang,
                            success: exeRes.success,
                            reason: exeRes.meta ?? null,
                            created_at: new Date(),
                        },
                    });
                } catch (err) {
                    console.error(
                        `import: verification failed for question ${v.id}:`,
                        err,
                    );
                }
            }

            Util.sendResponse(res, resCode.success);
        } catch (err) {
            console.error('import: transaction failed:', err);
            Util.sendResponse(
                res,
                resCode.serverError,
                err instanceof Error ? err.message : String(err),
            );
        }
    },
);

module.exports = router;
