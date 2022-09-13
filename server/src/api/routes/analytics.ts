import express, { Router } from "express";
import { Cache } from "memory-cache";
import { Competitions } from "../../database/models/Competitions";
import { User } from "../../database/models/User";
import { resCode } from "../../environments/environment";
import { Util } from "../../util/util";

var router = express.Router()
var mcache = new Cache()

router.get("/status/:subject",   (req, res)=>{
    let cachedReq = mcache.get(req.params.subject)

    if(cachedReq){
        console.log("hit")
        Util.sendResponseJson(res, resCode.success, { subject : req.params.subject, status : cachedReq, color : "blue"})
        return
    }
    console.log("miss")


    let subject = req.params.subject

    if(subject == "users"){
        let usersModel = new User()
        usersModel.count((err, rows)=>{
            if(err){
                console.log(err);
                Util.sendResponse(res, resCode.serverErrror)
                return
            }

            mcache.put(subject, rows[0].count, 1000 * 10)

            Util.sendResponseJson(res, resCode.success, { subject : req.params.subject, status : rows[0].count, color : "blue"})
        })
    }
    else if( subject == "competitions"){
        let competitionsModel =  new Competitions()
        competitionsModel.count((err, rows)=>{
            if(err){
                console.log(err);
                Util.sendResponse(res, resCode.serverErrror)
                return
            }

            mcache.put(subject, rows[0].count, 1000 * 10)

            Util.sendResponseJson(res, resCode.success, { subject : req.params.subject, status : rows[0].count, color : "blue"})
        })
    }
    else {
        Util.sendResponse(res, resCode.badRequest)
    }
})

module.exports = router