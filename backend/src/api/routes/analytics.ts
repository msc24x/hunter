import express from 'express';
import { Cache } from 'memory-cache';
import { resCode } from '../../config/settings';
import { Util } from '../../util/util';
import { Container } from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';

var router = express.Router();
var mcache = new Cache();
const client = Container.get(DatabaseProvider).client();

router.get('/status/:subject', (req, res) => {
    let cachedReq = mcache.get(req.params.subject);

    if (cachedReq) {
        Util.sendResponseJson(res, resCode.success, {
            subject: req.params.subject,
            status: cachedReq,
            color: 'blue',
        });
        return;
    }

    let subject = req.params.subject;
    const countPromise =
        subject === 'users'
            ? client.users.count()
            : subject === 'competitions'
              ? client.competitions.count()
              : null;

    if (!countPromise) {
        Util.sendResponse(res, resCode.badRequest);
        return;
    }

    countPromise.then((rows) => {
        mcache.put(subject, rows, 1000 * 10);

        Util.sendResponseJson(res, resCode.success, {
            subject: req.params.subject,
            status: rows,
            color: 'blue',
        });
    });
});

module.exports = router;
