import Container, { Service } from 'typedi';
import mysql, { Connection } from 'mysql2';
import { Questions } from '../database/models/Questions';
import config from '../config/config';
import { Competitions } from '../database/models/Competitions';
import { Results } from '../database/models/Results';
import { User } from '../database/models/User';
import { log } from 'console';
import { PrismaClient } from '@prisma/client';

@Service({ global: true })
export class DatabaseProvider {
    private _dbConnection: Connection;
    private _connectionConfig = config.dbConnectionConfig;
    private prismaClient: PrismaClient;

    public models = [Questions, Competitions, Results, User];
    public loaded = false;

    constructor() {
        this._dbConnection = mysql.createConnection(
            this._connectionConfig.db_url!
        );
        this.prismaClient = new PrismaClient();

        this.prismaClient.$connect().then(
            () => {
                console.log(`Prisma connection to database: Initialized`);
            },
            (err) => {
                console.error(err);
            }
        );

        this._dbConnection.connect((err) => {
            if (err) {
                throw err;
            }
            console.log(`Raw connection to database: Initialized`);

            const retryCallback = (retryCount = 1) => {
                const retryAfter = retryCount * 1000;
                console.log('Raw connection to database: Failed');
                console.log(`Retrying in ${retryAfter} ms`);

                setTimeout(() => {
                    console.log('Raw connection to database: Reconnecting');

                    try {
                        this._dbConnection.end((err) => {
                            if (err) {
                                console.error(
                                    'Unable to end existing raw connection, ignoring for now.'
                                );
                            }

                            this._dbConnection = mysql.createConnection(
                                this._connectionConfig.db_url!
                            );

                            this._dbConnection.connect((err) => {
                                if (err) {
                                    retryCallback(retryCount + 1);
                                    return;
                                }
                                console.log(
                                    `Raw connection to database: Initialized`
                                );
                            });
                        });
                    } catch (error) {
                        retryCallback(retryCount + 1);
                        return;
                    }
                }, retryAfter);
            };

            this._dbConnection.on('end', retryCallback);
        });
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
        return this._dbConnection;
    }

    public client() {
        return this.prismaClient;
    }
}
