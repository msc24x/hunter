import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({
    path: `.env/.env.${process.env.ENV || 'local'}`,
});

export default {
    env: process.env.ENV,
    port: process.env.API_PORT,
    dbConnectionConfig: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        db_url: process.env.DATABASE_URL,
        // ssl : process.env.ENV === "prod" ? {
        // 	ca :  readFileSync("DigiCertGlobalRootCA.crt.pem")
        // } : null
    },
};
