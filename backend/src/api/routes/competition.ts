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
import { sendPublicContestEmail } from '../../emails/public-contest/sender';

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

async function validateContestInfo(comp: CompetitionInfo) {
    var errors: any = {};

    if (comp?.title?.length > 120) {
        errors.title =
            'Cannot have more than 120 characters in competition title';
    }

    if (comp?.description?.length > 456) {
        errors.description =
            'Cannot have more than 456 characters in competition description';
    }

    if (comp?.time_limit && comp?.time_limit > 96 * 60) {
        errors.time_limit =
            'Cannot set time limit more than 96 hours, please lower the limit';
    }

    if (comp?.time_limit && comp?.time_limit < 0) {
        errors.time_limit =
            'Cannot set invalid time limit, please set at least 1 minute or 1 hour';
    }

    if (comp?.scheduled_at && comp?.scheduled_end_at) {
        if (new Date(comp.scheduled_at) > new Date(comp.scheduled_end_at)) {
            errors.scheduled_end_at =
                'The rejection date-time for submissions is set before the opening date-time, which is invalid. Please fix it to continue';
        }
    }

    if (comp?.community_id) {
        let community_obj = await client.community.findFirst({
            where: {
                id: comp.community_id,
                admin_user_id: comp.host_user_id,
                // status: 'APPROVED',
            },
        });

        if (!community_obj) {
            errors.community_id =
                'Linked community must be created by the host and should be APPROVED';
        }
    }

    return errors;
}

// Update a contest
router.put('/competition', authenticate, loginRequired, (req, res) => {
    const competitionBody = req.body;
    if (!competitionBody?.host_user_id || !competitionBody?.id) {
        Util.sendResponse(res, resCode.badRequest);
        return;
    }

    validateContestInfo(competitionBody).then((errors) => {
        if (Object.keys(errors).length) {
            Util.sendResponseJson(res, resCode.badRequest, errors);
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

                const markingPublic =
                    competition.visibility != competitionBody.visibility &&
                    competitionBody.visibility == 'PUBLIC';

                client.competitions
                    .update({
                        where: {
                            id: competition.id,
                            host_user_id: res.locals.user.id,
                        },
                        data: {
                            description: competitionBody.description || '',
                            title: competitionBody.title || '',
                            visibility: competitionBody.visibility,
                            community_id: competitionBody.community_id,
                            community_only: competitionBody.community_only,
                            hidden_scoreboard:
                                competitionBody.hidden_scoreboard,
                            scheduled_at: competitionBody.scheduled_at
                                ? new Date(competitionBody.scheduled_at)
                                : null,
                            scheduled_end_at: competitionBody.scheduled_end_at
                                ? new Date(competitionBody.scheduled_end_at)
                                : null,
                            updated_at: new Date(),
                            time_limit: competition.practice
                                ? null
                                : competitionBody.time_limit,
                        },
                        include: {
                            host_user: true,
                        },
                    })
                    .then((competition) => {
                        Util.sendResponseJson(
                            res,
                            resCode.success,
                            competition
                        );

                        if (markingPublic) {
                            sendPublicContestEmail(
                                competition as CompetitionInfo
                            );
                        }
                    })
                    .catch((err) => {
                        Util.sendResponse(res, resCode.serverError, err);
                    });
            });
    });
});

// Start a contest for self
router.post(
    '/competition/:id/session',
    authenticate,
    loginRequired,
    (req, res) => {
        if (!parseInt(req.params.id)) {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }

        const comp_id = parseInt(req.params.id);

        client.competitions
            .findUnique({
                where: {
                    id: comp_id,
                    AND: [
                        {
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
                        },
                        {
                            OR: [
                                {
                                    scheduled_at: null,
                                },
                                {
                                    scheduled_at: {
                                        lt: new Date(),
                                    },
                                },
                            ],
                        },
                    ],
                    deleted_at: null,
                },
                include: {
                    competition_sessions: {
                        where: {
                            user_id: res.locals.user.id,
                        },
                    },
                },
            })
            .then((comp) => {
                if (!comp) {
                    Util.sendResponse(res, resCode.notFound);
                    return;
                }

                if (comp?.competition_sessions.length) {
                    Util.sendResponse(res, resCode.success);
                    return;
                }

                client.competition_session
                    .create({
                        data: {
                            user_id: res.locals.user.id,
                            competition_id: comp_id,
                            created_at: new Date(),
                        },
                    })
                    .then((csession) => {
                        Util.sendResponse(res, resCode.created);
                        return;
                    })
                    .catch((err) => {
                        Util.sendResponse(res, resCode.serverError, err);
                    });
            })
            .catch((err) => {
                Util.sendResponse(res, resCode.serverError, err);
            });
    }
);

// Fetch a contest
router.get('/competition/:id', authenticate, loginRequired, (req, res) => {
    if (req.params.id == '') {
        Util.sendResponse(res, resCode.badRequest);
        return;
    }

    client.competitions
        .findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                competition_sessions: {
                    where: {
                        user_id: res.locals.user.id,
                    },
                    select: {
                        created_at: true,
                    },
                },
                competition_invites: {
                    where: {
                        accepted_at: {
                            not: null,
                        },
                        user_id: res.locals.user.id,
                    },
                },
            },
        })
        .then((competition) => {
            if (!competition) {
                Util.sendResponse(res, resCode.notFound);
                return;
            }

            // send the competition right away if its (public or invited) and started by user.
            if (
                (competition.visibility === 'PUBLIC' ||
                    (competition.visibility == 'INVITE' &&
                        competition.competition_invites.length)) &&
                competition.competition_sessions?.[0]?.created_at
            ) {
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
        invited: req.query.invited?.toString() === 'true',
        liveStatus: req.query.liveStatus?.toString() || 'all',
        orderBy: req.query.orderBy?.toString() || 'desc',
    };

    if (!res.locals.isAuthenticated) {
        params.includeSelf = false;
    }

    if (params.invited && !user) {
        Util.sendResponseJson(res, resCode.success, []);
        return;
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
    } else if (params.invited && user) {
        andParams.push({
            visibility: 'INVITE',
            competition_invites: { some: { user_id: user.id } },
        });
    } else {
        andParams.push({ visibility: 'PUBLIC' });
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

    const whereClause: any = {
        deleted_at: null,
    };

    if (orParams.length) {
        whereClause.OR = orParams;
    }
    if (andParams.length) {
        whereClause.AND = andParams;
    }

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
                _count: {
                    select: {
                        questions: {
                            where: {
                                deleted_at: null,
                            },
                        },
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
        .catch((err) => {
            console.error(err);
            Util.sendResponse(res, resCode.serverError, err);
        });
});

module.exports = router;
