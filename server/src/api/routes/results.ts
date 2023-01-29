import express from 'express';
import { resCode } from '../../config/settings';
import models from '../../database/containers/models';
import { Util } from '../../util/util';
import { authenticate } from '../auth';

var router = express.Router();

router.get('/result/c/:id', (req, res) => {
	if (req.params.id == null) {
		Util.sendResponse(res, resCode.badRequest, 'id not specified');
		return;
	}

	models.results.getCompetitionScores(req.params.id, (rows, err) => {
		if (err) {
			console.log(err);
			Util.sendResponse(res, resCode.serverErrror);
			return;
		}

		Util.sendResponseJson(res, resCode.success, rows);
	});
});

router.get('/result', (req, res) => {
	let user_id = req.query.user_id;
	let competition_id = req.query.competition_id;
	let question_id = req.query.question_id;

	if (!user_id && !competition_id && !question_id) {
		Util.sendResponse(res, resCode.badRequest);
		return;
	}

	authenticate(req, res, (req, res, user) => {
		models.results.findAll(
			{
				user_id: user_id,
				competition_id: competition_id,
				question_id: question_id,
			},
			(rows, err) => {
				if (err) {
					console.log(err);
					Util.sendResponse(res, resCode.serverErrror);
					return;
				}
				Util.sendResponseJson(res, resCode.success, rows);
			}
		);
	});
});

module.exports = router;
