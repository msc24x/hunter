import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({
    path: `.env/.env.${process.env.ENV || 'local'}`,
});

export default {
    env: process.env.ENV,
    port: process.env.API_PORT,
    dbConnectionConfig: {
        db_url: process.env.DB_URL,
    },
};
