import { argon2d, hash, verify } from 'argon2';
import { randomBytes } from 'crypto';
import express, { query, Request, response, Response } from 'express';
import mysql, { Types } from 'mysql';
import { AppDB } from './database/interface';
import { RegisterRequest } from './database/types';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { Interface } from 'readline';
import { rmSync } from 'fs';
import { request } from 'http';
const argon2 =  require('argon2');

interface User{
  id : string, email : string, name : string
}
interface CompetitionInfo{
  id : string,
  host_user_id : string,
  title : string,
  description : string,
  created_on : string,
  rating : number,
  public : boolean
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
app.use(bodyParser.json())

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

app.post("/create/competition", (req, res)=>{

  const title = req.body.title;

  if(title == null || (title as string).length > 50){
    console.log(title)
    sendResponse(res, resCode.badRequest)
    return;
  }

  authenticate(req, res, (req : Request, res : Response, user : User)=>{
    dbConnection.query(` insert into competitions( host_user_id, title, created_on, rating, public) values( ${user.id}, "${title}", NOW() , 0, false )  ;`, (err)=>{
      if(err){
        console.log(err)
        sendResponse(res, resCode.serverErrror)
        return
      }
      dbConnection.query(`select * from competitions where host_user_id = "${user.id}" order by created_on desc;`, (err, rows)=>{
        if(err){
          console.log(err)
          sendResponse(res, resCode.serverErrror)
          return
        }

        res.send({status : resCode.created, id : rows[0].id})
      })
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

app.post("/logout", (req, res)=>{
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

app.put("/competition", (req, res)=>{
  const competition = req.body as CompetitionInfo
  if(!competition.host_user_id){
    sendResponse(res, resCode.badRequest)
    return
  }

  authenticate(req, res, (req : Request, res : Response, user : User)=>{

    getCompetition(req, res, (competition_db : CompetitionInfo)=>{
      if(
            competition_db.host_user_id == competition.host_user_id
        &&  competition_db.host_user_id == user.id
        ){
          console.log(competition)
          dbConnection.query(`update competitions set title = "${competition.title}", description = "${competition.description}", public = ${competition.public} where id = "${competition.id}" ; `, (err)=>{
            if(err){
              sendResponse(res, resCode.serverErrror)
              return
            }
            sendResponse(res, resCode.success)
          })
        }
        else{
          sendResponse(res, resCode.forbidden)
          return
        }
    }, competition.id)

  })
})

app.get("/competition", (req, res)=>{
  getCompetition(req, res, (competition : CompetitionInfo)=>{
    sendResponseJson(res, resCode.found, competition)
  })
})


function getCompetition(
  req : Request ,
  res : Response,
  callback : Function = (competition : CompetitionInfo)=>{},
  competition_id : string = ""){
    let cid = req.query.competition_id

    if(cid == null && competition_id == ""){
      sendResponse(res, resCode.badRequest)
      return
    }
    else if(competition_id != ""){
      cid = competition_id
    }

    dbConnection.query(`select * from competitions where id = "${cid}" ; `, (err, rows)=>{
      if(err){
        console.log(err)
        sendResponse(res, resCode.serverErrror)
        return
      }
      if(rows.length == 0){
        sendResponse(res, resCode.notFound)
        return
      }
      const row : CompetitionInfo = rows[0]

      const comp = {
        id : row.id,
        host_user_id : row.host_user_id,
        title : row.title,
        description : row.description,
        created_on : row.created_on,
        rating : row.rating,
        public : row.public
      }

      callback(comp)

    })

}

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

function authenticate(req: Request, res : Response,
  callback : Function = (req : Request, res : Response, user :  User)=>{}) {

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
  console.log("sending rescode ", code)
  res.status(code).send(msg);
}

function sendResponseJson(res : Response , code : number , body : {
  id : string,
  email : string,
  name : string,
  msg? : string
} |
{
  id : string,
  title : string
} | CompetitionInfo) {
  res.status(code).send(body);
}



app.listen(port, ()=>{
    console.log(`Listening for hunter at ${port}`);
})
