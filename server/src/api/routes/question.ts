import express, {Request, Response} from "express"
import { Competitions } from "../../database/models/Competitions"
import { Questions } from "../../database/models/Questions"
import { CompetitionInfo, QuestionInfo, resCode, UserInfo } from "../../environments/environment"
import { sendResponse, sendResponseJson } from "../app"
import { authenticate } from "../auth"

var router = express.Router()

const competitionsModel = new Competitions()
const questionsModel = new Questions()



router.post("/question", (req, res)=>{
  authenticate(req, res, (req : Request, res : Response, user :  UserInfo)=>{
    competitionsModel.findAll(
      {id : req.body.competition_id},
      0,
      -1,
      (competitions)=>{
        if(competitions.length == 0){
          sendResponse(res, resCode.notFound)
          return
        }

        const competition = competitions[0]
        if(competition.host_user_id != user.id){
          sendResponse(res, resCode.forbidden);
          return
        }
        questionsModel.add(
          competition.id,
          (question_id)=>{
            sendResponse(res, resCode.success)
          },
          (err)=>{
            console.log(err)
            sendResponse(res, resCode.serverErrror)
          }
        )
      },

      (err)=>{
        console.log(err)
        sendResponse(res, resCode.serverErrror)
      }
    )
  })
})

router.put("/question", (req, res)=>{
  var params = req.body

  console.log(params)

  authenticate(req, res, (req, res, user)=>{
    questionsModel.findAll({id : params.id}, (questions)=>{
      if(questions.length == 0){
        sendResponse(res, resCode.notFound)
        return
      }
      competitionsModel.findAll({id : questions[0].competition_id}, 0, -1, competitions=>{
        if(competitions.length == 0){
          sendResponse(res, resCode.notFound)
          return
        }

        if(competitions[0].host_user_id != user.id){
          console.log(competitions[0], user, req.query)
          sendResponse(res, resCode.forbidden)
          return
        }

        questionsModel.update(params, err =>{
          if(err){
            console.log(err)
            sendResponse(res, resCode.serverErrror)
            return
          }

          sendResponse(res, resCode.success)
        })

      },
      ()=>{}
      )
    })
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

    questionsModel.findAll({
      competition_id : competition_id,
      id : id
    },
    (questions : Array<QuestionInfo>)=>{
      sendResponseJson(res, resCode.success, questions)
    })


  })

})


module.exports = router
