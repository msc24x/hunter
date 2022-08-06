import mysql, { MysqlError } from 'mysql'
import { database } from '../database'
import { CompetitionInfo } from '../../environments/environment'

export class Competitions{

  dbConnection : mysql.Connection

  constructor(){
    this.dbConnection = database.getDataBase()
  }

  update(newCompetition : any, callback : (err : mysql.MysqlError | null)=>void){
    let query = `update competitions set title = "${newCompetition.title}", description = "${newCompetition.description}", public = ${newCompetition.public}`
    if(newCompetition.duration){
      query += `, duration = "${newCompetition.duration}"`
    }

    if(newCompetition.start_schedule){
      query += `, start_schedule = "${newCompetition.start_schedule}"`
    }
    query += ` where id = "${newCompetition.id}" ; `

    this.dbConnection.query(query, (err)=>{
      callback(err)
    })
  }

  add(host_user_id : string, title : string, callback : (err : mysql.MysqlError | null, rows : any) => void){
    this.dbConnection.query(` insert into competitions( host_user_id, title, created_on, rating, public, start_schedule) values( ${host_user_id}, "${title}", NOW() , 0, false, NOW() )  ;`, (err)=>{
      this.dbConnection.query(`select * from competitions where host_user_id = "${host_user_id}" order by created_on desc;`, (err, rows)=>{
        callback(err, rows);
      })
    })
  }

  findAll(
    params : any,
    dateOrder : 1 | 0 | -1,
    isPublic : true | false | -1,
    callback : (competitions : Array<CompetitionInfo>)=>void,
    errCallback : (err : MysqlError)=>void
  ){

    let query = "select * from competitions where true = true "
    if(params.id != null){
      query += `and id = "${params.id}" `
    }
    if(params.host_user_id != null){
      query += `and host_user_id = "${params.host_user_id}" `
    }

    if(isPublic != -1){
      if(isPublic)
        query += `and public = 1 `
      else
        query += `and public = 0 `
    }

    switch(dateOrder){
      case 1:
        query += `order by created_on `
        break
      case -1:
        query += `order by created_on desc`
        break
    }
    query += ";"


    this.dbConnection.query(query, (err, rows)=>{
      if(err){
         console.log(err)
        errCallback(err)
        return
      }
      callback(rows as Array<CompetitionInfo>);
    })

  }

}
