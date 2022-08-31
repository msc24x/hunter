import  express, {Response, Request}from 'express';
import {resCode, UserInfo } from '../environments/environment';
import { verify } from 'argon2';
import { randomBytes } from 'crypto';
import { Types } from 'mysql';
import { database } from '../database/database';
import { User } from '../database/models/User';
import { Sanitizer } from '../sanitizer/sanitizer';
import { Util } from '../util/util';
import axios from 'axios'

export function authenticate(req: Request, res : Response,
  callback : (req : Request, res : Response, user :  UserInfo)=>void) {

  let email = req.query.email;
  let password = req.query.password;
  const session_id = req.cookies.session_id
  const githubOAToken = req.query.code
  console.log(githubOAToken)
  const dbConnection = database.getDataBase()

  if(!(email && password)){
    email = req.body.email
    password = req.body.password
  }

  console.log(email, password)
  console.log(req.body.email, req.body.password)

  if(email != null && password != null){

    if(!Sanitizer.isEmail(email as string) || !((password as string).length >= 6 && (password as string).length <= 26)){
      Util.sendResponse(res, resCode.forbidden);
      return
    }

    const users = new User()
    const params = {id : null, email : email}

    users.findAll(params, (err : any, rows : any)=>{
      if(err){
        console.log(err);
        Util.sendResponse(res, resCode.serverErrror);
        return
      }
      if(rows.length == 0){
        Util.sendResponse(res, resCode.notFound)
        return
      }

      const salt = rows[0].salt as string

      verify(rows[0].password_hash as string,salt+password).then(same=>{

        if(!same){
          Util.sendResponse(res, resCode.forbidden)
          return
        }

        const session_id = randomBytes(12).toString("hex")+rows[0].id;

        dbConnection.query(` delete from session where user_id = ? ; `, [rows[0].id], err=>{
          dbConnection.query(` insert into session(id, user_id) values( ?, ? ); `, [session_id, rows[0].id], err=>{
            if(err){
              console.log(err);
              Util.sendResponse(res, resCode.serverErrror);
              return
            }
            res.cookie("session_id", session_id);
            callback(req, res, {id : rows[0].id, email : rows[0].email, name : rows[0].name})
          })
        })        
      })
    })
  }
  else if(session_id){

    if(session_id.length !== 26){
      Util.sendResponse(res, resCode.badRequest)
      return
    }

    dbConnection.query(` select * from session where id = ?;`, [session_id], (err, rows)=>{
      if(err){
        console.log(err);
        Util.sendResponse(res, resCode.serverErrror);
        return;
      }
      if(rows.length == 0){
        Util.sendResponse(res, resCode.forbidden);
        return;
      }

      const userModel = new User()

      const params = { id : rows[0].user_id, email : req.query.email }

      userModel.findAll(params, (err, rows)=>{

        if(err){
          console.log(err)
          Util.sendResponse(res, resCode.serverErrror)
          return
        }

        if(rows.length == 0){
          Util.sendResponse(res, resCode.notFound)
          return
        }
        
        callback(req, res, {id : rows[0].id, email : rows[0].email, name : rows[0].name})
        
      })
    })
  }
  else if(githubOAToken){
    axios.post(`https://github.com/login/oauth/access_token`, 
      {
        method : "post",
        body: JSON.stringify({
          client_id : process.env.cid,
          client_secret : process.env.csec,
          code : githubOAToken
        }),
	      headers: {'Content-Type': 'application/json'}
      }).then(res=>{
        console.log(res)
        Util.sendResponseJson(res, resCode.success, res)
      })
      
  }
  else{
    Util.sendResponse(res, resCode.badRequest);
  }

}
