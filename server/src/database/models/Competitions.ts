import mysql, { MysqlError } from 'mysql'
import { database } from '../database'
import { CompetitionInfo } from '../../environments/environment'

export class Competitions{

  dbConnection : mysql.Connection

  constructor(){
    this.dbConnection = database.getDataBase()
  }
  
  isLiveNow(date: string){
    return Date.parse(date) < Date.now()
  }
  
  hasNotEnded(date : string, duration : number){
    if(duration == 0)
      return true
    return Date.now() < Date.parse(date) + duration * 60 * 1000
  }

  update(newCompetition : any, callback : (err : mysql.MysqlError | null)=>void){

    let args = [newCompetition.title, newCompetition.description, newCompetition.public]

    let query = `update competitions set title = ?, description = ?, public = ?`

    if(newCompetition.duration){
      query += `, duration = ?`
      args.push(newCompetition.duration)
    }

    if(newCompetition.start_schedule){
      query += `, start_schedule = ?`
      args.push(newCompetition.start_schedule)
    }
    
    query += ` where id = ? ; `
    args.push(newCompetition.id)


    this.dbConnection.query(query, args, (err)=>{
      callback(err)
    })
  }

  add(host_user_id : string, title : string, callback : (err : mysql.MysqlError | null, rows : any) => void){
    
    this.dbConnection.query(` insert into competitions( host_user_id, title, created_on, rating, public, start_schedule) values( ?, ?, NOW() , 0, false, NOW() )  ;`, [host_user_id, title], (err)=>{
      this.dbConnection.query(`select * from competitions where host_user_id = ? order by created_on desc;`, [host_user_id], (err, rows)=>{
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

    console.log(params)

    let query = "select * from competitions where true = true "
    let args = []

    if(params.id){
      query += `and id = ? `
      args.push(params.id)
    }

    if(params.title){
      query += `and title LIKE ? `
      args.push('%'+params.title+'%')
    }

    if(params.host_user_id){
      query += `and host_user_id = ? `
      args.push(params.host_user_id)
    }

    if(params.duration){
      query += `and duration = ? `
      args.push(params.duration)
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


    this.dbConnection.query(query, args, (err, rows)=>{
      if(err){
         console.log(err)
        errCallback(err)
        return
      }
      callback(rows as Array<CompetitionInfo>);
    })

  }

  delete(params : any, callback : (err : MysqlError | null)=>void){

    let args = []
    let query = "delete from competitions where "

    if(params.id){
      query += " id = ?;"
      args.push(params.id)
    }
    else if(params.host_user_id){
      query += " host_user_id = ?;"
      args.push(params.host_user_id)
    }
    else{
      callback(null)
      return
    }

    this.dbConnection.query(query, args, err=>{
      callback(err)
    })

  }

}
