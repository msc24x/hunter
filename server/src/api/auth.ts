import  express, {Response, Request}from 'express';
import {resCode, UserInfo } from '../environments/environment';
import { verify } from 'argon2';
import { randomBytes } from 'crypto';
import { Types } from 'mysql';
import { sendResponse } from './app';
import { database } from '../database/database';
import { User } from '../database/models/User';

export function authenticate(req: Request, res : Response,
  callback : (req : Request, res : Response, user :  UserInfo)=>void) {

  const email = req.query.email;
  const password = req.query.password;
  const session_id = req.cookies.session_id
  const dbConnection = database.getDataBase()

  if(email && password){

    const users = new User()
    const params = {id : null, email : email, name : null}

    users.findAll(params, (err : any, rows : any)=>{
      if(err){
        console.log(err);
        sendResponse(res, resCode.serverErrror);
        return
      }
      if(rows.length == 0){
        sendResponse(res, resCode.forbidden, "UserInfo does not exists")
        return
      }

      const salt = rows[0].salt as string

      verify(rows[0].password_hash as string,salt+password).then(same=>{
        if(same){
          // sesssion id = 24 char random hex string followed by the user id
          const session_id = randomBytes(12).toString("hex")+rows[0].id;
          dbConnection.query(` delete from session where session.user_id = "${rows[0].id}" ; `)
          if(req.query.remember == "true"){
            console.log("remember me was "+req.query.remember)
            dbConnection.query(` insert into session(id, user_id) values( "${session_id}", "${rows[0].id}" ); `, err=>{
              if(err){
                console.log(err);
                sendResponse(res, resCode.serverErrror);
                return
              }
              res.cookie("session_id", session_id);
              callback(req, res, {id : rows[0].id, email : rows[0].email, name : rows[0].name})
            })
          }else{
            res =   res.clearCookie("remember")
            callback(req, res, {id : rows[0].id, email : rows[0].email, name : rows[0].name})
          }
        }
        else{
          sendResponse(res, resCode.forbidden, "Incorrect password");
        }
      })
    })
  }
  else if(session_id){
    dbConnection.query(` select * from session where session.id = "${session_id}";`, (err, rows)=>{
      if(err){
        console.log(err);
        sendResponse(res, resCode.serverErrror);
        return;
      }
      if(rows.length == 0){
        sendResponse(res, resCode.forbidden);
        return;
      }

      const userModel = new User()

      const params = { id : rows[0].user_id, email : req.query.email, name : req.query.name as string}

      userModel.findAll(params, (err : any, rows : any)=>{
        if(!rows || rows && rows.length == 0){
          sendResponse(res, resCode.notFound)
        }
        else{
          callback(req, res, {id : rows[0].id, email : rows[0].email, name : rows[0].name})
        }
      })
    })
  }
  else{
    sendResponse(res, resCode.badRequest);
  }

}
