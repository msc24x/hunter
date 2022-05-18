import express, {Request, Response} from "express"
import { database } from "../../database/database"
import { CompetitionInfo, QuestionInfo, resCode, UserInfo } from "../../database/types"
import { sendResponse, sendResponseJson } from "../app"
import { authenticate } from "../auth"
import { getCompetition } from "./competition"


var router = express.Router()

var dbConnection = database.getDataBase()


router.post("/question", (req, res)=>{
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

router.get("/question", (req, res)=>{

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


export function addQuestion(
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

export function getQuestions(
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




module.exports = router
