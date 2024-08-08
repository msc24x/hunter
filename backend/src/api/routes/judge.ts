import express from 'express';
import models from '../../database/containers/models';
import { HunterExecutable } from '../../config/types';
import { Util } from '../../util/util';
import { existsSync, readFile, writeFile } from 'fs';
import { authenticate } from '../auth';
import { exec } from 'child_process';
import Container from 'typedi';
import { JudgeService } from '../../services/judgeService';
import { ScoreboardService } from '../../services/scoreboardService';
import { resCode } from '../../config/settings';

const router = express.Router();
const judgeService = Container.get(JudgeService);
const scoreboardService = Container.get(ScoreboardService);

router.post('/execute', (req, res) => {
	const hunterExecutable = req.body.exec as HunterExecutable;
	const samples = req.body.samples as Boolean;

	if (!Util.isValidExecRequest(hunterExecutable)) {
		Util.sendResponse(res, resCode.badRequest, "executable is not valid");
		return;
	}

	authenticate(req, res, (req, res, user) => {
		models.questions.findAll(
			{
				id: hunterExecutable.for.question_id,
				competition_id: hunterExecutable.for.competition_id,
			},
			(questions) => {
				if (questions.length == 0) {
					Util.sendResponse(res, resCode.notFound);
					return;
				}
				models.competitions.findAll(
					{
						id: hunterExecutable.for.competition_id,
					},
					0,
					true,
					async (competitions) => {
						if (competitions.length == 0) {
							Util.sendResponse(res, resCode.notFound);
							return;
						}

						if (
							!models.competitions.isLiveNow(
								hunterExecutable.for.competition_id
							) ||
							!models.competitions.hasNotEnded(
								competitions[0].start_schedule,
								competitions[0].duration
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
							!samples &&
							(!existsSync(
								`${judgeService.filesPath}${Util.getFileName(
									hunterExecutable
								)}_s.txt`
							) ||
								!existsSync(
									`${judgeService.filesPath}${Util.getFileName(
										hunterExecutable
									)}_t.txt`
								))
						) {
							Util.sendResponseJson(res, resCode.success, {
								output: 'HERR:No test cases has been set for this competitions',
							});
							return;
						}

						if (
							samples &&
							(!questions[0].sample_cases ||
								!questions[0].sample_sols)
						) {
							Util.sendResponseJson(res, resCode.success, {
								output: 'HERR:No sample test cases has been set for this competitions',
							});
							return;
						}

						try {
							let resInfo = await judgeService.execute(
								hunterExecutable,
								samples,
								questions[0],
								user
							);

							if (!samples)
								scoreboardService.updateResult(
									user,
									hunterExecutable,
									resInfo.success,
									questions[0].points
								);

							Util.sendResponseJson(res, resCode.success, resInfo);
						} catch (err) {
							console.log(err);
							Util.sendResponse(res, resCode.serverError);
						}
					},
					(err) => {
						if (err) {
							console.log(err);
							Util.sendResponse(res, resCode.serverError);
							return;
						}
					}
				);
			}
		);
	});
});

router.get('/submission/:lang', (req, res) => {
	const competition_id = req.query.competition_id;
	const question_id = req.query.question_id;
	const lang = req.params.lang;

	if (
		!competition_id ||
		!question_id ||
		!['c', 'cpp', 'py', 'js'].includes(lang)
	) {
		Util.sendResponse(res, resCode.badRequest);
		return;
	}

	authenticate(req, res, (req, res, user) => {
		models.questions.findAll({ id: question_id }, (questions) => {
			if (questions.length == 0) {
				Util.sendResponse(res, resCode.notFound, 'no ques');
				return;
			}

			models.competitions.findAll(
				{ id: questions[0].competition_id },
				0,
				-1,
				(competitions) => {
					if (competitions.length == 0) {
						Util.sendResponse(res, resCode.notFound, 'no comp');
						return;
					}

					if (competitions[0].id != competition_id) {
						Util.sendResponse(res, resCode.badRequest);
						return;
					}

					if (
						!competitions[0].public &&
						competitions[0].host_user_id != user.id
					) {
						Util.sendResponse(res, resCode.forbidden);
						return;
					}

					readFile(
						`${judgeService.filesPath}${competition_id}_${question_id}_${user.id}.${lang}`,
						{ encoding: 'utf-8' },
						(err, data) => {
							if (err) {
								if (err.code == 'ENOENT')
									Util.sendResponse(res, resCode.notFound);
								else
									Util.sendResponse(
										res,
										resCode.serverError
									);
								return;
							}
							Util.sendResponseJson(res, resCode.success, {
								data: data,
							});
						}
					);
				},
				(err) => {
					Util.sendResponse(res, resCode.forbidden);
				}
			);
		});
	});
});

module.exports = router;
