import { argon2d, hash, verify } from 'argon2';
import { randomBytes } from 'crypto';
import express, { query, Request, Response } from 'express';
import mysql, { Types } from 'mysql';
import { AppDB } from './database/interface';
import { RegisterRequest } from './database/types';
import cookieParser from 'cookie-parser';
const argon2 =  require('argon2');

const resCode = {
  serverErrror : 503,
  success : 200,
  accepted : 202,
  created : 201,
  badRequest : 400,
  forbidden : 403
}

const app = express();
app.use(cookieParser())

const dbConnection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database : "hunter_db"
});

dbConnection.connect(err=>{
  if(err){
    console.log(err);
    return
  }
  console.log("Connected to hunter_db");
});

const port = 8080;

app.get("/", (req, res) => {
  res.status(200).send("This is the Hunter's berry dangerous backend route");
})

app.get("/register", (req, res) =>{

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
        sendResponse(res, resCode.forbidden, "User already exists")
        return;
      }

      dbConnection.query(` insert into users(email, password_hash, salt) values( "${req.query.email}" , "${salted_hash}" , "${salt}" ); `, err=>{
        if(err){
          console.log(err);
          sendResponse(res, resCode.serverErrror);
          return
        }
        sendResponse(res, resCode.created);
      });
    })
  })

})

function authenticate(req: Request, res : Response, callback : Function = ()=>{}) {

  const email = req.query.email;
  const password = req.query.password;

  if(email && password){
    dbConnection.query(` select * from users where users.email = "${email}";`, (err, rows)=>{
      if(err){
        console.log(err);
        sendResponse(res, resCode.serverErrror);
        return
      }
      if(rows.length == 0){
        sendResponse(res, resCode.forbidden, "User does not exists")
        return
      }

      const salt = rows[0].salt as string

      verify(rows[0].password_hash as string,salt+password).then(same=>{
        if(same){
          // sesssion id = 24 char random hex string followed by the user id
          const session_id = randomBytes(12).toString("hex")+rows[0].id;
          dbConnection.query(` delete from session where session.user_id = "${rows[0].id}" ; `)
          if(req.query.remember == "true"){
            dbConnection.query(` insert into session(id, user_id) values( "${session_id}", "${rows[0].id}" ); `, err=>{
              if(err){
                console.log(err);
                sendResponse(res, resCode.serverErrror);
                return
              }
              res.cookie("session_id", session_id);
              sendResponse(res, resCode.accepted, );
              callback()
            })
          }else{
            res =   res.clearCookie("remember")
            sendResponse(res, resCode.accepted);
            callback()
          }
        }
        else{
          sendResponse(res, resCode.forbidden, "Incorrect password");
        }
      })
    })
  }
  else if(req.cookies.session_id){
    const session_id = req.cookies.session_id;

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
      sendResponse(res, resCode.accepted);
      callback()
    })
  }
  else{
    sendResponse(res, resCode.badRequest);
  }

}

app.get("/authenticate", (req, res)=>{

  authenticate(req, res, ()=>{
    console.log("Authentication successfull")
  })

})

function sendResponse(res : Response , code : number ,msg : string = "") {
  res.status(code).send(msg);
}



app.listen(port, ()=>{
    console.log(`Listening for hunter at ${port}`);
})
