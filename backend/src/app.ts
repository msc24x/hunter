import 'reflect-metadata';
import express, { Response, Request } from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import config from './config/config';
import { DatabaseProvider } from './services/databaseProvider';
import Container from 'typedi';

const app = express();

app.use(cookieParser());
app.use(bodyParser.json());

app.use(require('./api/routes'));

app.listen(config.port, () => {
    console.log('Hunter API started at port ' + config.port);
}).on('close', () => {
    const db = Container.get(DatabaseProvider);
    db.client().$disconnect();
});
