import express, { Request, Response } from 'express';
import models from '../../database/containers/models';
import { UserInfo } from '../../config/types';
import { Util } from '../../util/util';
import { authenticate } from '../auth';
import { resCode } from '../../config/settings';

var router = express.Router();

router.get('/user', (req, res) => {
	models.users.findAll(
		{ id: req.query.id, email: req.query.email },
		(err, rows: UserInfo[]) => {
			if (err) {
				Util.sendResponse(res, resCode.serverError);
				return;
			}

			if (rows.length == 0) {
				Util.sendResponse(res, resCode.notFound);
				return;
			}

			rows[0].email = '';
			Util.sendResponseJson(res, resCode.success, rows[0]);
		}
	);
});

router.put('/user', (req, res) => {
	const updateUser = req.body as UserInfo;

	if (updateUser.id == null || updateUser.name.length > 50) {
		Util.sendResponse(res, resCode.badRequest);
		return;
	}

	authenticate(req, res, (req: Request, res: Response, user: UserInfo) => {
		if (user.id != updateUser.id) {
			Util.sendResponse(res, resCode.forbidden);
			return;
		}

		models.users.update(updateUser, (err) => {
			if (err) {
				console.log(err);
				Util.sendResponse(res, resCode.serverError);
				return;
			}
			Util.sendResponse(res, resCode.success);
		});
	});
});

module.exports = router;
