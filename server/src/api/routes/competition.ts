import express, {Request, Response} from "express"
import { Competitions } from "../../database/models/Competitions"
import { CompetitionInfo, UserInfo, resCode } from "../../environments/environment"
import { sendResponse, sendResponseJson } from "../app"
import { authenticate } from "../auth"


var router = express.Router()

const competitionsModel = new Competitions()


router.post("/competition", (req, res)=>{

  const title = req.body.title;

  if(title == null || (title as string).length > 120){
    console.log(title)
    sendResponse(res, resCode.badRequest)
    return;
  }

  authenticate(req, res, (req : Request, res : Response, user : UserInfo)=>{


    competitionsModel.add(user.id, title, (err, rows)=>{
      if(err){
        console.log(err)
        sendResponse(res, resCode.serverErrror)
        return
      }

      res.status(resCode.created).send({id : rows[0].id})

    })

  })

})

router.put("/competition", (req, res)=>{
  const competition = req.body as CompetitionInfo
  if(!competition.host_user_id || competition.title.length > 120 || competition.description.length > 456){
    sendResponse(res, resCode.badRequest)
    return
  }

  authenticate(req, res, (req : Request, res : Response, user : UserInfo)=>{

    const params = {
      id : req.query.competition_id
    }

    competitionsModel.findAll(params, 0, -1,

      (competitions)=>{
        if(competitions[0].host_user_id != competition.host_user_id || competitions[0].host_user_id != user.id){
          sendResponse(res, resCode.forbidden)
          return
        }

        competitionsModel.update(competition, (err)=>{
          if(err){
            console.log(err)
            sendResponse(res, resCode.serverErrror)
            return
          }
          sendResponse(res, resCode.success)

        })

      },

      (err)=>{
        console.log(err)
        sendResponse(res, resCode.serverErrror)
      }

    )
  })
})

router.get("/competition", (req, res)=>{
  competitionsModel.findAll(
    {
      id : req.query.competition_id
    } , 0, -1,

    (competitions)=>{

      authenticate(req, res, (req : Request, res : Response, user : UserInfo)=>{
        if(competitions[0].host_user_id != user.id){
          sendResponse(res, resCode.forbidden)
          return
        }
        sendResponseJson(res, resCode.success, competitions[0])
      })

    },
    ()=>{}
  )
})

router.get("/competitions", (req, res)=>{

  console.log("get competitions requested")

  const params = {
    id : req.query.id,
    host_user_id : req.query.host_user_id
  }
  let isPublic = true
  let dateOrder : 1 | 0| -1 = 0
  if(req.query.public == "false"){
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

  let errCallback = ()=>{
    sendResponse(res, resCode.serverErrror)
    return 0
  }

  authenticate(req, res, (req : Request, res : Response, user :  UserInfo)=>{

    competitionsModel.findAll(params, dateOrder, isPublic, (competitions : Array<CompetitionInfo>)=>{
      let filteredCompetitions : Array<CompetitionInfo> = new Array<CompetitionInfo>()
      for(let element of competitions){
        if(element.host_user_id == user.id || element.public)
          filteredCompetitions.push(element)
      }
      sendResponseJson(res, resCode.success, filteredCompetitions)
      return 0
    }, errCallback)
  })


})

module.exports = router
