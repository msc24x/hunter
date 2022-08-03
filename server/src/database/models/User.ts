import mysql, { MysqlError } from 'mysql'
import { database } from '../database'
import { UserInfo } from '../../environments/environment'

export class User{

  dbConnection : mysql.Connection

  constructor(){
    this.dbConnection = database.getDataBase()
  }

  update(newUserInfo : UserInfo, callback : ( err : mysql.MysqlError | null)=>void){
    this.dbConnection.query(` update users set email = "${newUserInfo.email}", name = "${newUserInfo.name}" where id = ${newUserInfo.id} ; `,
      (err)=>[
        callback(err)
      ]
    )
  }

  findAll(params : any, callback : (err : MysqlError | null , rows : any)=>void ){

    var query = "select * from users where true"
    if(params.id)
      query += ` and users.id = "${params.id}"`;
    if(params.email)
      query += ` and users.email = "${params.email}"`
    if(params.name)
      query += ` and user.name = "${params.name}"`
    query += ";"



    this.dbConnection.query(query, (err, rows)=>{
      callback(err,rows)
    })

  }

}
