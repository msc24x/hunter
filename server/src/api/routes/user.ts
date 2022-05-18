import express, {Request, Response} from "express"
import { database } from "../../database/database"
import { resCode, UserInfo } from "../../database/types"
import { sendResponse, sendResponseJson } from "../app"
import { authenticate } from "../auth"


var router = express.Router()

var dbConnection = database.getDataBase()

router.get("/user", (req, res)=>{
  getUser(req, res, (user : UserInfo)=>{
    sendResponseJson(res, resCode.found, user);
  })
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

export function getUser(req:Request, res : Response, callback : Function = (user : UserInfo)=>{}, user_id : string = "") {

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


module.exports = router
