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

router.get(
    '/competitions/:id/results',
    authenticate,
    loginRequired,
    (req, res) => {
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

        // client.results
        //     .groupBy({
        //         by: ['user_id'],
        //         where: {
        //             question: {
        //                 competition_id: parseInt(req.params.id),
        //                 competitions: {
        //                     deleted_at: null,
        //                 },
        //                 deleted_at: null,
        //             },
        //         },
        //         _sum: {
        //             result: true,
        //         },
        //         orderBy: {
        //             _sum: {
        //                 result: 'desc',
        //             },
        //         },
        //     })
        //     .then((results) => {
        //         Util.sendResponseJson(res, resCode.success, results);
        //     })
        //     .catch((err) => Util.sendResponse(res, resCode.serverError, err));
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

        if (!competition_id && !question_id) {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }

        client.results
            .findMany({
                where: {
                    user_id: user.id,
                    question: {
                        deleted_at: null,
                        competitions: {
                            deleted_at: null,
                            id: parseInt(competition_id),
                        },
                        id: parseInt(question_id),
                    },
                },
                orderBy: {
                    created_at: 'desc',
                },
            })
            .then((results) => {
                Util.sendResponseJson(res, resCode.success, results);
            })
            .catch((err) => Util.sendResponse(res, resCode.serverError, err));

        // models.results.findAll(
        //     {
        //         user_id: user.id,
        //         competition_id: competition_id,
        //         question_id: question_id,
        //     },
        //     (rows, err) => {
        //         if (err) {
        //             console.log(err);
        //             Util.sendResponse(res, resCode.serverError);
        //             return;
        //         }
        //         Util.sendResponseJson(res, resCode.success, rows);
        //     }
        // );
    }
);

module.exports = router;
