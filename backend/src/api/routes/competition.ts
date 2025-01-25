import express, { Request, Response } from 'express';
import models from '../../database/containers/models';
import { CompetitionInfo, UserInfo } from '../../config/types';
import { Util } from '../../util/util';
import { authenticate, loginRequired } from '../auth';
import { resCode } from '../../config/settings';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';
import { time } from 'console';

var router = express.Router();
const client = Container.get(DatabaseProvider).client();

router.delete('/competition/:id', authenticate, loginRequired, (req, res) => {
    client.competitions
        .update({
            where: {
                id: parseInt(req.params.id),
                host_user_id: res.locals.user.id,
            },
            data: {
                deleted_at: new Date(),
            },
        })
        .then((competition) => {
            if (!competition) {
                Util.sendResponse(res, resCode.notFound);
                return;
            }
            Util.sendResponse(res, resCode.success);
        })
        .catch(() => {
            Util.sendResponse(res, resCode.badRequest);
        });
});

router.post('/competition', authenticate, loginRequired, (req, res) => {
    const title = req.body.title;

    if (title == null || (title as string).length > 20) {
        Util.sendResponse(
            res,
            resCode.badRequest,
            'No more than 120 characters are allowed'
        );
        return;
    }

    client.competitions
        .create({
            data: {
                title: req.body.title,
                description: req.body.description,
                public: false,
                created_at: new Date(),
                host_user_id: res.locals.user.id,
                updated_at: new Date(),
            },
        })
        .then((competition) => {
            if (!competition) {
                Util.sendResponse(res, resCode.serverError);
                return;
            }
            Util.sendResponseJson(res, resCode.success, competition);
        })
        .catch(() => {
            Util.sendResponse(res, resCode.serverError);
        });
});

router.put('/competition', authenticate, loginRequired, (req, res) => {
    const competitionBody = req.body;
    if (
        !competitionBody.host_user_id ||
        !competitionBody.id ||
        competitionBody.title.length > 120 ||
        competitionBody.description.length > 456
    ) {
        Util.sendResponse(res, resCode.badRequest);
        return;
    }

    client.competitions
        .findUnique({ where: { id: parseInt(competitionBody.id) } })
        .then((competition) => {
            if (!competition) {
                Util.sendResponse(res, resCode.notFound);
                return;
            }

            if (competition.host_user_id != res.locals.user.id) {
                Util.sendResponse(res, resCode.forbidden);
                return;
            }

            client.competitions
                .update({
                    where: {
                        id: competition.id,
                        host_user_id: res.locals.user.id,
                    },
                    data: {
                        description: competitionBody.description,
                        title: competitionBody.title,
                        public: competitionBody.public,
                        scheduled_at: competitionBody.scheduled_at
                            ? new Date(competitionBody.scheduled_at)
                            : null,
                        scheduled_end_at: competitionBody.scheduled_end_at
                            ? new Date(competitionBody.scheduled_end_at)
                            : null,
                        updated_at: new Date(),
                    },
                })
                .then((competition) => {
                    Util.sendResponseJson(res, resCode.success, competition);
                })
                .catch((err) => {
                    Util.sendResponse(res, resCode.serverError, err);
                });
        });
});

router.get('/competition/:id', authenticate, loginRequired, (req, res) => {
    if (req.params.id == '') {
        Util.sendResponse(res, resCode.badRequest);
        return;
    }

    client.competitions
        .findUnique({ where: { id: parseInt(req.params.id) } })
        .then((competition) => {
            if (!competition) {
                Util.sendResponse(res, resCode.notFound);
                return;
            }

            // send the competition right away if its public
            if (competition.public) {
                Util.sendResponseJson(res, resCode.success, competition);
                return;
            }

            if (!res.locals.isAuthenticated) {
                Util.sendResponse(res, resCode.forbidden);
                return;
            }

            if (competition.host_user_id != res.locals.user.id) {
                Util.sendResponse(res, resCode.forbidden);
                return;
            }

            Util.sendResponseJson(res, resCode.success, competition);
        });
});

router.get('/competitions', authenticate, (req, res) => {
    const user: UserInfo | null = res.locals.user;
    const params = {
        query: req.query.query?.toString() || '',
        includeSelf: req.query.includeSelf?.toString() === 'true',
        liveStatus: req.query.liveStatus?.toString() || 'all',
        orderBy: req.query.orderBy?.toString() || '',
    };

    if (!res.locals.isAuthenticated) {
        params.includeSelf = false;
    }

    var orParams: any[] = [];
    var andParams = [];
    var orderBy: any = {};

    if (params.query) {
        andParams.push({
            OR: [
                { title: { contains: params.query } },
                { description: { contains: params.query } },
            ],
        });
    }

    if (params.includeSelf) {
        andParams.push({ host_user_id: user!.id });
    } else {
        andParams.push({ public: true });
    }

    if (params.liveStatus === 'upcoming') {
        andParams.push({
            scheduled_at: {
                gt: new Date(),
            },
        });
    } else if (params.liveStatus === 'live') {
        andParams.push({
            scheduled_at: {
                lt: new Date(),
            },
        });
    } else if (params.liveStatus === 'always') {
        andParams.push({
            scheduled_end_at: null,
        });
    }

    if (['asc', 'desc'].includes(params.orderBy)) {
        orderBy.created_at = params.orderBy;
    }

    const whereClause = {
        deleted_at: null,
        ...(orParams.length && { OR: [...orParams] }),
        ...(andParams.length && { AND: [...andParams] }),
    };

    client.competitions
        .findMany({
            where: whereClause,
            orderBy: orderBy,
            include: {
                host_user: {
                    select: {
                        id: true,
                        avatar_url: true,
                        name: true,
                    },
                },
            },
        })
        .then((competitions) => {
            if (params.liveStatus === 'live') {
                competitions = competitions.filter((comp) => {
                    if (!comp.scheduled_end_at) return true;
                    return new Date() < comp.scheduled_end_at;
                });
            }
            Util.sendResponseJson(res, resCode.success, competitions);
        })
        .catch((err) => Util.sendResponse(res, resCode.serverError, err));
});

module.exports = router;
