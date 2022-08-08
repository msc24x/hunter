import { MysqlError } from "mysql";
import { Result } from "../../environments/environment";
import { database } from "../database";

export class Results{
    dbConnection = database.getDataBase()

    
    post(params : any, callback : (err : MysqlError | null)=>void){

        let p = 0

        if(params.result == 0)
            p = 1

        this.dbConnection.query(`insert into results(user_id, question_id, competition_id, result, penalities) values(${params.user_id}, ${params.question_id}, ${params.competition_id}, ${params.result}, ${p});`,
            err=>{
                callback(err)
            }
        )
    }

    update(id : string, result : string, callback : (err : MysqlError | null)=>void){
        let p = 0

        if(result != '1')
            p = 1

        this.dbConnection.query(`update results set result = ${result}, penalities = penalities + ${p} where id = ${id} ;`, err=>{
            callback(err)
        })
    }

    getCompetitionScores(id : string, callback : (rows : any, err : MysqlError | null)=>void ){
        this.dbConnection.query(` select user_id, sum(result) as score, sum(penalities) as penalities from results where competition_id = ${id} group by user_id;`, (err, rows)=>{
            if(err){
                callback(null, err)
                return
            }
            callback(rows, err)

        })
    }

    findAll(params : any, callback : (rows : any, err : MysqlError | null)=>void){
        let query = "select * from results where true = true "

        if(params.user_id)
            query += ` and user_id = ${params.user_id}`
        if(params.competition_id)
            query += ` and competition_id = ${params.competition_id}`
        if(params.question_id)
            query += ` and question_id = ${params.question_id}`
        if(params.id)
            query += ` and id = ${params.id}`

        query += ';'
        this.dbConnection.query(query, (err, rows)=>{
            callback(rows, err)
        })
    }
}