import express, {Response, Request}from 'express';
import { CompetitionInfo, HunterExecutable, resCode, UserInfo } from '../environments/environment';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { exec } from 'child_process';
import { existsSync, readFile, writeFile } from 'fs';
import { authenticate } from './auth';
import { Questions } from '../database/models/Questions';
import { Competitions } from '../database/models/Competitions';
import { Results } from '../database/models/Results';
import { userInfo } from 'os';
import { Util } from '../util/util';

const app = express();
app.use(cookieParser())
app.use(bodyParser.json())

app.use(require('./routes'))

const questionsModel = new Questions()
const competitionsModel = new Competitions()
const resultsModel = new Results()

const port = 8080;

app.post("/execute", (req, res)=>{

  const hunterExecutable = req.body.exec as HunterExecutable
  const samples = req.body.samples as Boolean

  if(!Util.isValidExecRequest(hunterExecutable)){
    Util.sendResponse(res, resCode.badRequest)
    return
  }

  authenticate(req, res, (req, res, user)=>{
    questionsModel.findAll(
      {
        id : hunterExecutable.for.question_id,
        competition_id : hunterExecutable.for.competition_id
      },
      (questions)=>{
        if(questions.length == 0){
          Util.sendResponse(res, resCode.notFound)
          return
        }
        competitionsModel.findAll(
          {
            id : hunterExecutable.for.competition_id
          },
          0,
          true,
          competitions=>{
            if(competitions.length == 0){
              Util.sendResponse(res, resCode.notFound)
              return
            }

            if(!competitionsModel.isLiveNow(hunterExecutable.for.competition_id) || !competitionsModel.hasNotEnded(competitions[0].start_schedule, competitions[0].duration)){
              Util.sendResponse(res, resCode.forbidden, "Either the competition is not live or has ended")
              return
            }

            if(
              !samples 
              && (
                  !existsSync(`src/database/files/${Util.getFileName(hunterExecutable)}_s.txt`)
                || !existsSync(`src/database/files/${Util.getFileName(hunterExecutable)}_t.txt`)
                )
            ){
              Util.sendResponseJson(res, resCode.success, {output : "HERR:No test cases has been set for this competitions"})
              return
            }

            // the point where it is all okay
            writeFile(`src/database/files/${Util.getFileName(hunterExecutable)}_${user.id}.${hunterExecutable.solution.lang}`, `${hunterExecutable.solution.code}`, {flag:"w"}, (err)=>{
              if(err){
                 console.log(err)
                Util.sendResponse(res, resCode.serverErrror)
                return
              }

              exec(`D:/projects/RedocX/Hunter/server/src/scirpts/runTests.bat ${Util.getFileName(hunterExecutable)} ${hunterExecutable.solution.lang} ${samples} ${user.id} "${questions[0].sample_cases.replace('\n', "\\n")}" "${questions[0].sample_sols.replace('\n',"\\n")}"`, (error, stdout, stderr)=>{
                if(error){
                  console.log(error)
                  Util.sendResponse(res, resCode.serverErrror)
                  return
                }

                Util.sendResponseJson(res, resCode.success, {output : stdout})

                if(samples)
                  return

                resultsModel.findAll(
                  {
                    user_id : user.id,
                    question_id : hunterExecutable.for.question_id,
                    competition_id : hunterExecutable.for.competition_id,
                  },
                  (rows, err)=>{
                    if(err){
                      console.log(err)
                      return
                    }
                    let pts = 0
                    if(stdout[0] == '1'){
                      pts = questions[0].points
                    }
                    if(rows.length == 0){
                      
                      resultsModel.post( 
                        {
                          user_id : user.id,
                          question_id : hunterExecutable.for.question_id,
                          competition_id : hunterExecutable.for.competition_id,
                          result : pts
                        },
                        err=>{ 
                          if(err){
                            console.log(err)
                            return
                          }
                        }
                      )
                    }else{
                      if(rows[0].result != '0' && pts == 0)
                        pts = parseInt(rows[0].result)

                      resultsModel.update(rows[0].id, pts+"", err=>{
                        if(err){
                          console.log(err)
                          return
                        }
                      })
                    }
                  }
                )
              })
            } 
          )
          },
          err=>{
            if(err){
               console.log(err)
              Util.sendResponse(res, resCode.serverErrror)
              return
            }
          }
        )
      }
    )
  })
})


app.get("/submission/:lang", (req, res)=>{
  const competition_id = req.query.competition_id
  const question_id = req.query.question_id
  const lang = req.params.lang

  if(!competition_id || !question_id || !["c", "cpp", "py", "js"].includes(lang)){
    Util.sendResponse(res, resCode.badRequest)
    return
  }

  authenticate(req, res, (req, res, user)=>{
    questionsModel.findAll({id : question_id}, questions=>{
      if(questions.length == 0){
        Util.sendResponse(res, resCode.notFound, "no ques")
        return
      }
  
      competitionsModel.findAll({id : questions[0].competition_id}, 0, -1, competitions=>{
        if(competitions.length == 0){
          Util.sendResponse(res, resCode.notFound, "no comp")
          return
        }
  
        if(competitions[0].id != competition_id){
          Util.sendResponse(res, resCode.badRequest)
          return
        }
  
        if(!competitions[0].public && competitions[0].host_user_id != user.id){
          Util.sendResponse(res, resCode.forbidden)
          return
        }

        readFile(`src/database/files/${competition_id}_${question_id}_${user.id}.${lang}`, {encoding : 'utf-8'}, (err, data)=>{
          if(err){
            if(err.code == "ENOENT")
              Util.sendResponse(res, resCode.notFound)
            else
              Util.sendResponse(res, resCode.serverErrror)
            return
          }
          Util.sendResponseJson(res, resCode.success, { data : data})
        })
  
      }, err=>{Util.sendResponse(res, resCode.forbidden)})
      
    })
  })

})



app.listen(port, ()=>{
     console.log("Hunter started at port "+port)
})
