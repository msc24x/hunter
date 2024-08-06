import express, { Request, Response } from 'express';
import { UserInfo } from '../../config/types';
import bodyParser from 'body-parser';
import { authenticate } from '../auth';
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
				client_id : process.env.CID,
				client_secret : process.env.CSEC,
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
			res.redirect(`${process.env.PROTOCOL}://${process.env.DOMAIN}`)
		}).catch(err=>{
			console.log(err)
			Util.sendResponse(res, resCode.serverError, "Could not get access token")
		})
	}
	else {
		res.redirect(
			`https://github.com/login/oauth/authorize?scope=user:email&client_id=${process.env.CID}`
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
					Util.sendResponse(res, resCode.serverError);
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

module.exports = router;
