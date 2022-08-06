import express, {Response, Request}from 'express';
import { CompetitionInfo, HunterExecutable, resCode, UserInfo } from '../environments/environment';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { exec } from 'child_process';
import { writeFile } from 'fs';
import { authenticate } from './auth';
import { Questions } from '../database/models/Questions';
import { Competitions } from '../database/models/Competitions';

const app = express();
app.use(cookieParser())
app.use(bodyParser.json())

app.use(require('./routes'))

const questionsModel = new Questions()
const competitionsModel = new Competitions()

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

  const hunterExecutable = req.body as HunterExecutable

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

            // the point where it is all okay
            writeFile(`src/database/files/${getFileName(hunterExecutable)}.${hunterExecutable.solution.lang}`, `${hunterExecutable.solution.code}`, {flag:"w"}, (err)=>{
              if(err){
                 console.log(err)
                sendResponse(res, resCode.serverErrror)
                return
              }
              exec(`D:/projects/RedocX/Hunter/server/src/scirpts/runTests.bat ${getFileName(hunterExecutable)} ${hunterExecutable.solution.lang}`, (error, stdout, stderr)=>{
                if(error){

                  sendResponse(res, resCode.serverErrror)
                  return
                }
                sendResponseJson(res, resCode.success, {output : stdout})


              })
            } )

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
