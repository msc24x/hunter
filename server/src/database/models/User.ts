import mysql from 'mysql'
import { database } from '../database'

export class User{

  dbConnection : mysql.Connection

  constructor(){
    this.dbConnection = database.getDataBase()
  }

  findAll(id : string | null, email : string | null, name : string | null, callback : Function ){

    if(id || email || name){

      var query = "select * from users where true"
      if(id &&  id != "")
        query += ` and users.id = "${id}"`;
      if(email && email != "")
        query += ` and users.email = "${email}"`
      if(name && name != "")
        query += ` and user.name = "${name}"`
      query += ";"

      console.log(query)

      this.dbConnection.query(query, (err, rows)=>{
        callback(err,rows)
      })

    }
    else{
      console.log(id, email, name)

      callback(null, null)
    }

  }

}
