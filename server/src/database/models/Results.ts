import { MysqlError } from "mysql";
import Container, { Inject, Service } from "typedi";
import { Result } from "../../environments/environment";
import { DatabaseProvider } from "../../services/databaseProvider";

export class Results{
    dbConnection
 
    dbService : DatabaseProvider = Container.get(DatabaseProvider)

    constructor( ){
        this.dbConnection = this.dbService.getInstance()
    }

    
    post(params : any, callback : (err : MysqlError | null)=>void){

        let p = 0

        if(params.result == 0)
            p = 1

        this.dbConnection.query(`insert into results(user_id, question_id, competition_id, result, penalities) values(?, ?, ?, ?, ?);`,
            [params.user_id, params.question_id, params.competition_id, params.result, p],
            err=>{
                callback(err)
            }
        )
    }

    update(id : string, result : string, callback : (err : MysqlError | null)=>void){
        let p = 0

        if(result == '0')
            p = 1

        this.dbConnection.query(`update results set result = ?, penalities = penalities + ? where id = ? ;`, [result, p, id], err=>{
            callback(err)
        })
    }

    getCompetitionScores(id : string, callback : (rows : any, err : MysqlError | null)=>void ){
        this.dbConnection.query(` select user_id, sum(result) as score, sum(penalities) as penalities from results where competition_id = ? group by user_id order by score desc, penalities;`, [id], (err, rows)=>{
            if(err){
                callback(null, err)
                return
            }
            callback(rows, err)

        })
    }

    findAll(params : any, callback : (rows : any, err : MysqlError | null)=>void){

        let query = "select * from results where true "
        let args = []

        if(params.user_id){
            query += ` and user_id = ?`
            args.push(params.user_id)
        }
        if(params.competition_id){
            query += ` and competition_id = ?`
            args.push(params.competition_id)
        }
        if(params.question_id){
            query += ` and question_id = ?`
            args.push(params.question_id)
        }
        if(params.id){
            query += ` and id = ?`
            args.push(params.id)
        }

        query += ';'

        this.dbConnection.query(query, args, (err, rows)=>{
            callback(rows, err)
        })
    }
}