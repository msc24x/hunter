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
      id : competition.id
    }

    competitionsModel.findAll(params, 0, -1,

      (competitions)=>{
        if(competitions[0].host_user_id != competition.host_user_id || competitions[0].host_user_id != user.id){
          console.log(competition, competitions[0], user)
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

router.get("/competition/:id", (req, res)=>{

  if(req.params.id == ""){
    sendResponse(res, resCode.badRequest)
    return
  }

  competitionsModel.findAll(
    {
      id : req.params.id
    } , 0, -1,

    (competitions)=>{

      if(competitions.length == 0){
        sendResponse(res, resCode.notFound)
        return
      }

      authenticate(req, res, (req : Request, res : Response, user : UserInfo)=>{
        
        if(competitions[0].host_user_id != user.id && !competitions[0].public){
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


  const params = {
    id : req.query.id,
    host_user_id : req.query.host_user_id,
    title : req.query.title,
    duration : req.query.duration,
    live_status : req.query.liveStatus ?? "all"
  }

  if(params.title && (params.title as string).length > 50){
    sendResponse(res, resCode.badRequest)
    return
  }

  if(params.live_status == "always")
    params.duration = "0"

  let isPublic : boolean | -1 = true
  let dateOrder : 1 | 0| -1 = 0
  if(req.query.public == "false"){
    isPublic = false
  }
  else if(req.query.public == "true"){
    isPublic = true
  }
  else{
    isPublic = -1
  }
  if(req.query.dateOrder){
    if(req.query.dateOrder == "1"){
      dateOrder = 1
    }
    else if(req.query.dateOrder == "-1"){
      dateOrder = -1
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
        if((params.live_status == "all" || (params.live_status == "always" && competitionsModel.isLiveNow(element.start_schedule)) || (params.live_status == "upcoming" && !competitionsModel.isLiveNow(element.start_schedule)) || (params.live_status == "live" && competitionsModel.isLiveNow(element.start_schedule) && competitionsModel.hasNotEnded(element.start_schedule, element.duration))))
          if(element.host_user_id == user.id || element.public)
            filteredCompetitions.push(element)
      }
      sendResponseJson(res, resCode.success, filteredCompetitions)
      return 0
    }, errCallback)
  })


})

module.exports = router
