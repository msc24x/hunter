import express, {Request, Response} from "express"
import { User } from "../../database/models/User"
import { resCode, UserInfo } from "../../environments/environment"
import { sendResponse, sendResponseJson } from "../app"
import { authenticate } from "../auth"


var router = express.Router()

const userModel = new User()

router.get("/user", (req, res)=>{
  userModel.findAll(
    {id : req.query.id, email : req.query.email},
    (err, rows : UserInfo[])=>{
      if(err){
        sendResponse(res, resCode.serverErrror)
        return
      }

      if(rows.length == 0){
        sendResponse(res, resCode.notFound)
        return
      }

      sendResponseJson(res, resCode.found, rows[0])
    }
  )
})

router.put("/user", (req, res)=>{

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

    userModel.update(updateUser, (err)=>{
      if(err){
        console.log(err)
        sendResponse(res, resCode.serverErrror);
        return
      }
      sendResponse(res, resCode.success);
    })
  })
})

module.exports = router
