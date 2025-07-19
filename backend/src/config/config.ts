import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { TransportOptions } from 'nodemailer';

dotenv.config({
    path: `.env/.env.${process.env.ENV || 'local'}`,
});

export default {
    filesPath: 'files/',
    env: process.env.ENV as 'local' | 'prod',
    protocol: process.env.PROTOCOL,
    frontend: process.env.FRONTEND_DOMAIN,
    port: process.env.API_PORT,
    dbConnectionConfig: {
        db_url: process.env.DB_URL,
    },
    smtp: {
        host: process.env.SMTP_HOST!,
        port: process.env.SMTP_PORT!,
        auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASS!,
        },
    } as TransportOptions,
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
