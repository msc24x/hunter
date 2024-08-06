import { Response, Request } from 'express';
import { UserInfo } from '../config/types';
import { User } from '../database/models/User';
import { Util } from '../util/util';
import Container from 'typedi';
import { DatabaseProvider } from '../services/databaseProvider';
import models from '../database/containers/models';
import { resCode } from '../config/settings';

const database = Container.get(DatabaseProvider).getInstance();

export type SessionInfo = {
	id?: string,
	user_id: string,
	email: string
}

export function authenticate(
	req: Request,
	res: Response,
	callback: (req: Request, res: Response, user: UserInfo) => void,
	failSilent = false
) {
	const session_id = req.cookies.session_id;
	const githubOAToken = req.cookies.github_token;

	if (!session_id && !githubOAToken) {
		if (failSilent) {
			callback(req, res, { id: '-1', email: '', name: '' });
			return;
		}
		Util.sendResponse(res, resCode.forbidden);
		return;
	}

	if (session_id) {
		database.query(
			` select * from session where id = ?;`,
			[session_id],
			(err, rows) => {
				if (err) {
					console.log(err);
					if (failSilent) {
						callback(req, res, { id: '-1', email: '', name: '' });
						return;
					}
					Util.sendResponse(res, resCode.serverError);
					return;
				}

				var sessions = rows as Array<SessionInfo>;

				if (sessions.length == 0) {
					if (failSilent) {
						callback(req, res, { id: '-1', email: '', name: '' });
						return;
					}
					Util.sendResponse(res, resCode.forbidden);
					return;
				}

				const params = {
					id: sessions[0].user_id,
					email: req.query.email,
				};

				models.users.findAll(params, (err, sessions) => {
					if (err) {
						console.log(err);
						if (failSilent) {
							callback(req, res, {
								id: '-1',
								email: '',
								name: '',
							});
							return;
						}
						Util.sendResponse(res, resCode.serverError);
						return;
					}

					if (sessions.length == 0) {
						if (failSilent) {
							callback(req, res, {
								id: '-1',
								email: '',
								name: '',
							});
							return;
						}
						Util.sendResponse(res, resCode.notFound);
						return;
					}

					callback(req, res, {
						id: sessions[0].id,
						email: sessions[0].email,
						name: sessions[0].name,
					});
				});
			}
		);
	} else if (githubOAToken) {
		const usersModel = new User();

		fetch(`https://api.github.com/user/emails`, {
			headers: {
				Accept: 'application/json',
				Authorization: `token ${githubOAToken}`,
			},
		})
			.then((body) => {
				return body.json();
			})
			.then((body) => {
				let emails = body as Array<{
					email: string;
					primary: boolean;
					verified: boolean;
					visibility: string;
				}>;
				let primaryEmails = emails.filter((val) => val.primary == true);

				if (primaryEmails.length == 0) {
					if (failSilent) {
						callback(req, res, { id: '-1', email: '', name: '' });
						return;
					}
					Util.sendResponse(
						res,
						resCode.serverError,
						'Some error occurred while logging in using github, No primary email detected'
					);
					return;
				}

				let userEmail = primaryEmails[0];

				usersModel.findAll({ email: userEmail.email }, (err, rows) => {
					if (err) {
						console.log(err);
						if (failSilent) {
							callback(req, res, {
								id: '-1',
								email: '',
								name: '',
							});
							return;
						}
						Util.sendResponse(res, resCode.serverError);
						return;
					}

					if (rows == 0) {
						usersModel.add({ email: userEmail.email }, (err) => {
							if (err) {
								console.log(err);
								if (failSilent) {
									callback(req, res, {
										id: '-1',
										email: '',
										name: '',
									});
									return;
								}
								Util.sendResponse(res, resCode.serverError);
								return;
							}

							usersModel.findAll(
								{ email: userEmail.email },
								(err, rows) => {
									if (err || (rows && rows.length == 0)) {
										console.log(err);
										if (failSilent) {
											callback(req, res, {
												id: '-1',
												email: '',
												name: '',
											});
											return;
										}
										Util.sendResponse(
											res,
											resCode.serverError
										);
										return;
									}

									callback(req, res, {
										id: rows[0].id,
										email: rows[0].email,
										name: rows[0].name,
									});
								}
							);
						});
					} else {
						usersModel.findAll(
							{ email: userEmail.email },
							(err, rows) => {
								if (err || (rows && rows.length == 0)) {
									console.log(err);
									if (failSilent) {
										callback(req, res, {
											id: '-1',
											email: '',
											name: '',
										});
										return;
									}
									Util.sendResponse(res, resCode.serverError);
									return;
								}

								callback(req, res, {
									id: rows[0].id,
									email: rows[0].email,
									name: rows[0].name,
								});
							}
						);
					}
				});
			})
			.catch((err) => {
				console.log(err);
				if (failSilent) {
					callback(req, res, { id: '-1', email: '', name: '' });
					return;
				}
				Util.sendResponse(
					res,
					resCode.serverError,
					'Some error occurred while logging in using github, try signing in fresh'
				);
			});
	}
}
