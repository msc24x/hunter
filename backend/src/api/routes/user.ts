import express, { Request, Response } from 'express';
import models from '../../database/containers/models';
import { UserInfo } from '../../config/types';
import { Util } from '../../util/util';
import { authenticate, loginRequired } from '../auth';
import { resCode } from '../../config/settings';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';

var router = express.Router();
const client = Container.get(DatabaseProvider).client();

router.get('/users/:id', authenticate, loginRequired, (req, res) => {
    const user_id = parseInt(req.params.id);

    client.users
        .findUniqueOrThrow({
            where: {
                id: user_id,
            },
            select: {
                id: true,
                name: true,
                avatar_url: true,
                blog_url: true,
                github_url: true,
                linkedin_url: true,
                competitions: {
                    where: {
                        public: true,
                        deleted_at: null,
                    },
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        })
        .then((rows) => {
            Util.sendResponseJson(res, resCode.success, rows);
        })
        .catch((err) => {
            Util.sendResponse(res, resCode.notFound);
        });
});

router.put('/users', authenticate, loginRequired, (req, res) => {
    const updateUser = req.body as UserInfo;

    if (updateUser.name.length > 50) {
        Util.sendResponse(res, resCode.badRequest);
        return;
    }

    client.users
        .update({
            where: { id: res.locals.user.id },
            data: {
                name: updateUser.name,
                linkedin_url: updateUser.linkedin_url,
                blog_url: updateUser.blog_url,
            },
        })
        .then(() => Util.sendResponse(res, resCode.success))
        .catch(() => Util.sendResponse(res, resCode.serverError));
});

module.exports = router;
