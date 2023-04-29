import express, { Response, Request } from 'express';
import { UserInfo } from '../config/types';
import { verify } from 'argon2';
import { randomBytes } from 'crypto';
import { Types } from 'mysql';
import { User } from '../database/models/User';
import { Sanitizer } from '../util/sanitizer/sanitizer';
import { Util } from '../util/util';
import Container from 'typedi';
import { DatabaseProvider } from '../services/databaseProvider';
import models from '../database/containers/models';
import { resCode } from '../config/settings';

export function authenticate(
	req: Request,
	res: Response,
	callback: (req: Request, res: Response, user: UserInfo) => void,
	failSilent=false
) {
	const database = Container.get(DatabaseProvider).getInstance();

	let email = req.query.email;
	let password = req.query.password;
	const session_id = req.cookies.session_id;
	const githubOAToken = req.cookies.github_token;

	if (!(email && password)) {
		email = req.body.email;
		password = req.body.password;
	}

	if (email != null && password != null) {
		if (
			!Sanitizer.isEmail(email as string) ||
			!(
				(password as string).length >= 6 &&
				(password as string).length <= 26
			)
		) {
			if (failSilent)
				{callback(req, res, {id:"-1",email:"",name:""}); return;}
			Util.sendResponse(res, resCode.forbidden);
			return;
		}

		const params = { id: null, email: email };

		models.users.findAll(params, (err: any, rows: any) => {
			if (err) {
				console.log(err);
				if (failSilent)
					{callback(req, res, {id:"-1",email:"",name:""}); return;}
				Util.sendResponse(res, resCode.serverErrror);
				return;
			}
			if (rows.length == 0) {
				if (failSilent)
					{callback(req, res, {id:"-1",email:"",name:""}); return;}
				Util.sendResponse(res, resCode.notFound);
				return;
			}

			const salt = rows[0].salt as string;

			verify(rows[0].password_hash as string, salt + password).then(
				(same) => {
					if (!same) {
						if (failSilent)
							{callback(req, res, {id:"-1",email:"",name:""}); return;}
						Util.sendResponse(res, resCode.forbidden);
						return;
					}

					const session_id =
						randomBytes(12).toString('hex') + rows[0].id;

					database.query(
						` delete from session where user_id = ? ; `,
						[rows[0].id],
						(err) => {
							database.query(
								` insert into session(id, user_id) values( ?, ? ); `,
								[session_id, rows[0].id],
								(err) => {
									if (err) {
										console.log(err);
										if (failSilent)
											{callback(req, res, {id:"-1",email:"",name:""}); return;}
										Util.sendResponse(
											res,
											resCode.serverErrror
										);
										return;
									}
									res.cookie('session_id', session_id);
									callback(req, res, {
										id: rows[0].id,
										email: rows[0].email,
										name: rows[0].name,
									});
								}
							);
						}
					);
				}
			);
		});
	} else if (session_id) {
		if (session_id.length !== 26) {
			if (failSilent)
				{callback(req, res, {id:"-1",email:"",name:""}); return;}
			Util.sendResponse(res, resCode.badRequest);
			return;
		}

		database.query(
			` select * from session where id = ?;`,
			[session_id],
			(err, rows) => {
				if (err) {
					console.log(err);
					if (failSilent)
						{callback(req, res, {id:"-1",email:"",name:""}); return;}
					Util.sendResponse(res, resCode.serverErrror);
					return;
				}
				if (rows.length == 0) {
					if (failSilent)
						{callback(req, res, {id:"-1",email:"",name:""}); return;}
					Util.sendResponse(res, resCode.forbidden);
					return;
				}

				const params = { id: rows[0].user_id, email: req.query.email };

				models.users.findAll(params, (err, rows) => {
					if (err) {
						console.log(err);
						if (failSilent)
							{callback(req, res, {id:"-1",email:"",name:""}); return;}
						Util.sendResponse(res, resCode.serverErrror);
						return;
					}

					if (rows.length == 0) {
						if (failSilent)
							{callback(req, res, {id:"-1",email:"",name:""}); return;}
						Util.sendResponse(res, resCode.notFound);
						return;
					}

					callback(req, res, {
						id: rows[0].id,
						email: rows[0].email,
						name: rows[0].name,
					});
				});
			}
		);
	} else if (githubOAToken) {
		const usersModel = new User()

		fetch(`https://api.github.com/user/emails`,
		{
			headers : { "Accept" : "application/json", "Authorization" : `token ${githubOAToken}`}
		}
		).then(body => {
			return body.json()
		}).then((body)=>{
			let emails = body as Array<{email :string, primary : boolean, verified : boolean, visibility : string}>
			let primaryEmails = emails.filter(val=> val.primary == true)

			if (primaryEmails.length == 0) {
				if (failSilent)
					{callback(req, res, {id:"-1",email:"",name:""}); return;}
				Util.sendResponse(res, resCode.serverErrror, "Some error occured while logging in using github, No primary email detected")
				return
			}

			let userEmail = primaryEmails[0]

			usersModel.findAll({email : userEmail.email}, (err, rows)=>{
				if(err){
					console.log(err)
					if (failSilent)
						{callback(req, res, {id:"-1",email:"",name:""}); return;}
					Util.sendResponse(res, resCode.serverErrror)
					return
				}

				if(rows == 0){
					usersModel.add({email : userEmail.email}, (err)=>{
					if(err){
						console.log(err)
						if (failSilent)
							{callback(req, res, {id:"-1",email:"",name:""}); return;}
						Util.sendResponse(res, resCode.serverErrror)
						return
					}

					usersModel.findAll({email : userEmail.email}, (err, rows)=>{
						if(err || (rows && rows.length == 0)){
							console.log(err)
							if (failSilent)
								{callback(req, res, {id:"-1",email:"",name:""}); return;}
							Util.sendResponse(res, resCode.serverErrror)
							return
						}

						callback(req, res, {id : rows[0].id, email : rows[0].email, name : rows[0].name})

					})

					})
				}
				else{
					usersModel.findAll({email : userEmail.email}, (err, rows)=>{
						if(err || (rows && rows.length == 0)){
							console.log(err)
							if (failSilent)
								{callback(req, res, {id:"-1",email:"",name:""}); return;}
							Util.sendResponse(res, resCode.serverErrror)
							return
						}

						callback(req, res, {id : rows[0].id, email : rows[0].email, name : rows[0].name})

					})
				}

			})


		}).catch(err=>{
			console.log(err)
			if (failSilent)
				{callback(req, res, {id:"-1",email:"",name:""}); return;}
			Util.sendResponse(res, resCode.serverErrror, "Some error occured while logging in using github, try signing in fresh")
		})
	} else {
		if (failSilent)
			{callback(req, res, {id:"-1",email:"",name:""}); return;}
		Util.sendResponse(res, resCode.badRequest);
	}
}
