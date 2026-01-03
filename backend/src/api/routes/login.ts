import express, { Request, Response } from 'express';
import { SessionInfo, UserInfo } from '../../config/types';
import bodyParser from 'body-parser';
import { authenticate, loginRequired } from '../auth';
import { Util } from '../../util/util';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';
import { resCode } from '../../config/settings';
import config from '../../config/config';

var router = express.Router();
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
                    return;
                }
                resolve(session!);
            })
            .catch((err) => {
                reject(err);
            });
    });

    return promise;
}

function getOrCreateUser(
    email: string,
    data: UserInfo
): Promise<UserInfo | null> {
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
                                name: data.name,
                                blog_url: data.blog_url,
                                linkedin_url: data.linkedin_url,
                                avatar_url: data.avatar_url,
                                github_url: data.github_url,
                                github_fetched_at: new Date(),
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
                    if (!user.github_fetched_at) {
                        client.users
                            .update({
                                where: {
                                    id: user.id,
                                },
                                data: {
                                    name: data.name,
                                    blog_url: data.blog_url,
                                    avatar_url: data.avatar_url,
                                    github_url: data.github_url,
                                    github_fetched_at: new Date(),
                                },
                            })
                            .then(() => {
                                resolve({
                                    id: user.id,
                                    email: user.email!,
                                    name: user.name || '',
                                });
                            });
                    } else {
                        resolve({
                            id: user.id,
                            email: user.email!,
                            name: user.name || '',
                        });
                    }
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

                        fetch(`https://api.github.com/user`, {
                            headers: {
                                Accept: 'application/json',
                                Authorization: `token ${body.access_token}`,
                            },
                        })
                            .then((githubUserData) => githubUserData.json())
                            .then((githubUserData) => {
                                const usefulData = {
                                    id: -1,
                                    email: email,
                                    name: githubUserData?.name || '',
                                    avatar_url:
                                        githubUserData?.avatar_url || '',
                                    github_url: githubUserData?.html_url || '',
                                    blog_url: githubUserData?.blog || '',
                                } as UserInfo;

                                getOrCreateUser(email!, usefulData).then(
                                    (user) => {
                                        if (!user) {
                                            res.sendStatus(400);
                                            return;
                                        }

                                        getOrCreateSession(user)
                                            .then((session) => {
                                                res.cookie(
                                                    'session',
                                                    session.id
                                                );
                                                res.redirect(
                                                    req.query.redirect_uri?.toString() ||
                                                        `${process.env.PROTOCOL}://${process.env.FRONTEND_DOMAIN}`
                                                );
                                            })
                                            .catch((err) => {
                                                Util.sendResponse(
                                                    res,
                                                    resCode.badRequest,
                                                    err
                                                );
                                            });
                                    }
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
        const redirect_uri = `${process.env.PROTOCOL}://${
            process.env.FRONTEND_DOMAIN || process.env.DOMAIN
        }/api/oauth/github?redirect_uri=${encodeURIComponent(
            req.headers.referer || ''
        )}`;
        res.redirect(
            `https://github.com/login/oauth/authorize?scope=user:email&client_id=${process.env.CID}&redirect_uri=${redirect_uri}`
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

router.get(
    '/superuser/impersonate/:user_id',
    authenticate,
    loginRequired,
    (req: Request, res: Response) => {
        const currentUser = res.locals.user as UserInfo | undefined;
        if (!currentUser || currentUser.email !== config.staff_email) {
            return Util.sendResponse(res, resCode.forbidden);
        }

        const targetId = parseInt(req.params.user_id?.toString() || '');
        if (!targetId) {
            return Util.sendResponse(
                res,
                resCode.badRequest,
                'Invalid user id'
            );
        }

        client.users
            .findUnique({ where: { id: targetId } })
            .then((target) => {
                if (!target) {
                    return Util.sendResponse(
                        res,
                        resCode.badRequest,
                        'User not found'
                    );
                }

                // clear existing session cookie and create a new session for target user
                res.clearCookie('session');

                const userInfo: UserInfo = {
                    id: target.id,
                    email: target.email || '',
                    name: target.name || '',
                };

                getOrCreateSession(userInfo)
                    .then((session) => {
                        res.cookie('session', session.id);
                        res.redirect(`${config.protocol}://${config.frontend}`);
                    })
                    .catch((e) => {
                        console.error(e);
                        Util.sendResponse(res, resCode.serverError);
                    });
            })
            .catch((e) => {
                console.error(e);
                Util.sendResponse(res, resCode.serverError);
            });
    }
);

module.exports = router;
