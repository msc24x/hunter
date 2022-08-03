import express, { Request, Response } from 'express';
import { hash, verify } from 'argon2';
import { randomBytes } from 'crypto';
import { database } from '../../database/database';
import { resCode, UserInfo } from '../../environments/environment';
import { sendResponse, sendResponseJson } from '../app';
import bodyParser from 'body-parser';
import { authenticate } from '../auth';

var router = express.Router()
router.use(bodyParser.json())

var dbConnection = database.getDataBase()

router.get("/authenticate", (req, res)=>{
  authenticate(req, res, (req : Request, res : Response, user : UserInfo)=>{
    sendResponseJson(res, resCode.accepted, user);

  })
})

router.post("/logout", (req, res)=>{

  const session_id = req.cookies.session_id
  if(session_id){
    dbConnection.query(` delete from session where session.id = "${session_id}" ; `, (err)=>{
      if(err){
         console.log(err)
        sendResponse(res, resCode.serverErrror)
        return
      }
      res = res.clearCookie("session_id")
      sendResponse(res, resCode.success)
    })
  }else{
    sendResponse(res, resCode.badRequest)
  }
})

router.get("/register", (req, res) =>{

  if(!(req.query.password && req.query.email)){
    sendResponse(res, resCode.badRequest);
    return
  }

  const salt : string =  randomBytes(8).toString("hex");
  const password = req.query.password

  hash(salt + password).then(salted_hash=>{

    dbConnection.query(` select * from users where users.email = "${req.query.email}"; `, (err, rows)=>{
      if(err){
        sendResponse(res, resCode.serverErrror);
        return;
      }
      if(rows.length != 0){
        sendResponse(res, resCode.forbidden, "UserInfo already exists")
        return;
      }

      dbConnection.query(` insert into users(email, password_hash, salt) values( "${req.query.email}" , "${salted_hash}" , "${salt}" ); `, err=>{
        if(err){
           console.log(err);
          sendResponse(res, resCode.serverErrror);
          return
        }
        authenticate(req, res, (req : Request, res : Response, user : UserInfo)=>{
          sendResponseJson(res, resCode.accepted, user);

        })
      });
    })
  })

})

module.exports = router
