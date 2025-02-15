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

function getPublicUserDetails(user_id: number) {
    return client.users.findUniqueOrThrow({
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
                    created_at: true,
                    questions: {
                        select: {
                            _count: {
                                select: {
                                    results: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    id: 'desc',
                },
            },
        },
    });
}

async function getUserStats(user_id: number) {
    const totalPoints = await client.results.aggregate({
        _sum: {
            result: true,
        },
        where: {
            question: {
                deleted_at: null,
                competitions: {
                    deleted_at: null,
                    practice: false,
                },
            },
            user_id: user_id,
        },
    });

    const participated = await client.competitions.findMany({
        where: {
            questions: {
                some: {
                    results: {
                        some: {
                            user_id: user_id,
                        },
                    },
                    deleted_at: null,
                },
            },
            deleted_at: null,
            public: true,
        },
        include: {
            host_user: {
                select: {
                    id: true,
                    name: true,
                },
            },
            questions: {
                select: {
                    results: {
                        select: {
                            accepted: true,
                            created_at: true,
                            language: true,
                            result: true,
                        },
                        orderBy: {
                            id: 'desc',
                        },
                    },
                },
            },
        },
    });

    return {
        hunt_points: totalPoints._sum.result,
        participated: participated,
    };
}

router.get('/users/:id', authenticate, loginRequired, (req, res) => {
    const user_id = parseInt(req.params.id);

    getPublicUserDetails(user_id)
        .then((rows) => {
            getUserStats(user_id).then((stats) => {
                Util.sendResponseJson(res, resCode.success, {
                    ...rows,
                    ...stats,
                });
            });
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
