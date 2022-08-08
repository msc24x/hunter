import express from "express";
import { send } from "process";
import { Results } from "../../database/models/Results";
import { resCode } from "../../environments/environment";
import { sendResponse, sendResponseJson } from "../app";
import { authenticate } from "../auth";

var router = express.Router()
const resultsModel = new Results()

router.get("/result/c/:id", (req, res)=>{
    
    if(req.params.id == null){
        sendResponse(res, resCode.badRequest, "id not specified")
        return
    }

    resultsModel.getCompetitionScores(req.params.id, (rows, err)=>{
        if(err){
            console.log(err)
            sendResponse(res, resCode.serverErrror)
            return
        }

        sendResponseJson(res, resCode.success, rows)

    })

})

router.get("/result", (req, res)=>{

    let user_id = req.query.user_id
    let competition_id = req.query.competition_id
    let question_id = req.query.question_id

    if(!user_id && !competition_id  && !question_id){
        sendResponse(res, resCode.badRequest)
        return
    }

    authenticate(req, res, (req, res, user)=>{
        resultsModel.findAll({
            user_id : user_id,
            competition_id : competition_id,
            question_id : question_id
        },(rows, err)=>{
            if(err){
                console.log(err)
                sendResponse(res, resCode.serverErrror)
                return
            }
            sendResponseJson(res, resCode.success, rows)
        })
    })
})

module.exports = router