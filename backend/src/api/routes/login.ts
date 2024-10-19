import express, { Request, Response } from 'express';
import { SessionInfo, UserInfo } from '../../config/types';
import bodyParser from 'body-parser';
import { authenticate } from '../auth';
import { Util } from '../../util/util';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';
import { resCode } from '../../config/settings';

var router = express.Router();
const database = Container.get(DatabaseProvider).getInstance();
const client = Container.get(DatabaseProvider).client();

router.use(bodyParser.json());

function createSession(user: UserInfo): Promise<SessionInfo> {
    const promise = new Promise<SessionInfo>((resolve, reject) => {
        client.session
            .create({
                data: {
                    user_id: user.id,
                },
            })
            .then((session) => {
                resolve(session);
            });
    });

    return promise;
}

function getOrCreateSession(user: UserInfo): Promise<SessionInfo> {
    const promise = new Promise<SessionInfo>((resolve, reject) => {
        client.session
            .findFirst({
                where: {
                    user_id: user.id,
                },
            })
            .then((session) => {
                if (!session) {
                    createSession(user).then((session) => {
                        resolve(session);
                    });
                }
                resolve(session!);
            })
            .catch((err) => {
                reject(err);
            });
    });

    return promise;
}

function getOrCreateUser(email: string): Promise<UserInfo | null> {
    const promise = new Promise<UserInfo | null>((resolve, reject) => {
        client.users
            .findFirst({
                where: {
                    email: email,
                },
            })
            .then((user) => {
                if (!user) {
                    client.users
                        .create({
                            data: {
                                email: email,
                            },
                        })
                        .then((user) =>
                            resolve({
                                id: user.id,
                                email: user.email!,
                                name: user.name || '',
                            })
                        )
                        .catch(() => resolve(null));
                } else {
                    resolve({
                        id: user.id,
                        email: user.email!,
                        name: user.name || '',
                    });
                }
            })
            .catch(() => resolve(null));
    });
    return promise;
}

router.get('/oauth/github', (req, res) => {
    if (req.query.code) {
        fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            body: JSON.stringify({
                client_id: process.env.CID,
                client_secret: process.env.CSEC,
                code: req.query.code,
            }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        })
            .then((github_res) => {
                return github_res.json();
            })
            .then((body) => {
                fetch(`https://api.github.com/user/emails`, {
                    headers: {
                        Accept: 'application/json',
                        Authorization: `token ${body.access_token}`,
                    },
                })
                    .then((githubRes) => githubRes.json())
                    .then((githubRes) => {
                        const emails = githubRes as Array<{
                            email: string;
                            primary: boolean;
                            verified: boolean;
                            visibility: string;
                        }>;

                        const email = emails.find((val) => val.primary)?.email;

                        getOrCreateUser(email!).then((user) => {
                            if (!user) {
                                res.sendStatus(400);
                                return;
                            }

                            getOrCreateSession(user)
                                .then((session) => {
                                    res.cookie('session', session.id);
                                    res.redirect(
                                        `${process.env.PROTOCOL}://${process.env.DOMAIN}`
                                    );
                                })
                                .catch((err) =>
                                    Util.sendResponse(
                                        res,
                                        resCode.badRequest,
                                        err
                                    )
                                );
                        });
                    })
                    .catch((err) =>
                        Util.sendResponse(res, resCode.serverError, err)
                    );
            })
            .catch((err) => {
                console.log(err);
                Util.sendResponse(
                    res,
                    resCode.serverError,
                    'Could not get access token'
                );
            });
    } else {
        res.redirect(
            `https://github.com/login/oauth/authorize?scope=user:email&client_id=${process.env.CID}`
        );
    }
});

router.get('/authenticate', authenticate, (req, res) => {
    if (res.locals.user) {
        Util.sendResponseJson(res, resCode.accepted, res.locals.user);
    } else {
        Util.sendResponse(res, resCode.forbidden);
    }
});

router.post('/logout', (req, res) => {
    const session_id = req.cookies.session;
    res.clearCookie('session');

    client.session
        .delete({
            where: {
                id: session_id,
            },
        })
        .then((session) => {
            Util.sendResponse(res, resCode.success);
        })
        .catch((err) => {
            Util.sendResponse(res, resCode.badRequest);
        });
});

module.exports = router;
