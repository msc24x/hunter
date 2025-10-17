import express, { Request, Response } from 'express';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';
import path from 'path';
import config from '../../config/config';
const mime = require('mime-types');
import { readFile, fileExists } from '../../util/serverStorage';

var router = express.Router();
const client = Container.get(DatabaseProvider).client();

router.get('/media/*', async (req: Request, res: Response) => {
    try {
        const rawPath = req.params[0] || '';
        const decoded = decodeURIComponent(rawPath);

        // normalize and prevent path traversal - keep path relative
        const normalized = path.posix
            .normalize('/' + decoded)
            .replace(/^\/+/, '');
        if (normalized.includes('..')) {
            return res.status(400).send('Invalid file path');
        }

        // ensure file exists in storage
        const exists = await fileExists(normalized);
        if (!exists) {
            return res.status(404).send('File not found');
        }

        // read via serverStorage and send
        const fileBuffer = await readFile(normalized);
        const contentType =
            mime.lookup(normalized) || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', String(fileBuffer.length));
        return res.send(fileBuffer);
    } catch (err: any) {
        return res.status(500).send('Server error');
    }
});

module.exports = router;
