import 'reflect-metadata';
import express, { Response, Request } from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import config from './config/config';

const app = express();

app.use(cookieParser());
app.use(bodyParser.json());

app.use(require('./api/routes'));

app.listen(config.port, () => {
	console.log('Hunter API started at port ' + config.port);
});
