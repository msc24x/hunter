import express, { Request, Response } from 'express';
import { hash, verify } from 'argon2';
import { randomBytes } from 'crypto';
import { UserInfo } from '../../config/types';
import bodyParser from 'body-parser';
import { authenticate } from '../auth';
import { Sanitizer } from '../../util/sanitizer/sanitizer';
import { Util } from '../../util/util';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';
import { resCode } from '../../config/settings';

var router = express.Router();
const database = Container.get(DatabaseProvider).getInstance();

router.use(bodyParser.json());

router.get('/oauth/github', (req, res) => {
	if(req.query.code){
		fetch("https://github.com/login/oauth/access_token", {
			method: "POST",
			body : JSON.stringify({
				client_id : process.env.cid,
				client_secret : process.env.csec,
				code : req.query.code
				}),
			headers: {
				"Accept": "application/json",
				"Content-Type" : "application/json"
			}
			
		}).then(res => {
			return res.json()
		}).then(body =>{
			res.cookie("github_token", body.access_token)
			res.redirect(`https://thehunter.tech`)
		}).catch(err=>{
			console.log(err)
			Util.sendResponse(res, resCode.serverErrror, "Could not get access token")
		})
	}
	else {
		res.redirect(
			`https://github.com/login/oauth/authorize?scope=user:email&client_id=${process.env.cid}`
		);
	}
});

router.get('/authenticate', (req, res) => {
	
	authenticate(req, res, (req: Request, res: Response, user: UserInfo) => {
		Util.sendResponseJson(res, resCode.accepted, user);
	});
});

router.post('/logout', (req, res) => {
	const session_id = req.cookies.session_id;
	const github_token = req.cookies.github_token;
	if (session_id) {
		database.query(
			` delete from session where session.id = ? ; `,
			[session_id],
			(err) => {
				if (err) {
					console.log(err);
					Util.sendResponse(res, resCode.serverErrror);
					return;
				}
				res.clearCookie('session_id');
				Util.sendResponse(res, resCode.success);
			}
		);
	} else if (github_token) {
		res.clearCookie("github_token")
		Util.sendResponse(res, resCode.success);
	} else {
		Util.sendResponse(res, resCode.badRequest);
	}
});

router.post('/register', (req, res) => {
	let name = req.body.name ?? '';
	let email = req.body.email;
	let password = req.body.password;

	if (!(password && email)) {
		Util.sendResponse(res, resCode.badRequest);
		return;
	}

	if (
		!Sanitizer.isEmail(email as string) ||
		!((password as string).length >= 6 && (password as string).length <= 26)
	) {
		Util.sendResponse(res, resCode.badRequest);
		return;
	}

	if (name && (name as string).length > 50) {
		Util.sendResponse(res, resCode.badRequest);
		return;
	}

	const salt: string = randomBytes(8).toString('hex');

	hash(salt + password).then((salted_hash) => {
		database.query(
			` select * from users where email = ?; `,
			[email],
			(err, rows) => {
				if (err) {
					console.log(err);
					Util.sendResponse(res, resCode.serverErrror);
					return;
				}
				if (rows.length != 0) {
					Util.sendResponse(
						res,
						resCode.forbidden,
						'Email Id is already associated with an account'
					);
					return;
				}

				database.query(
					` insert into users(name, email, password_hash, salt) values( ?, ?, ?, ? ); `,
					[name, email, salted_hash, salt],
					(err) => {
						if (err) {
							console.log(err);
							Util.sendResponse(res, resCode.serverErrror);
							return;
						}
						authenticate(
							req,
							res,
							(req: Request, res: Response, user: UserInfo) => {
								Util.sendResponseJson(
									res,
									resCode.success,
									user
								);
							}
						);
					}
				);
			}
		);
	});
});

module.exports = router;
