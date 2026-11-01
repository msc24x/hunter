import { Response, Request, NextFunction } from 'express';
import { Util } from '../util/util';
import Container from 'typedi';
import { DatabaseProvider } from '../services/databaseProvider';
import { resCode } from '../config/settings';
import { createHash } from 'crypto';

const client = Container.get(DatabaseProvider).client();

export function loginRequired(req: Request, res: Response, next: NextFunction) {
    if (!res.locals.isAuthenticated) {
        Util.sendResponse(res, resCode.forbidden);
        return;
    }

    next();
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
    res.locals.isAuthenticated = false;

    const authorization = req.headers.authorization;
    if (authorization?.startsWith('Bearer ')) {
        authenticateApiToken(authorization.slice(7).trim(), res, next);
        return;
    }

    const session_id = req.cookies.session;

    if (session_id) {
        client.session
            .findUnique({
                where: {
                    id: session_id,
                },
                select: {
                    user: true,
                },
            })
            .then((session) => {
                if (!session) {
                    return;
                }

                res.locals.user = session.user;
                res.locals.isAuthenticated = true;
            })
            .finally(next);
    } else {
        next();
    }
}

export function hashApiToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
}

function authenticateApiToken(
    token: string,
    res: Response,
    next: NextFunction,
) {
    client.api_token
        .findFirst({
            where: {
                token_hash: hashApiToken(token),
                revoked_at: null,
                OR: [
                    { expires_at: null },
                    { expires_at: { gt: new Date() } },
                ],
            },
            select: {
                id: true,
                user: true,
            },
        })
        .then((apiToken) => {
            if (!apiToken) {
                return;
            }

            res.locals.user = apiToken.user;
            res.locals.isAuthenticated = true;

            client.api_token
                .update({
                    where: { id: apiToken.id },
                    data: { last_used_at: new Date() },
                })
                .catch(() => {});
        })
        .finally(next);
}
