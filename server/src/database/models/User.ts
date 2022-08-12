import mysql, { MysqlError } from 'mysql'
import { database } from '../database'
import { UserInfo } from '../../environments/environment'

export class User{

  dbConnection : mysql.Connection

  constructor(){
    this.dbConnection = database.getDataBase()
  }

  delete(params : any, callback : (err : MysqlError | null)=>void){

    let args = []
    let query = "delete from users where "

    if(params.id){
      query += " id = ?;"
      args.push(params.id)
    }
    else if(params.email){
      query += " email = ?;"
      args.push(params.email)
    }
    else{
      callback(null)
      return
    }

    this.dbConnection.query(query, args, err=>{
      callback(err)
    })

  }

  update(newUserInfo : UserInfo, callback : ( err : mysql.MysqlError | null)=>void){
    this.dbConnection.query(` update users set name = ? where id = ? ; `,
      [newUserInfo.name, newUserInfo.id],
      (err)=>{
        callback(err)
      }
    )
  }

  findAll(params : any, callback : (err : MysqlError | null , rows : any)=>void ){

    let query = "select * from users where true"
    let args = []

    if(params.id){
      query += ` and users.id = ?`;
      args.push(params.id)
    }
    if(params.email){
      query += ` and users.email = ?`
      args.push(params.email)
    }
    if(params.name){
      query += ` and user.name = ?`
      args.push(params.name)
    }
    query += ";"

    this.dbConnection.query(query, args, (err, rows)=>{
      callback(err,rows)
    })

  }

}
