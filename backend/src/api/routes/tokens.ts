import express from 'express';
import { randomBytes } from 'crypto';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';
import { authenticate, hashApiToken, loginRequired } from '../auth';
import { Util } from '../../util/util';
import { resCode } from '../../config/settings';
import { UserInfo } from '../../config/types';

var router = express.Router();
const client = Container.get(DatabaseProvider).client();

const tokenSelect = {
    id: true,
    name: true,
    created_at: true,
    last_used_at: true,
    expires_at: true,
    revoked_at: true,
};

// Create an API token. The raw token is returned exactly once. Only its
// sha256 hash is stored, so it cannot be recovered later.
router.post('/tokens', authenticate, loginRequired, (req, res) => {
    const user: UserInfo = res.locals.user;
    const name = req.body?.name?.toString().trim();
    const expiresInDays =
        req.body?.expires_in_days != null
            ? parseInt(req.body.expires_in_days.toString())
            : null;

    if (!name || name.length > 100) {
        Util.sendResponse(
            res,
            resCode.badRequest,
            'name is required (max 100 characters)',
        );
        return;
    }

    if (
        expiresInDays != null &&
        (!Number.isFinite(expiresInDays) ||
            expiresInDays <= 0 ||
            expiresInDays > 3650)
    ) {
        Util.sendResponse(
            res,
            resCode.badRequest,
            'expires_in_days must be a positive integer up to 3650',
        );
        return;
    }

    const rawToken = `hut_${randomBytes(32).toString('hex')}`;

    client.api_token
        .create({
            data: {
                user_id: user.id,
                name,
                token_hash: hashApiToken(rawToken),
                expires_at: expiresInDays
                    ? new Date(Date.now() + expiresInDays * 86400000)
                    : null,
            },
            select: tokenSelect,
        })
        .then((token) =>
            Util.sendResponseJson(res, resCode.success, {
                ...token,
                token: rawToken,
            }),
        )
        .catch((err) => Util.sendResponse(res, resCode.serverError, err));
});

// List the caller's tokens (metadata only, hashes are never exposed).
router.get('/tokens', authenticate, loginRequired, (req, res) => {
    const user: UserInfo = res.locals.user;

    client.api_token
        .findMany({
            where: { user_id: user.id },
            select: tokenSelect,
            orderBy: { created_at: 'desc' },
        })
        .then((tokens) => Util.sendResponseJson(res, resCode.success, tokens))
        .catch((err) => Util.sendResponse(res, resCode.serverError, err));
});

// Revoke a token, scoped to the caller.
router.delete('/tokens/:id', authenticate, loginRequired, (req, res) => {
    const user: UserInfo = res.locals.user;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        Util.sendResponse(res, resCode.badRequest);
        return;
    }

    client.api_token
        .updateMany({
            where: { id, user_id: user.id, revoked_at: null },
            data: { revoked_at: new Date() },
        })
        .then((result) => {
            if (!result.count) {
                Util.sendResponse(res, resCode.notFound);
                return;
            }
            Util.sendResponse(res, resCode.success);
        })
        .catch((err) => Util.sendResponse(res, resCode.serverError, err));
});

module.exports = router;
