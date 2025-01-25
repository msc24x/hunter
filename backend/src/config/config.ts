import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({
    path: `.env/.env.${process.env.ENV || 'local'}`,
});

export default {
    filesPath: 'files/',
    env: process.env.ENV,
    port: process.env.API_PORT,
    dbConnectionConfig: {
        db_url: process.env.DB_URL,
    },
    questionTypes: {
        code: 0,
        mcq: 1,
        fill: 2,
        long: 3,
    },
    choiceTypes: {
        selectable: 0,
        hidden: 1,
    },
};
