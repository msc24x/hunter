import Container, { Service } from 'typedi';
import mysql, { Connection, Pool, PoolConnection } from 'mysql2';
import { Questions } from '../database/models/Questions';
import config from '../config/config';
import { Competitions } from '../database/models/Competitions';
import { Results } from '../database/models/Results';
import { User } from '../database/models/User';
import { log } from 'console';
import { PrismaClient } from '@prisma/client';

@Service({ global: true })
export class DatabaseProvider {
    // private _dbConnection: Connection;
    private _dbPool: Pool;
    private _connectionConfig = config.dbConnectionConfig;
    private prismaClient: PrismaClient;

    public models = [Questions, Competitions, Results, User];
    public loaded = false;

    constructor() {
        // this._dbConnection = mysql.createConnection(
        //     this._connectionConfig.db_url!
        // );

        this._dbPool = mysql.createPool({
            uri: this._connectionConfig.db_url,
            keepAliveInitialDelay: 10000, // 0 by default.
            enableKeepAlive: true, // false by default.
        });

        this.prismaClient = new PrismaClient();

        this.prismaClient.$connect().then(
            () => {
                console.log(`Prisma connection to database: Initialized`);
            },
            (err) => {
                console.error(err);
            }
        );

        // this._dbConnection.connect((err) => {
        //     if (err) {
        //         throw err;
        //     }
        //     console.log(`Raw connection to database: Initialized`);

        //     // this._dbConnection.on('error', () => {
        //     //     this._dbConnection.destroy();
        //     //     console.log('Errored connection destroyed');
        //     //     this._dbConnection.connect()
        //     // });
        // });
    }

    loadModels() {
        console.log('Loading registered models...');
        for (let model of this.models) {
            Container.set(model, new model());
            console.log(`  > ${model['name']} : Initialized`);
        }
        this.loaded = true;
    }

    public getInstance() {
        const conn = new Promise<PoolConnection>((resolve, reject) => {
            this._dbPool.getConnection((err, poolConn) => {
                if (err) {
                    console.log('destroying errored connection');
                    poolConn.destroy();
                    reject('err');
                    return;
                }

                resolve(poolConn);
            });
        });

        return conn;
    }

    public client() {
        return this.prismaClient;
    }
}
