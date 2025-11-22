import express, { Request, Response } from 'express';
import models from '../../database/containers/models';
import {
    CodeSolution,
    HunterExecutable,
    QuestionInfo,
    UserInfo,
} from '../../config/types';
import { Util } from '../../util/util';
import { existsSync, readFile, writeFile } from 'fs';
import { authenticate, loginRequired } from '../auth';
import { exec } from 'child_process';
import Container from 'typedi';
import { JudgeService } from '../../services/judgeService';
import { ScoreboardService } from '../../services/scoreboardService';
import { resCode } from '../../config/settings';
import { DatabaseProvider } from '../../services/databaseProvider';
import config from '../../config/config';

const router = express.Router();
const client = Container.get(DatabaseProvider).client();
const judgeService = Container.get(JudgeService);
const scoreboardService = Container.get(ScoreboardService);

function safeRouteToQuestion(
    req: Request,
    res: Response,
    type: number
): Promise<QuestionInfo> {
    const hunterExecutable = req.body.exec as HunterExecutable;

    var promise = new Promise<QuestionInfo>((resolve, reject) => {
        client.questions
            .findUnique({
                where: {
                    id: hunterExecutable.for.question_id,
                    competition_id: hunterExecutable.for.competition_id,
                    type: type,
                    competitions: {
                        OR: [
                            { visibility: 'PUBLIC' },
                            {
                                visibility: 'INVITE',
                                competition_invites: {
                                    some: {
                                        user_id: res.locals.user.id,
                                        accepted_at: {
                                            not: null,
                                        },
                                    },
                                },
                            },
                        ],
                        deleted_at: null,
                    },
                    deleted_at: null,
                },
                include: {
                    competitions: {
                        include: {
                            competition_sessions: {
                                where: {
                                    user_id: res.locals.user.id,
                                },
                            },
                            community: {
                                select: {
                                    status: true,
                                    name: true,
                                    id: true,
                                    members: {
                                        where: {
                                            status: 'APPROVED',
                                            user_id: res.locals.user.id,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    question_choices: true,
                },
            })
            .then((question) => {
                if (!question) {
                    Util.sendResponse(res, resCode.notFound);
                    return;
                }

                if (
                    !models.competitions.isLiveNow(
                        question.competitions.scheduled_at
                    ) ||
                    !models.competitions.hasNotEnded(
                        question.competitions.scheduled_end_at
                    )
                ) {
                    Util.sendResponse(
                        res,
                        resCode.forbidden,
                        'Either the competition is not live or has ended'
                    );
                    return;
                }

                if (
                    !question.competitions.practice &&
                    !question.competitions.competition_sessions.length
                ) {
                    Util.sendResponse(
                        res,
                        resCode.forbidden,
                        'Onboarding have not been done for this competition'
                    );
                    return;
                }

                if (question.competitions.community?.id) {
                    let community = question.competitions.community;
                    if (
                        community.status !== 'APPROVED' &&
                        question.competitions.community_only
                    ) {
                        Util.sendResponse(
                            res,
                            resCode.forbidden,
                            'Competition is a members only competition of an inactive community'
                        );
                        return;
                    }

                    if (
                        community.status === 'APPROVED' &&
                        question.competitions.community_only
                    ) {
                        if (!community.members.length) {
                            Util.sendResponse(
                                res,
                                resCode.forbidden,
                                'Competition is a members only competition of the community'
                            );
                            return;
                        }
                    }
                }

                if (
                    !question.competitions.practice &&
                    question.competitions.time_limit
                ) {
                    var time_limit = question.competitions.time_limit;
                    var time_limit_end_at =
                        question.competitions.competition_sessions[0]
                            .created_at;
                    time_limit_end_at = new Date(
                        time_limit_end_at.getTime() + time_limit * 60 * 1000
                    );

                    if (!models.competitions.hasNotEnded(time_limit_end_at)) {
                        Util.sendResponse(
                            res,
                            resCode.forbidden,
                            'Time limit for this contest has exceeded, cannot send any more submissions'
                        );
                        return;
                    }
                }

                resolve(question as QuestionInfo);
            });
    });

    return promise;
}

function judgeCodeQuestion(req: Request, res: Response) {
    const hunterExecutable = req.body.exec as HunterExecutable;
    const samples = req.body.samples as boolean;
    const user: UserInfo = res.locals.user;

    if (!Util.isValidExecRequest(hunterExecutable)) {
        Util.sendResponse(res, resCode.badRequest, 'executable is not valid');
        return;
    }

    safeRouteToQuestion(req, res, config.questionTypes.code).then(
        async (question) => {
            if (!samples && !Util.doesTestFilesExist(hunterExecutable)) {
                Util.sendResponseJson(res, resCode.success, {
                    output: 'HERR: No case solution has been set for this question',
                });
                return;
            }

            if (samples && !question.sample_sols) {
                Util.sendResponseJson(res, resCode.success, {
                    output: 'HERR: No sample test case solution has been set for this question by the host',
                });
                return;
            }

            try {
                const resInfo = await judgeService.execute(
                    hunterExecutable,
                    samples,
                    question as QuestionInfo,
                    user
                );

                if (!samples)
                    scoreboardService.updateResult(
                        user,
                        hunterExecutable,
                        resInfo,
                        question as QuestionInfo
                    );

                Util.sendResponseJson(res, resCode.success, resInfo);
            } catch (err) {
                console.log(err);
                Util.sendResponse(res, resCode.serverError);
            }
        }
    );
}

function judgeMcqQuestion(req: Request, res: Response) {
    const hunterExecutable = req.body.exec as HunterExecutable;
    const user: UserInfo = res.locals.user;

    safeRouteToQuestion(req, res, config.questionTypes.mcq).then((question) => {
        const correctChoices: number[] = [];
        const chosenChoices: number[] = [];
        var success = true;

        question.question_choices?.forEach((qChoice) => {
            if (qChoice.is_correct) {
                correctChoices.push(qChoice.id!);
            }
        });

        hunterExecutable.solution = hunterExecutable.solution as QuestionInfo;
        hunterExecutable.solution.question_choices?.forEach((cChoice) => {
            if (cChoice.is_correct) {
                chosenChoices.push(cChoice.id!);
            }
        });

        if (!correctChoices.length) {
            Util.sendResponse(
                res,
                resCode.badRequest,
                'Host did not configure the question properly, cannot accept a submission for this.'
            );
            return;
        }

        if (
            !chosenChoices.length ||
            chosenChoices.length !== correctChoices.length
        ) {
            Util.sendResponse(
                res,
                resCode.badRequest,
                `Required number of choices are not selected, ${chosenChoices.length}/${correctChoices.length}`
            );
            return;
        }

        chosenChoices.forEach((cChoiceId) => {
            if (!correctChoices.includes(cChoiceId)) {
                success = false;
            }
        });

        client.results
            .findFirst({
                where: {
                    user_id: user.id,
                    question_id: question.id,
                },
                include: {
                    question: {
                        include: {
                            competitions: {
                                select: {
                                    practice: true,
                                },
                            },
                        },
                    },
                },
            })
            .then((existingResult) => {
                if (
                    existingResult &&
                    !existingResult.question.competitions.practice
                ) {
                    Util.sendResponse(
                        res,
                        resCode.badRequest,
                        'Already submitted a response'
                    );
                    return;
                }

                var resInfo = {
                    expected: '',
                    meta: '',
                    output: '',
                    success: success,
                };

                scoreboardService.updateResult(
                    user,
                    hunterExecutable,
                    resInfo,
                    question
                );

                Util.sendResponseJson(res, resCode.success, resInfo);
            });
    });
}

function judgeFillQuestion(req: Request, res: Response) {
    const hunterExecutable = req.body.exec as HunterExecutable;
    const user: UserInfo = res.locals.user;

    safeRouteToQuestion(req, res, config.questionTypes.fill).then(
        (question) => {
            const correctChoices: string[] = [];
            var userAnswer: string = '';
            var success = true;

            question.question_choices?.forEach((qChoice) => {
                if (question.case_sensitive) {
                    correctChoices.push(qChoice.text || '');
                } else {
                    correctChoices.push((qChoice.text || '').toLowerCase());
                }
            });

            hunterExecutable.solution =
                hunterExecutable.solution as QuestionInfo;
            userAnswer = hunterExecutable.solution.user_answer || '';

            if (!question.case_sensitive) {
                userAnswer = userAnswer.toLowerCase();
            }

            if (!correctChoices.length) {
                Util.sendResponse(
                    res,
                    resCode.badRequest,
                    'Host did not configure the question properly, cannot accept a submission for this.'
                );
                return;
            }

            if (!userAnswer) {
                Util.sendResponse(res, resCode.badRequest, 'Empty answer');
                return;
            }

            success = correctChoices.includes(userAnswer);

            client.results
                .findFirst({
                    where: {
                        user_id: user.id,
                        question_id: question.id,
                    },
                    include: {
                        question: {
                            include: {
                                competitions: {
                                    select: {
                                        practice: true,
                                    },
                                },
                            },
                        },
                    },
                })
                .then((existingResult) => {
                    if (
                        existingResult &&
                        !existingResult.question.competitions.practice
                    ) {
                        Util.sendResponse(
                            res,
                            resCode.badRequest,
                            'Already submitted a response'
                        );
                        return;
                    }

                    var resInfo = {
                        expected: '',
                        meta: '',
                        output: '',
                        success: success,
                    };

                    scoreboardService.updateResult(
                        user,
                        hunterExecutable,
                        resInfo,
                        question
                    );

                    Util.sendResponseJson(res, resCode.success, resInfo);
                });
        }
    );
}

function judgeLongQuestion(req: Request, res: Response) {
    const hunterExecutable = req.body.exec as HunterExecutable;
    const user: UserInfo = res.locals.user;

    safeRouteToQuestion(req, res, config.questionTypes.long).then(
        (question) => {
            var userAnswer: string = '';
            var success = true;
            var userAnswerWords: number = 0;

            hunterExecutable.solution =
                hunterExecutable.solution as QuestionInfo;
            userAnswer = hunterExecutable.solution.user_answer || '';

            if (question.char_limit) {
                userAnswerWords = userAnswer.trim().split(' ').length;

                if (userAnswerWords < question.char_limit) {
                    Util.sendResponse(
                        res,
                        resCode.badRequest,
                        `The number of words in the answer are less than the acceptable number (${question.char_limit}) for this question, please write more words to submit.`
                    );
                    return;
                }
            }

            if (!userAnswer) {
                Util.sendResponse(res, resCode.badRequest, 'Empty answer');
                return;
            }

            client.results
                .findFirst({
                    where: {
                        user_id: user.id,
                        question_id: question.id,
                    },
                    include: {
                        question: {
                            include: {
                                competitions: {
                                    select: {
                                        practice: true,
                                    },
                                },
                            },
                        },
                    },
                })
                .then((existingResult) => {
                    if (existingResult && !question.competitions!.practice) {
                        Util.sendResponse(
                            res,
                            resCode.badRequest,
                            'Already submitted a response'
                        );
                        return;
                    }

                    scoreboardService.updateResult(
                        user,
                        hunterExecutable,
                        {
                            expected: '',
                            meta: '',
                            output: '',
                            success: success,
                        },
                        question,
                        question.competitions!.practice
                    );

                    Util.sendResponse(res, resCode.success);
                });
        }
    );
}

router.post('/submit', authenticate, loginRequired, (req, res) => {
    const hunterExecutable = req.body.exec as HunterExecutable;

    switch (hunterExecutable.for.type) {
        case config.questionTypes.code:
            judgeCodeQuestion(req, res);
            break;

        case config.questionTypes.mcq:
            judgeMcqQuestion(req, res);
            break;
        case config.questionTypes.fill:
            judgeFillQuestion(req, res);
            break;
        case config.questionTypes.long:
            judgeLongQuestion(req, res);
            break;

        default:
            break;
    }
});

router.get('/submission/:lang', authenticate, loginRequired, (req, res) => {
    const competition_id = parseInt(req.query.competition_id as string);
    const question_id = parseInt(req.query.question_id as string);
    const lang = req.params.lang;
    const user: UserInfo = res.locals.user;

    if (
        !competition_id ||
        !question_id ||
        !Util.getValidLangs().includes(lang)
    ) {
        Util.sendResponse(res, resCode.badRequest);
        return;
    }

    client.questions
        .findUnique({
            where: {
                id: question_id,
                competition_id: competition_id,
                competitions: {
                    OR: [
                        {
                            visibility: 'PUBLIC',
                        },
                        {
                            visibility: 'INVITE',
                            competition_invites: {
                                some: {
                                    accepted_at: {
                                        not: null,
                                    },
                                    user_id: user.id,
                                },
                            },
                        },
                    ],
                },
            },
            include: {
                competitions: true,
            },
        })
        .then((question) => {
            if (!question) {
                Util.sendResponse(res, resCode.notFound);
                return;
            }

            readFile(
                `${judgeService.filesPath}${competition_id}_${question_id}_${user.id}.${lang}`,
                { encoding: 'utf-8' },
                (err, data) => {
                    if (err) {
                        if (err.code == 'ENOENT')
                            Util.sendResponse(res, resCode.notFound);
                        else Util.sendResponse(res, resCode.serverError);
                        return;
                    }
                    Util.sendResponseJson(res, resCode.success, {
                        data: data,
                    });
                }
            );
        });
});

module.exports = router;
