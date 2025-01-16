import express from 'express';
import { resCode } from '../../config/settings';
import models from '../../database/containers/models';
import { Util } from '../../util/util';
import { authenticate, loginRequired } from '../auth';
import { UserInfo } from '../../config/types';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';

const router = express.Router();

const client = Container.get(DatabaseProvider).client();

router.get('/competitions/:id/results', authenticate, (req, res) => {
    if (req.params.id == null) {
        Util.sendResponse(res, resCode.badRequest, 'id not specified');
        return;
    }

    models.results.getCompetitionScores(
        (rows, err) => {
            if (err) {
                Util.sendResponse(res, resCode.serverError, err.message);
                return;
            }

            Util.sendResponseJson(res, resCode.success, rows);
        },
        req.params.id,
        res.locals.user,
        parseInt(req.query.after?.toString() || '0'),
        parseInt(req.query.question?.toString() || 'null')
    );
});

router.get(
    '/competitions/:id/progress',
    authenticate,
    loginRequired,
    (req, res) => {
        const user: UserInfo = res.locals.user;
        const competition_id = req.params.id;

        client.results
            .groupBy({
                by: ['question_id'],
                _sum: {
                    result: true,
                },
                _max: {
                    accepted: true,
                },
                where: {
                    question: {
                        competition_id: parseInt(competition_id),
                        competitions: {
                            deleted_at: null,
                        },
                        deleted_at: null,
                    },
                    user_id: user.id,
                },
            })
            .then((results) => {
                const new_res = results.map((result) => {
                    return {
                        question_id: result.question_id,
                        total: result._sum.result,
                        accepted: result._max.accepted,
                    };
                });
                Util.sendResponseJson(res, resCode.success, new_res);
            })
            .catch((err) => {
                Util.sendResponse(res, resCode.serverError, err);
            });
    }
);

async function fetchUserSubmissions(
    user_id: number,
    competition_id: string,
    question_id: string,
    after_id?: string
) {
    const question_filters = {
        deleted_at: null,
        competitions: {
            deleted_at: null,
            id: parseInt(competition_id),
        },
        id: parseInt(question_id),
    };

    var cursor_params;

    if (after_id) {
        cursor_params = {
            skip: 1,
            cursor: {
                id: parseInt(after_id.toString()),
            },
        };
    }

    const results = await client.results.findMany({
        where: {
            user_id: user_id,
            question: question_filters,
        },
        orderBy: {
            created_at: 'desc',
        },
        take: 10,
        ...(after_id && cursor_params),
        include: {
            question_choices: {
                select: {
                    id: true,
                },
            },
            evaluated_by: {
                select: {
                    id: true,
                    name: true,
                },
            },
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
            question: true,
        },
    });

    const accepted_count = await client.results.count({
        where: {
            user_id: user_id,
            question: question_filters,
            accepted: true,
        },
    });

    const rejected_count = await client.results.count({
        where: {
            user_id: user_id,
            question: question_filters,
            accepted: false,
        },
    });

    const final_res = {
        results: results,
        accepted_count: accepted_count,
        rejected_count: rejected_count,
    };

    return final_res;
}

router.get(
    '/competitions/:id/results/:ques_id',
    authenticate,
    loginRequired,
    (req, res) => {
        const user: UserInfo = res.locals.user;
        const competition_id = req.params.id;
        const question_id = req.params.ques_id;
        const after_id = req.query.after;
        const user_id = req.query.user_id;

        if (!competition_id && !question_id) {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }

        client.competitions
            .findUniqueOrThrow({
                where: {
                    id: parseInt(competition_id),
                },
                include: {
                    host_user: true,
                },
            })
            .then((comp) => {
                var filterUser = user.id;

                if (comp.host_user_id === user.id && user_id) {
                    filterUser = parseInt(user_id.toString());
                }

                fetchUserSubmissions(
                    filterUser,
                    competition_id,
                    question_id,
                    after_id?.toString()
                )
                    .then((result) => {
                        Util.sendResponseJson(res, resCode.success, result);
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

module.exports = router;
