import 'reflect-metadata';
import express, { Response, Request } from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import config from './config/config';
import { DatabaseProvider } from './services/databaseProvider';
import Container from 'typedi';
import fileUpload from 'express-fileupload';
import morgan from 'morgan';
import { registerTasks } from './cron';

const app = express();

app.use(cookieParser());
app.use(bodyParser.json());
app.use(fileUpload());

if (config.env !== 'local') {
    app.use(morgan('combined'));
}

app.use(morgan('dev'));
app.use(require('./api/routes'));

registerTasks();

app.listen(config.port, () => {
    console.log('Hunter API started at port ' + config.port);
}).on('close', () => {
    const db = Container.get(DatabaseProvider);
    db.client().$disconnect();
});
