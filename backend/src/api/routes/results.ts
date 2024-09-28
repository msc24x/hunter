import express from 'express';
import { resCode } from '../../config/settings';
import models from '../../database/containers/models';
import { Util } from '../../util/util';
import { authenticate, loginRequired } from '../auth';
import { UserInfo } from '../../config/types';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';
import { Sql } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

const router = express.Router();

const client = Container.get(DatabaseProvider).client();

router.get('/competitions/:id/results', authenticate, (req, res) => {
    if (req.params.id == null) {
        Util.sendResponse(res, resCode.badRequest, 'id not specified');
        return;
    }

    models.results.getCompetitionScores(req.params.id, (rows, err) => {
        if (err) {
            Util.sendResponse(res, resCode.serverError, err.message);
            return;
        }

        Util.sendResponseJson(res, resCode.success, rows);
    });
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

router.get(
    '/competitions/:id/results/:ques_id',
    authenticate,
    loginRequired,
    (req, res) => {
        const user: UserInfo = res.locals.user;
        const competition_id = req.params.id;
        const question_id = req.params.ques_id;

        const after_id = req.query.after;
        var cursor_params;

        if (after_id) {
            cursor_params = {
                skip: 1,
                cursor: {
                    id: parseInt(after_id.toString()),
                },
            };
        }

        if (!competition_id && !question_id) {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }

        const question_filters = {
            deleted_at: null,
            competitions: {
                deleted_at: null,
                id: parseInt(competition_id),
            },
            id: parseInt(question_id),
        };

        client.results
            .findMany({
                where: {
                    user_id: user.id,
                    question: question_filters,
                },
                orderBy: {
                    created_at: 'desc',
                },
                take: 10,
                ...(after_id && cursor_params),
            })
            .then((results) => {
                client.results
                    .count({
                        where: {
                            user_id: user.id,
                            question: question_filters,
                            accepted: true,
                        },
                    })
                    .then((accepted_count) => {
                        client.results
                            .count({
                                where: {
                                    user_id: user.id,
                                    question: question_filters,
                                    accepted: false,
                                },
                            })
                            .then((rejected_count) => {
                                const final_res = {
                                    results: results,
                                    accepted_count: accepted_count,
                                    rejected_count: rejected_count,
                                };
                                Util.sendResponseJson(
                                    res,
                                    resCode.success,
                                    final_res
                                );
                            });
                    });
            })
            .catch((err) => Util.sendResponse(res, resCode.serverError, err));
    }
);

module.exports = router;
