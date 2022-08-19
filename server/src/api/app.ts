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

const app = express();
app.use(cookieParser())
app.use(bodyParser.json())

app.use(require('./routes'))

const questionsModel = new Questions()
const competitionsModel = new Competitions()
const resultsModel = new Results()

const port = 8080;


function isValidExecRequest(exec : HunterExecutable) : boolean{

  const langs = ["c", "cpp", "py", "js"]

  try {
    if(
      exec.for.competition_id &&
      exec.for.question_id &&
      exec.solution.code &&
      langs.includes(exec.solution.lang)
    ) return true

  } catch (error) {
    return false
  }

  return false;
}

function getFileName(hunterExecutable : HunterExecutable){
  return `${hunterExecutable.for.competition_id}_${hunterExecutable.for.question_id}`
}

app.post("/execute", (req, res)=>{

  const hunterExecutable = req.body.exec as HunterExecutable
  const samples = req.body.samples as Boolean

  if(!isValidExecRequest(hunterExecutable)){
    sendResponse(res, resCode.badRequest)
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
          sendResponse(res, resCode.notFound)
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
              sendResponse(res, resCode.notFound)
              return
            }

            if(!competitionsModel.isLiveNow(hunterExecutable.for.competition_id) || !competitionsModel.hasNotEnded(competitions[0].start_schedule, competitions[0].duration)){
              sendResponse(res, resCode.forbidden, "Either the competition is not live or has ended")
              return
            }

            if(
              !samples 
              && (
                  !existsSync(`src/database/files/${getFileName(hunterExecutable)}_s.txt`)
                || !existsSync(`src/database/files/${getFileName(hunterExecutable)}_t.txt`)
                )
            ){
              sendResponseJson(res, resCode.success, {output : "HERR:No test cases has been set for this competitions"})
              return
            }

            // the point where it is all okay
            writeFile(`src/database/files/${getFileName(hunterExecutable)}_${user.id}.${hunterExecutable.solution.lang}`, `${hunterExecutable.solution.code}`, {flag:"w"}, (err)=>{
              if(err){
                 console.log(err)
                sendResponse(res, resCode.serverErrror)
                return
              }

              exec(`D:/projects/RedocX/Hunter/server/src/scirpts/runTests.bat ${getFileName(hunterExecutable)} ${hunterExecutable.solution.lang} ${samples} ${user.id} "${questions[0].sample_cases.replace('\n', "\\n")}" "${questions[0].sample_sols.replace('\n',"\\n")}"`, (error, stdout, stderr)=>{
                if(error){
                  console.log(error)
                  sendResponse(res, resCode.serverErrror)
                  return
                }

                sendResponseJson(res, resCode.success, {output : stdout})

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
              sendResponse(res, resCode.serverErrror)
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
    sendResponse(res, resCode.badRequest)
    return
  }

  authenticate(req, res, (req, res, user)=>{
    questionsModel.findAll({id : question_id}, questions=>{
      if(questions.length == 0){
        sendResponse(res, resCode.notFound, "no ques")
        return
      }
  
      competitionsModel.findAll({id : questions[0].competition_id}, 0, -1, competitions=>{
        if(competitions.length == 0){
          sendResponse(res, resCode.notFound, "no comp")
          return
        }
  
        if(competitions[0].id != competition_id){
          sendResponse(res, resCode.badRequest)
          return
        }
  
        if(!competitions[0].public && competitions[0].host_user_id != user.id){
          sendResponse(res, resCode.forbidden)
          return
        }

        readFile(`src/database/files/${competition_id}_${question_id}_${user.id}.${lang}`, {encoding : 'utf-8'}, (err, data)=>{
          if(err){
            if(err.code == "ENOENT")
              sendResponse(res, resCode.notFound)
            else
              sendResponse(res, resCode.serverErrror)
            return
          }
          sendResponseJson(res, resCode.success, { data : data})
        })
  
      }, err=>{sendResponse(res, resCode.forbidden)})
      
    })
  })

  



})


export function sendResponse(res : any , code : number ,msg : string = "") {

  res.status(code).send(msg);
}

export function sendResponseJson(res : any , code : number , body : {
  id : string,
  email : string,
  name : string,
  msg? : string
} |
{
  id : string,
  title : string
} | CompetitionInfo | Array<CompetitionInfo> | any) {
  res.status(code).send(body);
}


app.listen(port, ()=>{
     console.log("Hunter started at port "+port)
})
