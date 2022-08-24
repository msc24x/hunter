import { MysqlError } from "mysql";
import { Connection } from "mysql";
import mysql, {Types} from 'mysql'
import { readFileSync } from "fs";

export class database{
  private static _dbConnection? : Connection
  private static inititalized = false
  private static lock = false

  static isInitialized = ()=>{return this.inititalized}

  static getDataBase() : mysql.Connection {

    if(database.inititalized && database._dbConnection)
      return database._dbConnection

    database._dbConnection = mysql.createConnection({
      host: "hunter-mysql.mysql.database.azure.com",
      user: "msc24x",
      password: process.env.password,
      database : "hunter_db",
      port : 3306,
      ssl : {
        ca : readFileSync("DigiCertGlobalRootCA.crt.pem")
      }

    })

    database.inititalized = true

    database._dbConnection.connect(err=>{
      if(err){
         console.log(err);
        return
      }
    });

    return database._dbConnection
  }
}
