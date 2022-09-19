import Container, { Service } from "typedi";
import mysql, { Connection } from 'mysql';
import { Questions } from "../database/models/Questions";
import config from "../config/config";


@Service({global : true})
export class DatabaseProvider{

    private _dbConnection : Connection;

    constructor(){
        this._dbConnection = mysql.createConnection(config.dbConnectionConfig)
        this._dbConnection.connect(err=>{
            if(err){
                console.log(err)
                return
            }
            console.log("Connected to database")
        })
    }

    getInstance(){
        return this._dbConnection
    }


}