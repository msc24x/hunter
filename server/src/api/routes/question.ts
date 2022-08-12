import express, {Request, Response} from "express"
import { existsSync, fstat, open, openSync, readFile, writeFile } from "fs"
import { Competitions } from "../../database/models/Competitions"
import { Questions } from "../../database/models/Questions"
import { CompetitionInfo, QuestionInfo, resCode, UserInfo } from "../../environments/environment"
import { sendResponse, sendResponseJson } from "../app"
import { authenticate } from "../auth"

var router = express.Router()

const competitionsModel = new Competitions()
const questionsModel = new Questions()


router.get("/question/:id/:fileType/:op?", (req, res)=>{

  let id = req.params.id
  let fileType = req.params.fileType

  if(id == null){
    sendResponse(res, resCode.badRequest)
    return
  }

  authenticate(req, res,  (req : Request, res : Response, user :  UserInfo)=>{

    questionsModel.findAll({
      id : id
    },
    (questions : Array<QuestionInfo>)=>{
      
      if(questions.length == 0){
        sendResponse(res, resCode.notFound)
        return
      }

      competitionsModel.findAll(
        {
          id : questions[0].competition_id
        },
        0,
        -1,
        competitions=>{
          if(competitions.length == 0){
            // todo : delete all questions
            sendResponse(res, resCode.notFound)
            return
          }

          let fileName = `src/database/files/${competitions[0].id}_${id}_${fileType[0]}.txt`
          console.log(fileName)

          if(competitions[0].host_user_id == user.id){
            if(req.params.op == "download"){
              if(existsSync(fileName)){
                readFile(fileName, {encoding : "utf-8"}, (err, data)=>{
                  if(err){
                    sendResponse(res, resCode.serverErrror)
                    return
                  }
                  sendResponseJson(res, resCode.success, {exists : true, data : data})
                })
              }
              else{
                sendResponseJson(res, resCode.success, {exists : false})
              }
              
            }
            else{
              sendResponseJson(res, resCode.success, {exists : existsSync(fileName)})
            }
          }
          else{
            sendResponse(res, resCode.forbidden)
          }
        },
        err=>{

        }
      )
    })

  })

})

router.post("/question/:id/:fileType", (req, res)=>{
  if(!req.params.id){
    sendResponse(res, resCode.badRequest)
    return
  }

  const fileType = req.params.fileType
  const file = req.body.file

  console.log(fileType)

  if(!file || !fileType){
    sendResponse(res, resCode.badRequest)
    return
  }
  if(! ["testcases", "solutions"].includes(fileType)){
    sendResponse(res, resCode.badRequest)
    return
  }

  if(file.length > 1572864){
    sendResponse(res, resCode.badRequest)
    return
  }

  authenticate(req, res, (req, res, user)=>{
    questionsModel.findAll({id : req.params.id}, questions =>{


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

          sendResponse(res, resCode.forbidden)
          return
        }
        let fileName = `src/database/files/${competitions[0].id}_${questions[0].id}_${fileType[0]}.txt`

        writeFile(fileName, file, {flag : "w"}, err=>{
          if(err){
             console.log(err)
            sendResponse(res, resCode.serverErrror)
            return
          }
          sendResponse(res, resCode.success)
        })

      }, ()=>{})
    })
  })

})

router.delete("/question/:id", (req, res)=>{
  if(!req.params.id){
    sendResponse(res, resCode.badRequest)
    return
  }

  authenticate(req, res, (req, res, user)=>{
    questionsModel.findAll({id : req.params.id}, questions =>{


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

          sendResponse(res, resCode.forbidden)
          return
        }

        questionsModel.delete({ id : req.params.id as string}, err =>{
          if(!err){
            sendResponse(res, resCode.success)
            return
          }
        })

      }, ()=>{})
    })
  })


})

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
/**
 * GET question
 *  authenticate
 *    get competition associated
 *    private competition
 *      if same host
 *        send
 *      if diff host
 *        forbid
 *    public competition
 *      if same host
 *        send
 *      if diff host
 *        if live
 *          if duration 0
 *            send
 *          else if time < live + duration
 *            send
 *          else 
 *            forbid
 *        if not live
 *          forbid
 *      
 *   
 */



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
      
      if(questions.length == 0){
        sendResponseJson(res, resCode.success, questions)
        return
      }

      competitionsModel.findAll(
        {
        id : questions[0].competition_id
        },
        0,
        -1,
        competitions=>{
          if(competitions.length == 0){
            // todo : delete all questions
            sendResponse(res, resCode.notFound)
            return
          }

          if(competitions[0].public){
            if(competitions[0].host_user_id == user.id){
              sendResponseJson(res, resCode.success, questions)
            }else{
              if(competitionsModel.isLiveNow(competitions[0].start_schedule)){
                if(competitions[0].duration == 0){
                  sendResponseJson(res, resCode.success, questions)
                }else{
                  if(competitionsModel.hasNotEnded(competitions[0].start_schedule, competitions[0].duration)){
                    sendResponseJson(res, resCode.success, questions)
                  }else{
                    sendResponse(res, resCode.forbidden, "has ended")

                  }
                }
              }
              else{
                sendResponse(res, resCode.forbidden, "is not live yet")
              }
            }
          }else{
            if(competitions[0].host_user_id == user.id){
              sendResponseJson(res, resCode.success, questions)
            }else{
              sendResponse(res, resCode.forbidden, "not host")
            }
          }

        },
        err=>{

        }
      )
    })

  })

})


module.exports = router
