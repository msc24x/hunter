import express, { Router } from "express";
import { Cache } from "memory-cache";
import Container from "typedi";
import models from "../../container/models";
import { Competitions } from "../../database/models/Competitions";
import { Questions } from "../../database/models/Questions";
import { Results } from "../../database/models/Results";
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
        models.users.count((err, rows)=>{
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
        models.competitions.count((err, rows)=>{
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