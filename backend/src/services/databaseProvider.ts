import Container, { Service } from 'typedi';
import mysql, { Pool } from 'mysql2';
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
            keepAliveInitialDelay: 0,
            enableKeepAlive: true,
        });

        this._dbPool.on('error', (err) => {
            console.error('[DB pool] connection error:', err);
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
    }

    loadModels() {
        console.log('Loading registered models...');
        for (let model of this.models) {
            Container.set(model, new model());
            console.log(`  > ${model['name']} : Initialized`);
        }
        this.loaded = true;
    }

    public pool() {
        return this._dbPool;
    }

    public client() {
        return this.prismaClient;
    }
}
