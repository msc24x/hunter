import { rejects } from "assert";
import { exec } from "child_process";
import { writeFile } from "fs";
import { resolve } from "path";
import { Service } from "typedi";
import models from "../container/models";
import { HunterExecutable, QuestionInfo, resCode, UserInfo } from "../environments/environment";
import { Util } from "../util/util";


@Service({global : true})
export class JudgeService{

  private isProcessingUserMap = new Map<string, boolean>()
  private entries = 0

  private saveEntry({ id } : UserInfo){
    this.isProcessingUserMap.set(id, true)
    this.entries++
  }

  private remEntry({id} :UserInfo){
    this.isProcessingUserMap.set(id, false)
    this.entries--
  }

  getNumberOfEntries = ()=> { return this.entries}

  async execute(hunterExecutable : HunterExecutable, samples : Boolean, question : QuestionInfo, user : UserInfo) : Promise<String> {

    return new Promise((resolve, reject)=>{

      if(this.isProcessingUserMap.get(user.id))
        reject("Already processing for this user")
      else
        this.saveEntry(user)

      writeFile(`src/database/files/${Util.getFileName(hunterExecutable)}_${user.id}.${hunterExecutable.solution.lang}`, `${hunterExecutable.solution.code}`, {flag:"w"}, (err)=>{
          if(err){
            reject(err)
            this.remEntry(user)
          }

          exec(`D:/projects/RedocX/Hunter/server/src/scripts/runTests.bat ${Util.getFileName(hunterExecutable)} ${hunterExecutable.solution.lang} ${samples} ${user.id} "${question.sample_cases.replace('\n', "\\n")}" "${question.sample_sols.replace('\n',"\\n")}"`, (error, stdout, stderr)=>{
              if(error){
                reject(err)
                this.remEntry(user)
              }

              this.remEntry(user)
              resolve(stdout)
          })
        } 
      )
    })
  }

}