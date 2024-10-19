import { Response, Request, NextFunction } from 'express';
import { Util } from '../util/util';
import Container from 'typedi';
import { DatabaseProvider } from '../services/databaseProvider';
import { resCode } from '../config/settings';

const client = Container.get(DatabaseProvider).client();

export function loginRequired(req: Request, res: Response, next: NextFunction) {
    if (!res.locals.isAuthenticated) {
        Util.sendResponse(res, resCode.forbidden);
        return;
    }

    next();
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
    const session_id = req.cookies.session;
    res.locals.isAuthenticated = false;

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
