import { MysqlError } from "mysql";
import { database } from "../database";
import { QuestionInfo } from "../../environments/environment";
import { Competitions } from "./Competitions";

export class Questions{

  dbConnection = database.getDataBase()
  competitionsModel = new Competitions()

  findAll(params : any, callback : (questions : Array<QuestionInfo>)=>void){
    let query = "select * from questions where true = true "
    if(params.competition_id != null){
      query += `and competition_id = "${params.competition_id}" `
    }
    if(params.id != null){
      query += `and id = "${params.id}" `
    }
    query += ";"

    this.dbConnection.query(query, (err, rows)=>{
      if(err){
        console.log(err)
        return
      }

      let questions : Array<QuestionInfo> = []
      for(const row of rows){
        questions.push(
          {
            id : row.id,
            competition_id : row.competition_id,
            title : row.title,
            statement : row.statement,
            created_on : row.date_created,
            points : row.points,
            solutions_id : row.solutions_id,
            tests_id : row.tests_id
          } as QuestionInfo
        )
      }
      callback(questions)
    })
  }

  add(competition_id : string, callback : (question_id : string)=>void, errCallback : (err : MysqlError | null)=>void){

    this.dbConnection.query(` insert into questions (competition_id, date_created) values(${competition_id}, NOW()) ; `,err=>{
      if(err){
        errCallback(err)
        return
      }
      this.dbConnection.query(` select * from questions where competition_id = "${competition_id}" order by date_created ;`, (err, rows)=>{
        if(err || rows.length == 0){
          errCallback(err)
          return
        }

        callback(rows[0].id)
      })
    })
  }

  update(newQuestion : any, callback : (err : MysqlError | null)=>void){



    this.dbConnection.query(`update questions set title = "${newQuestion.title}", statement = "${newQuestion.statement}", points = "${newQuestion.points}" where id = "${newQuestion.id}" ; `, (err)=>{
      callback(err)
    })
  }
}
