import express, { Request, Response } from 'express';
import models from '../../database/containers/models';
import { CompetitionInfo, UserInfo } from '../../config/types';
import { Util } from '../../util/util';
import { authenticate } from '../auth';
import { resCode } from '../../config/settings';

var router = express.Router();

router.delete('/competition/:id', (req, res) => {
	authenticate(req, res, (req, res, user) => {
		models.competitions.findAll(
			{ id: req.params.id, host_user_id: user.id },
			0,
			-1,
			(competitions) => {
				if (competitions.length == 0) {
					Util.sendResponse(res, resCode.notFound);
					return;
				}

				models.competitions.delete({ id: req.params.id }, (err) => {
					if (err) {
						Util.sendResponse(res, resCode.serverErrror);
						return;
					}
					Util.sendResponse(res, resCode.success);
					models.questions.delete(
						{ competition_id: req.params.id },
						(err) => {
							if (err) {
								console.log(err);
							}
						}
					);
				});
			},
			(err) => {
				Util.sendResponse(res, resCode.serverErrror);
			}
		);
	});
});

router.post('/competition', (req, res) => {
	const title = req.body.title;

	if (title == null || (title as string).length > 120) {
		Util.sendResponse(res, resCode.badRequest);
		return;
	}

	authenticate(req, res, (req: Request, res: Response, user: UserInfo) => {
		models.competitions.add(user.id, title, (err, rows) => {
			if (err) {
				console.log(err);
				Util.sendResponse(res, resCode.serverErrror);
				return;
			}

			res.status(resCode.created).send({ id: rows[0].id });
		});
	});
});

router.put('/competition', (req, res) => {
	const competition = req.body as CompetitionInfo;
	if (
		!competition.host_user_id ||
		competition.title.length > 120 ||
		competition.description.length > 456
	) {
		Util.sendResponse(res, resCode.badRequest);
		return;
	}

	authenticate(req, res, (req: Request, res: Response, user: UserInfo) => {
		const params = {
			id: competition.id,
		};

		models.competitions.findAll(
			params,
			0,
			-1,

			(competitions) => {
				if (
					competitions[0].host_user_id != competition.host_user_id ||
					competitions[0].host_user_id != user.id
				) {
					Util.sendResponse(res, resCode.forbidden);
					return;
				}

				models.competitions.update(competition, (err) => {
					if (err) {
						console.log(err);
						Util.sendResponse(res, resCode.serverErrror);
						return;
					}
					Util.sendResponse(res, resCode.success);
				});
			},

			(err) => {
				console.log(err);
				Util.sendResponse(res, resCode.serverErrror);
			}
		);
	});
});

router.get('/competition/:id', (req, res) => {
	if (req.params.id == '') {
		Util.sendResponse(res, resCode.badRequest);
		return;
	}

	models.competitions.findAll(
		{
			id: req.params.id,
		},
		0,
		-1,

		(competitions) => {
			if (competitions.length == 0) {
				Util.sendResponse(res, resCode.notFound);
				return;
			}

			// send the competition right away if its public
			if (competitions[0].public) {
				Util.sendResponseJson(
					res,
					resCode.success,
					competitions[0]
				);
				return;
			}

			// authenticate in case of not public
			authenticate(
				req,
				res,
				(req: Request, res: Response, user: UserInfo) => {
					if (
						competitions[0].host_user_id != user.id
					) {
						Util.sendResponse(res, resCode.forbidden);
						return;
					}
					Util.sendResponseJson(
						res,
						resCode.success,
						competitions[0]
					);
				}
			);
		},
		() => {}
	);
});

router.get('/competitions', (req, res) => {
	const params = {
		id: req.query.id,
		host_user_id: req.query.host_user_id,
		title: req.query.title,
		duration: req.query.duration,
		live_status: req.query.liveStatus ?? 'all',
	};

	if (params.title && (params.title as string).length > 50) {
		Util.sendResponse(res, resCode.badRequest);
		return;
	}

	if (params.live_status == 'always') params.duration = '0';

	let isPublic: boolean | -1 = true;
	let dateOrder: 1 | 0 | -1 = 0;
	if (req.query.public == 'false') {
		isPublic = false;
	} else if (req.query.public == 'true') {
		isPublic = true;
	} else {
		isPublic = -1;
	}
	if (req.query.dateOrder) {
		if (req.query.dateOrder == '1') {
			dateOrder = 1;
		} else if (req.query.dateOrder == '-1') {
			dateOrder = -1;
		}
	}

	let errCallback = () => {
		Util.sendResponse(res, resCode.serverErrror);
		return 0;
	};

	function sendCompetitions(user : UserInfo) {
		models.competitions.findAll(
		params,
		dateOrder,
		isPublic,
		(competitions: Array<CompetitionInfo>) => {
			let filteredCompetitions: Array<CompetitionInfo> =
				new Array<CompetitionInfo>();
			for (let element of competitions) {
				if (
					params.live_status == 'all' ||
					(params.live_status == 'always' &&
						models.competitions.isLiveNow(
							element.start_schedule
						)) ||
					(params.live_status == 'upcoming' &&
						!models.competitions.isLiveNow(
							element.start_schedule
						)) ||
					(params.live_status == 'live' &&
						models.competitions.isLiveNow(
							element.start_schedule
						) &&
						models.competitions.hasNotEnded(
							element.start_schedule,
							element.duration
						))
				)
					if(element.public)
						filteredCompetitions.push(element);
					else if ( user.id === element.host_user_id) {
						filteredCompetitions.push(element)
					}
			}
			Util.sendResponseJson(
				res,
				resCode.success,
				filteredCompetitions
			);
			return 0;
		},
		errCallback
	);
	}

	authenticate(req, res, (req, res, user) => {
		sendCompetitions(user)
	}, true)
	
});

module.exports = router;
