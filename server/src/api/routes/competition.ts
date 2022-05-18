import express, {Request, Response} from "express"
import { database } from "../../database/database"
import { CompetitionInfo, resCode, UserInfo } from "../../database/types"
import { sendResponse, sendResponseJson } from "../app"
import { authenticate } from "../auth"


var router = express.Router()

var dbConnection = database.getDataBase()


router.post("/competition", (req, res)=>{

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

        res.status(resCode.created).send({id : rows[0].id})
      })
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

    getCompetition(req, res, (competition_db : CompetitionInfo)=>{
      if(
            competition_db.host_user_id == competition.host_user_id
        &&  competition_db.host_user_id == user.id
        ){
          console.log(competition)
          dbConnection.query(`update competitions set title = "${competition.title}", description = "${competition.description}", public = ${competition.public}, duration = "${competition.duration}", start_schedule = "${competition.start_schedule}" where id = "${competition.id}" ; `, (err)=>{
            if(err){
              console.log(err)
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

router.get("/competition", (req, res)=>{
  getCompetition(req, res, (competition : CompetitionInfo)=>{
    sendResponseJson(res, resCode.found, competition)
  })
})

router.get("/competitions", (req, res)=>{

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


export function getCompetitions(
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

export function getCompetition(
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



module.exports = router
