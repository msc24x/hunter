import { argon2d, hash, verify } from 'argon2';
import { randomBytes } from 'crypto';
import express, { query, Request, response, Response } from 'express';
import mysql, { Types } from 'mysql';
import { CompetitionInfo, HunterExecutable, QuestionInfo, RegisterRequest, resCode, UserInfo } from './database/types';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { send } from 'process';
import { exec } from 'child_process';
import { writeFile } from 'fs';
const argon2 =  require('argon2');

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
          console.log("Authentication successfull")
        })
      });
    })
  })

})


app.get("/user", (req, res)=>{
  getUser(req, res, (user : UserInfo)=>{
    sendResponseJson(res, resCode.found, user);
  })
})

app.put("/user", (req, res)=>{

  const updateUser = req.body as UserInfo

  if(updateUser.id == null){
    sendResponse(res, resCode.badRequest)
    return
  }

  authenticate(req, res, (req : Request, res : Response, user : UserInfo)=>{
    if(user.id != updateUser.id){
      sendResponse(res, resCode.forbidden)
      return
    }
    dbConnection.query(` update users set name = "${updateUser.name}" where id = "${user.id}" ; `,(err)=>{
      if(err){
        console.log(err)
        sendResponse(res, resCode.serverErrror);
        return
      }
      sendResponse(res, resCode.success);
    })
  })
})

app.get("/authenticate", (req, res)=>{
  authenticate(req, res, (req : Request, res : Response, user : UserInfo)=>{
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

app.post("/competition", (req, res)=>{

  const title = req.body.title;

  if(title == null || (title as string).length > 120){
    console.log(title)
    sendResponse(res, resCode.badRequest)
    return;
  }

  authenticate(req, res, (req : Request, res : Response, user : UserInfo)=>{
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

app.put("/competition", (req, res)=>{
  const competition = req.body as CompetitionInfo
  if(!competition.host_user_id || competition.title.length > 120 || competition.description.length > 456){
    sendResponse(res, resCode.badRequest)
    return
  }

  authenticate(req, res, (req : Request, res : Response, user : UserInfo)=>{

    getCompetition(req, res, (competition_db : CompetitionInfo)=>{
      if(
            competition_db.host_user_id == competition.host_user_id
        &&  competition_db.host_user_id == user.id
        ){
          console.log(competition)
          dbConnection.query(`update competitions set title = "${competition.title}", description = "${competition.description}", public = ${competition.public}, duration = "${competition.duration}", start_schedule = "${competition.start_schedule}" where id = "${competition.id}" ; `, (err)=>{
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

app.get("/competitions", (req, res)=>{

  console.log("get competitions requested")

  const params = {
    id : req.query.id,
    host_user_id : req.query.host_user_id
  }
  let isPublic = true
  let dateOrder : 1 | 0| -1 = 0
  if(req.query.public != "false"){
    isPublic = false
  }
  if(req.query.dateOrder){
    if(req.query.dateOrder == "1"){
      dateOrder = 1
    }
    else if(req.query.dateOrder == "0"){
      dateOrder = 0
    }
  }
  let callback = (competitions : Array<CompetitionInfo>)=>{
    sendResponseJson(res, resCode.found, competitions)
    return 0
  }
  let errCallback = ()=>{
    sendResponse(res, resCode.serverErrror)
    return 0
  }

  if(!isPublic && params.host_user_id != null){
    authenticate(req, res, (req : Request, res : Response, user :  UserInfo)=>{
      if(user.id != params.host_user_id){
        sendResponse(res, resCode.forbidden)
        return
      }
      getCompetitions(params, dateOrder, isPublic, callback, errCallback)
    })
  }
  else if(!isPublic){
    isPublic = true
    getCompetitions(params, dateOrder, isPublic, callback, errCallback)
  }

})

app.post("/question", (req, res)=>{
  authenticate(req, res, (req : Request, res : Response, user :  UserInfo)=>{
    getCompetition(req, res, (competition : CompetitionInfo)=>{
      if(competition.host_user_id != user.id){
        sendResponse(res, resCode.forbidden);
        return
      }
      addQuestion(competition.id, (question_id : string)=>{
        sendResponse(res, resCode.success)
      },
      (err : number)=>{
        sendResponse(res, err)
      })
    }, req.body.competition_id as string)
  })
})

app.get("/question", (req, res)=>{

  var competition_id : string | null = req.query.competition_id as string
  var id : string | null = req.query.id  as string

  if(competition_id == null && id == null){
    sendResponse(res, resCode.badRequest)
    return
  }

  authenticate(req, res,  (req : Request, res : Response, user :  UserInfo)=>{
    getQuestions(
      {
        competition_id : competition_id,
        id : id
      },
      (questions : Array<QuestionInfo>)=>{
        sendResponseJson(res, resCode.success, questions)
      },
      (err : number)=>{
        sendResponse(res, err)
      }
    )

  })

})

function isValidExecRequest(exec : HunterExecutable) : boolean{

  const langs = ["c", "cpp", "py", "js"]

  try {
    if(
      exec.for.competition_id &&
      exec.for.question_id &&
      exec.solution.code &&
      langs.includes(exec.solution.lang)
    ) return true

  } catch (error) {
    return false
  }

  return false;
}

app.post("/upload", (req, res)=>{
  const fileType = req.body.fileType
  const file = req.body.file

  if(!file || !fileType){
    sendResponse(res, resCode.badRequest)
    return
  }
  if(["tests", "sols".includes(fileType as string)]){
    sendResponse(res, resCode.badRequest)
    return
  }

  sendResponse(res, resCode.serverErrror, "not implemented")

})

function getFileName(hunterExecutable : HunterExecutable){
  return `${hunterExecutable.for.competition_id}${hunterExecutable.for.question_id}`
}

app.post("/execute", (req, res)=>{
  const hunterExecutable = req.body as HunterExecutable

  if(!isValidExecRequest(hunterExecutable)){
    sendResponse(res, resCode.badRequest)
  }
  console.log(getFileName(hunterExecutable))
  writeFile(`src/database/files/c${getFileName(hunterExecutable)}.${hunterExecutable.solution.lang}`, hunterExecutable.solution.code, {flag:"w+"}, (err)=>{
    if(err){
      console.log(err)
      sendResponse(res, resCode.serverErrror)
      return
    }
    exec(`D:/projects/RedocX/Hunter/server/src/runTests.bat "${getFileName(hunterExecutable)}" "${hunterExecutable.solution.lang}"`, (error, stdout, stderr)=>{
      if(error){
        console.log(stderr)
        sendResponse(res, resCode.serverErrror)
        return
      }
      sendResponse(res, resCode.success, stdout)
    })
  } )





})


function getQuestions(
  params : {competition_id : string | null, id : string | null },
  callback : (questions : Array<QuestionInfo>)=>any,
  errCallback : (err: number)=>any
){
  let query = "select * from questions where true = true "
  if(params.competition_id != null){
    query += `and competition_id = "${params.competition_id}" `
  }
  if(params.id != null){
    query += `and id = "${params.id}" `
  }
  query += ";"

  dbConnection.query(query, (err, rows)=>{
    if(err){
      console.log(err)
      errCallback(resCode.serverErrror)
      return
    }

    let questions : Array<QuestionInfo> = []
    for(const row of rows){
      questions.push(
        {
          id : row.id,
          competition_id : row.competition_id,
          title : row.title,
          statement : row.statement,
          created_on : row.date_created,
          points : row.points,
          solutions_id : row.solutions_id,
          tests_id : row.tests_id
        } as QuestionInfo
      )
    }
    callback(questions as  Array<QuestionInfo>)
  })
}


function getCompetitions(
  params : any,
  dateOrder : 1 | 0 | -1,
  isPublic : boolean,
  callback : (competitions : Array<CompetitionInfo>)=>{},
  errCallback : ()=>{}
){

  let query = "select * from competitions where true = true "
  if(params.id != null){
    query += `and id = "${params.id}" `
  }
  if(params.host_user_id != null){
    query += `and host_user_id = "${params.host_user_id}" `
  }
  if(isPublic){
    query += `and public = ${isPublic} `
  }
  switch(dateOrder){
    case 1:
      query += `order by created_on `
      break
    case -1:
      query += `order by created_on desc`
      break
  }
  query += ";"
  console.log(query)

  dbConnection.query(query, (err, rows)=>{
    if(err){
      console.log(err)
      errCallback()
      return
    }
    callback(rows as Array<CompetitionInfo>);
  })

}

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
        public : row.public,
        duration : row.duration,
        start_schedule : row.start_schedule
      } as CompetitionInfo

      callback(comp)

    })

}

function getUser(req:Request, res : Response, callback : Function = (user : UserInfo)=>{}, user_id : string = "") {

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
  callback : Function = (req : Request, res : Response, user :  UserInfo)=>{}) {

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

      getUser(req, res, (user : UserInfo)=>{
        callback(req, res, user);
      },
      rows[0].user_id)
    })
  }
  else{
    sendResponse(res, resCode.badRequest);
  }

}

function sendResponse(res : any , code : number ,msg : string = "") {
  console.log("sending rescode ", code)
  res.status(code).send(msg);
}

function sendResponseJson(res : any , code : number , body : {
  id : string,
  email : string,
  name : string,
  msg? : string
} |
{
  id : string,
  title : string
} | CompetitionInfo | Array<CompetitionInfo> | any) {
  res.status(code).send(body);
}

function addQuestion(
    competition_id : string,
    callback : (question_id : string)=>any,
    errCallback : (err: number)=>any
  ){
  dbConnection.query(` insert into questions (competition_id, date_created) values("${competition_id}", NOW()) ; `,err=>{
    if(err){
      errCallback(resCode.serverErrror)
      return
    }
    dbConnection.query(` select * from questions where competition_id = "${competition_id}" order by date_created ;`, (err, rows)=>{
      if(err || rows.length == 0){
        errCallback(resCode.serverErrror)
        return
      }
      callback(rows[0].id)
    })
  })
}


app.listen(port, ()=>{
    console.log(`Listening for hunter at ${port}`);
})
