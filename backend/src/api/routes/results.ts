import express from 'express';
import { resCode } from '../../config/settings';
import models from '../../database/containers/models';
import { Util } from '../../util/util';
import { authenticate, loginRequired } from '../auth';
import { UserInfo } from '../../config/types';

const router = express.Router();

router.get('/result/c/:id', authenticate, loginRequired, (req, res) => {
    if (req.params.id == null) {
        Util.sendResponse(res, resCode.badRequest, 'id not specified');
        return;
    }

    models.results.getCompetitionScores(req.params.id, (rows, err) => {
        if (err) {
            console.log(err);
            Util.sendResponse(res, resCode.serverError);
            return;
        }

        Util.sendResponseJson(res, resCode.success, rows);
    });
});

router.get('/result', authenticate, loginRequired, (req, res) => {
    const user: UserInfo = res.locals.user;
    const competition_id = req.query.competition_id;
    const question_id = req.query.question_id;

    if (!competition_id && !question_id) {
        Util.sendResponse(res, resCode.badRequest);
        return;
    }

    models.results.findAll(
        {
            user_id: user.id,
            competition_id: competition_id,
            question_id: question_id,
        },
        (rows, err) => {
            if (err) {
                console.log(err);
                Util.sendResponse(res, resCode.serverError);
                return;
            }
            Util.sendResponseJson(res, resCode.success, rows);
        }
    );
});

module.exports = router;
