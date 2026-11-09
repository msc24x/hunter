import express from 'express';
import { Prisma } from '@prisma/client';
import Container from 'typedi';
import { resCode } from '../../config/settings';
import { DatabaseProvider } from '../../services/databaseProvider';
import { Util } from '../../util/util';
import { authenticate } from '../auth';

const router = express.Router();

const client = Container.get(DatabaseProvider).client();

const TOP_N = 100;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

type LeaderboardRow = {
    user_rank: number;
    user_id: number;
    user_name: string | null;
    user_avatar_url: string | null;
    result: number;
};

type LeaderboardPayload = {
    meta: { total: number };
    rows: LeaderboardRow[];
};

const cache = new Map<
    string,
    { expiresAt: number; payload: LeaderboardPayload }
>();

function scoresSource(communityId?: number) {
    const communityFilter = communityId
        ? Prisma.sql`AND c.community_id = ${communityId}`
        : Prisma.empty;

    return Prisma.sql`
        SELECT
            r.user_id,
            u.name AS user_name,
            u.avatar_url AS user_avatar_url,
            SUM(r.result) AS total_points
        FROM
            results r
        JOIN
            questions q ON r.question_id = q.id
        JOIN
            competitions c ON q.competition_id = c.id
        JOIN
            users u ON r.user_id = u.id
        WHERE
            q.deleted_at IS NULL
            AND c.deleted_at IS NULL
            AND c.practice = false
            ${communityFilter}
        GROUP BY
            r.user_id,
            u.name,
            u.avatar_url
    `;
}

async function buildLeaderboard(
    communityId?: number
): Promise<LeaderboardPayload> {
    const source = scoresSource(communityId);

    const rows = (await client.$queryRaw`
        SELECT
            ranked.user_rank,
            ranked.user_id,
            ranked.user_name,
            ranked.user_avatar_url,
            ranked.total_points AS result
        FROM (
            SELECT
                t.*,
                RANK() OVER (
                    ORDER BY t.total_points DESC
                ) AS user_rank
            FROM (${source}) t
        ) ranked
        ORDER BY
            ranked.user_rank,
            ranked.user_id
        LIMIT ${TOP_N}
    `) as LeaderboardRow[];

    const totals = (await client.$queryRaw`
        SELECT COUNT(*) AS total FROM (${source}) t
    `) as Array<{ total: number }>;

    return {
        meta: { total: Number(totals[0]?.total ?? 0) },
        rows,
    };
}

router.get('/leaderboard', authenticate, async (req, res) => {
    const communityParam = req.query.community_id?.toString();
    const communityId = communityParam ? parseInt(communityParam) : null;

    if (communityParam && (!communityId || communityId <= 0)) {
        Util.sendResponse(res, resCode.badRequest, 'invalid community_id');
        return;
    }

    const cacheKey = communityId ? `community:${communityId}` : 'global';
    const nocache = req.query.nocache?.toString() === 'true';

    const cached = cache.get(cacheKey);

    if (!nocache && cached && cached.expiresAt > Date.now()) {
        res.setHeader('Cache-Control', 'public, max-age=1800');
        Util.sendResponseJson(res, resCode.success, cached.payload);
        return;
    }

    try {
        const payload = await buildLeaderboard(communityId || undefined);

        cache.set(cacheKey, {
            expiresAt: Date.now() + CACHE_TTL_MS,
            payload,
        });

        res.setHeader(
            'Cache-Control',
            nocache ? 'no-store' : 'public, max-age=1800'
        );
        Util.sendResponseJson(res, resCode.success, payload);
    } catch (err: any) {
        if (cached) {
            res.setHeader('Cache-Control', 'public, max-age=60');
            Util.sendResponseJson(res, resCode.success, cached.payload);
            return;
        }

        Util.sendResponse(res, resCode.serverError, err?.message || err);
    }
});

module.exports = router;
