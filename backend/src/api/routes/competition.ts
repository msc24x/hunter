import express, { Request, Response } from 'express';
import models from '../../database/containers/models';
import { CompetitionInfo, UserInfo } from '../../config/types';
import { Util } from '../../util/util';
import { authenticate, loginRequired } from '../auth';
import { resCode } from '../../config/settings';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';
import { time } from 'console';
import config from '../../config/config';

var router = express.Router();
const client = Container.get(DatabaseProvider).client();

// Delete a contest
router.delete('/competition/:id', authenticate, loginRequired, (req, res) => {
    client.competitions
        .update({
            where: {
                id: parseInt(req.params.id),
                host_user_id: res.locals.user.id,
            },
            data: {
                deleted_at: new Date(),
            },
        })
        .then((competition) => {
            if (!competition) {
                Util.sendResponse(res, resCode.notFound);
                return;
            }
            Util.sendResponse(res, resCode.success);
        })
        .catch(() => {
            Util.sendResponse(res, resCode.badRequest);
        });
});

// Create a contest
router.post('/competition', authenticate, loginRequired, (req, res) => {
    const title = req.body.title;
    const practice = Boolean(req.body.practice);

    if (title == null || (title as string).length > 120) {
        Util.sendResponse(
            res,
            resCode.badRequest,
            'No more than 120 characters are allowed'
        );
        return;
    }

    client.competitions
        .create({
            data: {
                title: req.body.title,
                description: req.body.description,
                public: false,
                practice: practice,
                created_at: new Date(),
                host_user_id: res.locals.user.id,
                updated_at: new Date(),
            },
        })
        .then((competition) => {
            if (!competition) {
                Util.sendResponse(res, resCode.serverError);
                return;
            }
            Util.sendResponseJson(res, resCode.success, competition);
        })
        .catch(() => {
            Util.sendResponse(res, resCode.serverError);
        });
});

// Update a contest
router.put('/competition', authenticate, loginRequired, (req, res) => {
    const competitionBody = req.body;
    if (
        !competitionBody?.host_user_id ||
        !competitionBody?.id ||
        competitionBody?.title?.length > 120 ||
        competitionBody?.description?.length > 456
    ) {
        Util.sendResponse(res, resCode.badRequest);
        return;
    }

    client.competitions
        .findUnique({ where: { id: parseInt(competitionBody.id) } })
        .then((competition) => {
            if (!competition) {
                Util.sendResponse(res, resCode.notFound);
                return;
            }

            if (competition.host_user_id != res.locals.user.id) {
                Util.sendResponse(res, resCode.forbidden);
                return;
            }

            client.competitions
                .update({
                    where: {
                        id: competition.id,
                        host_user_id: res.locals.user.id,
                    },
                    data: {
                        description: competitionBody.description || '',
                        title: competitionBody.title || '',
                        public: competitionBody.public,
                        scheduled_at: competitionBody.scheduled_at
                            ? new Date(competitionBody.scheduled_at)
                            : null,
                        scheduled_end_at: competitionBody.scheduled_end_at
                            ? new Date(competitionBody.scheduled_end_at)
                            : null,
                        updated_at: new Date(),
                    },
                })
                .then((competition) => {
                    Util.sendResponseJson(res, resCode.success, competition);
                })
                .catch((err) => {
                    Util.sendResponse(res, resCode.serverError, err);
                });
        });
});

// Fetch a contest
router.get('/competition/:id', authenticate, loginRequired, (req, res) => {
    if (req.params.id == '') {
        Util.sendResponse(res, resCode.badRequest);
        return;
    }

    client.competitions
        .findUnique({ where: { id: parseInt(req.params.id) } })
        .then((competition) => {
            if (!competition) {
                Util.sendResponse(res, resCode.notFound);
                return;
            }

            // send the competition right away if its public
            if (competition.public) {
                Util.sendResponseJson(res, resCode.success, competition);
                return;
            }

            if (!res.locals.isAuthenticated) {
                Util.sendResponse(res, resCode.forbidden);
                return;
            }

            if (competition.host_user_id != res.locals.user.id) {
                Util.sendResponse(res, resCode.forbidden);
                return;
            }

            Util.sendResponseJson(res, resCode.success, competition);
        });
});

function isAnyErrorPresent(obj: any) {
    var error = false;

    Object.values(obj).forEach((val: any) => {
        if (isNaN(val?.length)) {
            if (isAnyErrorPresent(val)) {
                error = true;
                return;
            }
        } else if (val.length > 0) {
            error = true;
            return;
        }
    });

    return error;
}

// Fetch quality of a contest
router.get(
    '/competition/:id/quality',
    authenticate,
    loginRequired,
    (req, res) => {
        if (req.params.id == '') {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }

        client.competitions
            .findUniqueOrThrow({
                where: { id: parseInt(req.params.id) },
                include: {
                    questions: {
                        where: {
                            deleted_at: null,
                        },
                        include: {
                            question_verifications: {
                                where: {
                                    success: true,
                                },
                            },
                            question_choices: true,
                        },
                    },
                },
            })
            .then((competition) => {
                if (!competition) {
                    Util.sendResponse(res, resCode.notFound);
                    return;
                }

                var warnings: any = {};

                if (!competition.title) {
                    warnings.title = ['Competition title is empty.'];
                }

                if (!competition.description) {
                    warnings.description = ['Competition has no description.'];
                }

                if (!competition.questions.length) {
                    warnings.questions = ['Competition has no questions.'];
                }

                warnings.questionsAcceptable = true;

                competition.questions.forEach((question) => {
                    warnings[question.id] = {};
                    var questionWarnings = warnings[question.id];

                    if (!question.title) {
                        questionWarnings.title = ['Question title is empty.'];
                    }

                    if (!question.statement) {
                        questionWarnings.statement = [
                            'Question has no statement.',
                        ];
                    }

                    if (question.type === config.questionTypes.code) {
                        if (!question.sample_sols) {
                            questionWarnings.sample_sols = [
                                "No sample solution has been set, hunter cannot evaluate users' output when there is nothing to compare to.",
                            ];
                        }

                        if (
                            !Util.doesTestFilesExist({
                                for: {
                                    competition_id: competition.id,
                                    question_id: question.id,
                                    type: 0,
                                },
                                solution: { code: '', lang: 'c' },
                            })
                        ) {
                            questionWarnings.sample_sols = [
                                'File to specify solution output of your question has not been set, this makes your question simply un-solvable.',
                            ];
                        }

                        if (!question.question_verifications.length) {
                            questionWarnings.question_verifications = [
                                'Verification request for the solutions file to test the solvability of the coding task has not been submitted, hunter cannot ensure whether your coding task is solvable or not.',
                            ];
                        }
                    }

                    if (question.type === config.questionTypes.mcq) {
                        questionWarnings.question_choices = [];

                        if (question.question_choices.length < 2) {
                            questionWarnings.question_choices.push(
                                'Question do no have enough (at least 2 required) number of choices to choose from.'
                            );
                        }

                        if (
                            question.question_choices?.length &&
                            question.question_choices.every((q) => q.is_correct)
                        ) {
                            questionWarnings.question_choices.push(
                                'All choices in the question have been marked as correct, which is un-acceptable.'
                            );
                        }

                        if (
                            question.question_choices.every(
                                (q) => !q.is_correct
                            )
                        ) {
                            questionWarnings.question_choices.push(
                                'There is no choice in the question that is marked as correct, which makes the question unsolvable.'
                            );
                        }
                    }

                    if (question.type === config.questionTypes.fill) {
                        questionWarnings.question_choices = [];

                        if (!question.question_choices.length) {
                            questionWarnings.question_choices.push(
                                'Question do not have any possible answer, which makes the question un-solvable.'
                            );
                        }
                    }

                    questionWarnings.acceptable = true;

                    if (isAnyErrorPresent(questionWarnings)) {
                        warnings.questionsAcceptable = false;
                        questionWarnings.acceptable = false;
                    }
                });

                warnings.acceptable = !isAnyErrorPresent(warnings);

                Util.sendResponseJson(res, resCode.success, warnings);
            })
            .catch((err) => {
                console.log(err);
                Util.sendResponse(res, resCode.notFound, err);
                return;
            });
    }
);

// Fetch all contests
router.get('/competitions', authenticate, (req, res) => {
    const user: UserInfo | null = res.locals.user;
    const params = {
        query: req.query.query?.toString() || '',
        includeSelf: req.query.includeSelf?.toString() === 'true',
        liveStatus: req.query.liveStatus?.toString() || 'all',
        orderBy: req.query.orderBy?.toString() || 'desc',
    };

    if (!res.locals.isAuthenticated) {
        params.includeSelf = false;
    }

    var orParams: any[] = [];
    var andParams = [];
    var orderBy: any = {};

    if (params.query) {
        andParams.push({
            OR: [
                { title: { contains: params.query } },
                { description: { contains: params.query } },
            ],
        });
    }

    if (params.includeSelf) {
        andParams.push({ host_user_id: user!.id });
    } else {
        andParams.push({ public: true });
    }

    if (params.liveStatus === 'upcoming') {
        andParams.push({
            scheduled_at: {
                gt: new Date(),
            },
        });
    } else if (params.liveStatus === 'live') {
        andParams.push({
            scheduled_at: {
                lt: new Date(),
            },
        });
    } else if (params.liveStatus === 'always') {
        andParams.push({
            scheduled_end_at: null,
        });
    }

    if (['asc', 'desc'].includes(params.orderBy)) {
        orderBy.created_at = params.orderBy;
    }

    const whereClause = {
        deleted_at: null,
        ...(orParams.length && { OR: [...orParams] }),
        ...(andParams.length && { AND: [...andParams] }),
    };

    client.competitions
        .findMany({
            where: whereClause,
            orderBy: orderBy,
            include: {
                host_user: {
                    select: {
                        id: true,
                        avatar_url: true,
                        name: true,
                    },
                },
            },
        })
        .then((competitions) => {
            if (params.liveStatus === 'live') {
                competitions = competitions.filter((comp) => {
                    if (!comp.scheduled_end_at) return true;
                    return new Date() < comp.scheduled_end_at;
                });
            }
            Util.sendResponseJson(res, resCode.success, competitions);
        })
        .catch((err) => Util.sendResponse(res, resCode.serverError, err));
});

module.exports = router;
