import express, { Request, Response } from 'express';
import { hash, verify } from 'argon2';
import { randomBytes } from 'crypto';
import { database } from '../../database/database';
import { resCode, UserInfo } from '../../environments/environment';
import bodyParser from 'body-parser';
import { authenticate } from '../auth';
import { Sanitizer } from '../../sanitizer/sanitizer';
import { Util } from '../../util/util';
import { env } from 'process';

var router = express.Router()
router.use(bodyParser.json())

var dbConnection = database.getDataBase()

router.get("/oauth/github", (req, res)=>{
  res.redirect(`https://github.com/login/oauth/authorize?scope=user:email&client_id=${process.env.cid}`)
})

router.get("/authenticate", (req, res)=>{
  authenticate(req, res, (req : Request, res : Response, user : UserInfo)=>{
    Util.sendResponseJson(res, resCode.accepted, user);

  })
})

router.post("/logout", (req, res)=>{

  const session_id = req.cookies.session_id
  if(session_id){
    dbConnection.query(` delete from session where session.id = ? ; `, [session_id], (err)=>{
      if(err){
         console.log(err)
        Util.sendResponse(res, resCode.serverErrror)
        return
      }
      res = res.clearCookie("session_id")
      Util.sendResponse(res, resCode.success)
    })
  }else{
    Util.sendResponse(res, resCode.badRequest)
  }
})

router.post("/register", (req, res) =>{

  let name = req.body.name ?? ""
  let email = req.body.email
  let password = req.body.password

  if(!(password && email)){
    Util.sendResponse(res, resCode.badRequest);
    return
  }

  if(!Sanitizer.isEmail(email as string) || !((password as string).length >= 6 && (password as string).length <= 26)){
    Util.sendResponse(res, resCode.badRequest);
    return
  }

  if(name && (name as string).length > 50){
    Util.sendResponse(res, resCode.badRequest)
    return
  }

  const salt : string =  randomBytes(8).toString("hex");

  hash(salt + password).then(salted_hash=>{

    dbConnection.query(` select * from users where email = ?; `, [email], (err, rows)=>{
      if(err){
        console.log(err)
        Util.sendResponse(res, resCode.serverErrror);
        return;
      }
      if(rows.length != 0){
        Util.sendResponse(res, resCode.forbidden, "Email Id is already associated with an account")
        return;
      }

      dbConnection.query(` insert into users(name, email, password_hash, salt) values( ?, ?, ?, ? ); `, [name, email, salted_hash, salt], err=>{
        if(err){
          console.log(err);
          Util.sendResponse(res, resCode.serverErrror);
          return
        }
        authenticate(req, res, (req : Request, res : Response, user : UserInfo)=>{
          Util.sendResponseJson(res, resCode.success, user);
        })
      });
    })
  })

})

module.exports = router
