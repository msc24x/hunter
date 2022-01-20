import mysql from 'mysql';

export class AppDB{
  private dbConnection : mysql.Connection;
  isConnected : Boolean = false;
  queryResult  = null;

  constructor(){
    this.dbConnection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "password",
      database : "hunter_db"
    });
  }

  async connect() : Promise<Boolean>{
    if(this.isConnected){
      console.log("Already connected to database");
      return true;
    }
    console.log("Connecting to database...");

    const err, rows = await this.dbConnection.connect();
    return this.isConnected;
  }

  async query(q : string) : Promise<Boolean>{

    let success = false;
    await this.dbConnection.query(q, (err, rows)=>{
      if(err){
        console.log(err);
        return;
      }
      success = true;
      this.queryResult = rows;
    }).start();

    return success;
  }

}






