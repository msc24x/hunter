import express, {Response, Request}from 'express';
import { CompetitionInfo, HunterExecutable, resCode, UserInfo } from '../environments/environment';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { exec } from 'child_process';
import { writeFile } from 'fs';
import { database } from '../database/database';
import { verify } from 'argon2';
import { randomBytes } from 'crypto';

const app = express();
app.use(cookieParser())
app.use(bodyParser.json())

app.use(require('./routes'))

const dbConnection = database.getDataBase()

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

app.post("/upload", (req, res)=>{
  const fileType = req.body.fileType
  const file = req.body.file

  if(!file || !fileType){
    sendResponse(res, resCode.badRequest)
    return
  }
  if(["tests", "sols".includes(fileType as string)]){
    sendResponse(res, resCode.badRequest)
    return
  }

  sendResponse(res, resCode.serverErrror, "not implemented")

})

function getFileName(hunterExecutable : HunterExecutable){
  return `${hunterExecutable.for.competition_id}${hunterExecutable.for.question_id}`
}

app.post("/execute", (req, res)=>{
  const hunterExecutable = req.body as HunterExecutable

  if(!isValidExecRequest(hunterExecutable)){
    sendResponse(res, resCode.badRequest)
    return
  }
  console.log(getFileName(hunterExecutable))
  writeFile(`src/database/files/c${getFileName(hunterExecutable)}.${hunterExecutable.solution.lang}`, `${hunterExecutable.solution.code}`, {flag:"w+"}, (err)=>{
    if(err){
      console.log(err)
      sendResponse(res, resCode.serverErrror)
      return
    }
    exec(`D:/projects/RedocX/Hunter/server/src/scripts/runTests.bat ${getFileName(hunterExecutable)} ${hunterExecutable.solution.lang}`, (error, stdout, stderr)=>{
      if(error){
        console.log(stderr)
        sendResponse(res, resCode.serverErrror)
        return
      }
      sendResponse(res, resCode.success, stdout)
    })
  } )





})


export function sendResponse(res : any , code : number ,msg : string = "") {
  console.log("sending rescode ", code)
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
    console.log(`Listening for hunter at ${port}`);
})
