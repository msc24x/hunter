import { argon2d, hash, verify } from 'argon2';
import { randomBytes } from 'crypto';
import express, { query, Request, Response } from 'express';
import mysql, { Types } from 'mysql';
import { AppDB } from './database/interface';
import { RegisterRequest } from './database/types';
import cookieParser from 'cookie-parser';
import { Interface } from 'readline';
const argon2 =  require('argon2');

interface User{
  id : string, email : string, name : string
}

const resCode = {
  serverErrror : 503,
  success : 200,
  accepted : 202,
  created : 201,
  badRequest : 400,
  forbidden : 403,
  notFound : 404,
  found  : 302
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
        authenticate(req, res, (req : Request, res : Response, user : User)=>{
          sendResponseJson(res, resCode.accepted, user);
          console.log("Authentication successfull")
        })
      });
    })
  })

})

app.get("/user", (req, res)=>{
  getUser(req, res, (user : User)=>{
    sendResponseJson(res, resCode.found, user);
  })
})

app.get("/authenticate", (req, res)=>{

  authenticate(req, res, (req : Request, res : Response, user : User)=>{
    sendResponseJson(res, resCode.accepted, user);
    console.log("Authentication successfull")
  })

})

app.get("/logout", (req, res)=>{
  console.log("logout requested")
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

function getUser(req:Request, res : Response, callback : Function = (user : User)=>{}, user_id : string = "") {

  let id = req.query.id
  if(user_id != ""){
    id = user_id
  }
  const email = req.query.email

  if(id || email){
    var query = ""
    if(id)
      query = ` select * from users where users.id = "${id}" ; `;
    else if(email)
      query = ` select * from users where users.email = "${email}" ; `

    dbConnection.query(query, (err, rows)=>{
      if(err){
        console.log(err);
        sendResponse(res, resCode.serverErrror);
        return;
      }
      if(rows.length == 0){
        sendResponse(res, resCode.notFound)
        return;
      }
      callback({
        id : rows[0].id,
        email : rows[0].email,
        name : rows[0].name
      });
    })
  }else{
    sendResponse(res, resCode.badRequest)
  }
}

function authenticate(req: Request, res : Response, callback : Function = (req : Request, res : Response, user :  User)=>{}) {

  const email = req.query.email;
  const password = req.query.password;
  const session_id = req.cookies.session_id

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

      getUser(req, res, (user : User)=>{
        callback(req, res, user);
      },
      rows[0].user_id)
    })
  }
  else{
    sendResponse(res, resCode.badRequest);
  }

}

function sendResponse(res : Response , code : number ,msg : string = "") {

  res.status(code).send(msg);
}

function sendResponseJson(res : Response , code : number , body : {
  id : string,
  email : string,
  name : string,
  msg? : string
}) {
  res.status(code).send(body);
}



app.listen(port, ()=>{
    console.log(`Listening for hunter at ${port}`);
})
