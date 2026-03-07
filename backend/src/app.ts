import 'reflect-metadata';
import express, { Response, Request, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import path from 'path';
import config from './config/config';
import { DatabaseProvider } from './services/databaseProvider';
import Container from 'typedi';
import fileUpload from 'express-fileupload';
import morgan from 'morgan';
import { registerTasks } from './cron';

const app = express();

app.use(cookieParser());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(fileUpload());

if (config.env !== 'local') {
    app.use(morgan('combined'));
}

app.use(morgan('dev'));

app.use('/api', require('./api/routes'));

// Serve static files from the 'static' directory
app.use(express.static(path.join(__dirname, '../static')));

// Serve angular application when nothing matches
app.use('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../static/index.html'));
});

registerTasks();

app.listen(config.port, () => {
    console.log('Hunter API started at port ' + config.port);
}).on('close', () => {
    const db = Container.get(DatabaseProvider);
    db.client().$disconnect();
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error caught:', err.message, err.stack);

    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
    });
});
