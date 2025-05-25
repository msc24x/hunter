import express from 'express';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';
import { CompetitionInvite, UserInfo } from '../../config/types';
import { Util } from '../../util/util';
import { resCode } from '../../config/settings';
import { Sanitizer } from '../../util/sanitizer/sanitizer';
import { authenticate, loginRequired } from '../auth';
import { Competitions } from '../../database/models/Competitions';
import models from '../../database/containers/models';
import { sendInviteRemovedEmail } from '../../emails/invite-removed/sender';

var router = express.Router();
const client = Container.get(DatabaseProvider).client();

function parseInviteInfo(rawInfo: string): [number, string] {
    var rawArr = atob(rawInfo).split('-');
    var inviteId = rawArr.splice(0, 1)[0];
    var inviteUUID = rawArr.join('-');

    return [parseInt(inviteId), inviteUUID];
}

router.post(
    '/competitions/:id/invites',
    authenticate,
    loginRequired,
    (req, res) => {
        var invites = req.body as CompetitionInvite[];
        var comp_id = parseInt(req.params.id);
        var user = res.locals.user as UserInfo;

        if (!invites || invites?.length > 5) {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }

        for (let invite of invites) {
            invite.email = invite.email.toLowerCase().trim();

            if (!invite?.email || !Sanitizer.isEmail(invite.email)) {
                Util.sendResponse(res, resCode.badRequest, 'Invalid email(s)');
                return;
            }
        }

        client.competitions
            .findUnique({
                where: {
                    id: comp_id,
                    host_user_id: user.id,
                },
                include: {
                    competition_invites: true,
                },
            })
            .then(
                (competition) => {
                    if (!competition) {
                        Util.sendResponse(res, resCode.notFound);
                        return;
                    }

                    var emailsToInvite = invites.flatMap((i) => i.email);

                    for (let existingInvite of competition.competition_invites) {
                        if (emailsToInvite.includes(existingInvite.email)) {
                            Util.sendResponseJson(res, resCode.badRequest, {
                                errors: {
                                    invites:
                                        'Invite has already been sent for some of the emails provided',
                                },
                            });
                            return;
                        }
                    }

                    invites.forEach((invite) => {
                        invite.accepted_at = null;
                        invite.competition_id = competition.id;
                        invite.user_id = undefined;
                        invite.sent_at = null;
                    });

                    client.competition_invite
                        .createMany({
                            data: invites,
                            skipDuplicates: true,
                        })
                        .then(
                            async (invites) => {
                                Util.sendResponseJson(
                                    res,
                                    resCode.success,
                                    await Competitions.getInvites(
                                        competition.id
                                    )
                                );
                                Competitions.sendInviteEmailToPending(comp_id);
                                return;
                            },
                            (err) => {
                                Util.sendResponseJson(
                                    res,
                                    resCode.serverError,
                                    err
                                );
                            }
                        );
                },
                (err) => {
                    Util.sendResponse(res, resCode.serverError);
                }
            );
    }
);

router.get('/competitions/invites/:invite_id', (req, res) => {
    const [inviteId, inviteUUID] = parseInviteInfo(req.params.invite_id);

    client.competition_invite
        .findUnique({
            where: {
                id: inviteId,
                uuid: inviteUUID,
                accepted_at: null,
                competition: {
                    visibility: 'INVITE',
                    deleted_at: null,
                },
            },
            include: {
                competition: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        host_user: {
                            select: {
                                id: true,
                                name: true,
                                avatar_url: true,
                            },
                        },
                    },
                },
            },
        })
        .then((invite) => {
            if (!invite) {
                Util.sendResponse(res, resCode.notFound);
                return;
            }

            Util.sendResponseJson(res, resCode.success, invite);
        });
});

router.post(
    '/competitions/invites/:invite_id',
    authenticate,
    loginRequired,
    (req, res) => {
        const [inviteId, inviteUUID] = parseInviteInfo(req.params.invite_id);
        const user = res.locals.user as UserInfo;

        client.competition_invite
            .update({
                where: {
                    id: inviteId,
                    uuid: inviteUUID,
                    competition: {
                        visibility: 'INVITE',
                        deleted_at: null,
                    },
                },
                data: {
                    accepted_at: new Date(),
                    user_id: user.id,
                },
            })
            .then(() => {
                Util.sendResponse(res, resCode.success);
            });
    }
);

router.delete(
    '/competitions/:id/invites/:invite_id',
    authenticate,
    loginRequired,
    (req, res) => {
        const user = res.locals.user as UserInfo;

        client.competition_invite
            .delete({
                where: {
                    id: parseInt(req.params.invite_id),
                    competition_id: parseInt(req.params.id),
                    competition: {
                        host_user_id: user.id,
                    },
                },
                include: {
                    competition: {
                        include: {
                            host_user: true,
                        },
                    },
                },
            })
            .then((invite) => {
                Util.sendResponse(res, resCode.success);
                sendInviteRemovedEmail(invite as CompetitionInvite);
            })
            .catch((err) => {
                console.error(err);
                Util.sendResponse(res, resCode.serverError);
            });
    }
);

module.exports = router;
