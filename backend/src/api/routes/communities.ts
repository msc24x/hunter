import express, { Request, Response } from 'express';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';
import { Util } from '../../util/util';
import { resCode } from '../../config/settings';
import { authenticate, loginRequired } from '../auth';
import {
    Community,
    CommunityMember,
    CommunityPermission,
    UserInfo,
} from '../../config/types';
import { createFile } from '../../util/serverStorage';
import { error, log } from 'console';
import { sendCommunityRequestedEmail } from '../../emails/community-requested/sender';
import { sendMembershipStatusEmail } from '../../emails/membership-status-update/sender';

const router = express.Router();
const client = Container.get(DatabaseProvider).client();

function isImageFormat(buffer: Buffer): { valid: boolean; ext?: string } {
    const pngMagic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const jpegMagic = [0xff, 0xd8];
    const isMagic = (magic: number[]) => magic.every((v, i) => buffer[i] === v);
    if (isMagic(pngMagic)) return { valid: true, ext: 'png' };
    if (isMagic(jpegMagic)) return { valid: true, ext: 'jpg' };
    return { valid: false };
}

function validateCommunityRequest(data: Community) {
    var errors: any = {};

    if (!data.name?.trim()) {
        errors.name = ['Name is required'];
    } else if (data.name.length > 120) {
        errors.name = ['Name cannot be more than 120 characters'];
    }

    if (!data.description?.trim()) {
        errors.description = ['Description is required'];
    } else if (data.description.length > 456) {
        errors.description = ['Description cannot be more than 456 characters'];
    }

    if (!data.website_link?.trim()) {
        errors.website_link = ['Website link is required'];
    } else if (data.website_link.length > 224) {
        errors.website_link = [
            'Website link cannot be more than 224 characters',
        ];
    }

    if (!data.logo_file_path) {
        errors.logo_file_path = ['Logo is required'];
    } else {
        // Validate base64 image size (max 3MB)
        const logoBuffer = Buffer.from(data.logo_file_path!, 'base64');

        if (logoBuffer.length > 3 * 1024 * 1024) {
            errors.logo_file_path = ['Logo file size exceeds 3MB'];
        }

        // Validate image type (PNG/JPG/JPEG)
        const formatCheck = isImageFormat(logoBuffer);
        if (!formatCheck.valid) {
            errors.logo_file_path = [
                'Logo file is not a valid image file (png, jpg or jpeg)',
            ];
        }
    }

    return errors;
}

router.post('/communities/create', authenticate, loginRequired, (req, res) => {
    const { name, description, website_link, logo_file_path } =
        req.body as Community;
    const user = res.locals.user as UserInfo;

    var errors = validateCommunityRequest(req.body);

    if (Object.keys(errors).length) {
        return Util.sendResponseJson(res, resCode.badRequest, errors);
    }

    const logoBuffer = Buffer.from(logo_file_path!, 'base64');
    const formatCheck = isImageFormat(logoBuffer);

    client.$transaction(async (tranc) => {
        let sameNameCommunity = await tranc.community.findFirst({
            where: {
                name: { equals: name?.trim() || '' },
                status: { not: 'DISABLED' },
            },
        });

        if (sameNameCommunity) {
            Util.sendResponse(
                res,
                resCode.badRequest,
                'A non disabled community with the same name already exists on Hunter, please chose a different name'
            );
            return;
        }

        let existingCommunities = await tranc.community.findMany({
            where: {
                admin_user_id: user.id,
                status: { not: 'DISABLED' },
            },
        });

        if (existingCommunities.length >= 3) {
            Util.sendResponse(
                res,
                resCode.forbidden,
                'You have reached the limit of 3 communities per account. If you require an exception, please contact support at msc24x@gmail.com.'
            );
            return;
        }

        for (let c of existingCommunities) {
            if (c.name?.toLowerCase().trim() == name?.toLowerCase().trim()) {
                Util.sendResponse(
                    res,
                    resCode.badRequest,
                    `You already have an existing community or a creation request with name ${c.name}`
                );
            }
        }

        var community = await tranc.community.create({
            data: {
                name: name?.trim() || '',
                description,
                website_link,
                admin_user_id: user.id,
                status: 'PENDING_APPROVAL',
                created_at: new Date(),
            },
        });
        const logoFileName = `community_logo/${community.id}.${formatCheck.ext}`;

        await createFile(logoFileName, logoBuffer);
        await tranc.community.update({
            where: { id: community.id },
            data: { logo_file_path: logoFileName },
        });

        await tranc.community_member.create({
            data: {
                community_id: community.id,
                user_id: user.id,
                created_at: new Date(),
                status: 'APPROVED',
            },
        });

        Util.sendResponseJson(res, resCode.created, community);

        sendCommunityRequestedEmail({
            community: {
                id: community.id,
                name: community.name || '(No name given)',
            },
        });
    });
});

router.get('/communities/:id(\\d+)', (req, res) => {
    let id = parseInt(req.params.id?.toString() || '');

    client.community
        .findFirstOrThrow({
            where: {
                id: id,
            },
            include: {
                admin_user: {
                    select: {
                        id: true,
                        name: true,
                        avatar_url: true,
                    },
                },
                competitions: {
                    where: {
                        deleted_at: null,
                    },
                },
                _count: {
                    select: {
                        members: { where: { status: 'APPROVED' } },
                        competitions: {
                            where: {
                                deleted_at: null,
                                visibility: 'PUBLIC',
                            },
                        },
                    },
                },
            },
        })
        .then((community) => {
            Util.sendResponseJson(res, resCode.accepted, community);
        })
        .catch((e) => {
            console.error(e);
            Util.sendResponse(res, resCode.notFound);
        });
});

router.get('/communities', authenticate, (req, res) => {
    let user_id = res.locals.user?.id as number | undefined;

    client.community
        .findMany({
            where: {
                OR: [
                    {
                        status: 'APPROVED',
                    },
                    user_id
                        ? {
                              admin_user_id: user_id,
                          }
                        : {},
                ],
            },
            include: {
                admin_user: {
                    select: {
                        id: true,
                        name: true,
                        avatar_url: true,
                    },
                },
                members: {
                    where: { user_id: user_id, status: 'APPROVED' },
                    select: {
                        permissions: {},
                    },
                },
            },
            orderBy: [
                { is_partner: 'desc' },
                { status: 'asc' },
                { created_at: 'desc' },
            ],
        })
        .then((communities) => {
            Util.sendResponseJson(res, resCode.accepted, communities);
        });
});

router.get(
    '/communities/memberships',
    authenticate,
    loginRequired,
    (req, res) => {
        let user = res.locals.user as UserInfo;
        let community_id = parseInt(req.query.community_id?.toString() || '');

        client.community_member
            .findMany({
                where: {
                    user_id: user.id,
                    status: {
                        not: 'DISABLED',
                    },
                    ...(community_id ? { community_id: community_id } : {}),
                },
            })
            .then((community_members) => {
                Util.sendResponseJson(res, resCode.accepted, community_members);
            });
    }
);

router.get(
    '/communities/:id/memberships/approved',
    authenticate,
    loginRequired,
    (req, res) => {
        let user = res.locals.user as UserInfo;
        let community_id = parseInt(req.params.id?.toString() || '');

        client.community_member
            .findMany({
                where: {
                    status: 'APPROVED',
                    community: {
                        id: community_id,
                        admin_user_id: user.id,
                        status: 'APPROVED',
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatar_url: true,
                        },
                    },
                    permissions: {
                        select: {
                            code: true,
                        },
                    },
                },
                orderBy: {
                    permissions: { _count: 'desc' },
                },
            })
            .then((community_members) => {
                Util.sendResponseJson(res, resCode.accepted, community_members);
            });
    }
);

router.get(
    '/communities/:id/memberships/pending',
    authenticate,
    loginRequired,
    (req, res) => {
        let user = res.locals.user as UserInfo;
        let community_id = parseInt(req.params.id?.toString() || '');

        client.community_member
            .findMany({
                where: {
                    status: 'PENDING_APPROVAL',
                    community: {
                        id: community_id,
                        admin_user_id: user.id,
                        status: 'APPROVED',
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatar_url: true,
                        },
                    },
                },
            })
            .then((community_members) => {
                Util.sendResponseJson(res, resCode.accepted, community_members);
            });
    }
);

function getCommunityPerms(): Promise<CommunityPermission[]> {
    return client.community_permission.findMany();
}

function isValidPerm(perms: CommunityPermission[], code: string) {
    return perms.find((p) => p.code === code);
}

router.patch(
    '/communities/:community_id/permissions',
    authenticate,
    loginRequired,
    (req, res) => {
        let user = res.locals.user as UserInfo;
        let community_id = parseInt(req.params.community_id?.toString() || '');
        let members = req.body as CommunityMember[];

        if (!members) {
            Util.sendResponse(res, resCode.notFound);
            return;
        }

        getCommunityPerms().then((validPerms) => {
            members.forEach((member) => {
                let newPerms: { id: number }[] = [];

                member.permissions?.forEach((p) => {
                    let dbPerm = isValidPerm(validPerms, p.code);

                    if (!dbPerm) return;

                    newPerms.push({ id: dbPerm.id });
                });

                console.log(newPerms);

                client.community_member
                    .update({
                        where: {
                            id: member.id,
                            status: 'APPROVED',
                            community: {
                                id: community_id,
                                admin_user_id: user.id,
                                status: { not: 'DISABLED' },
                            },
                        },
                        data: {
                            permissions: {
                                set: newPerms || [],
                            },
                        },
                    })
                    .then((updatedMembers) => {
                        Util.sendResponse(res, resCode.success);
                    })
                    .catch((err) => {
                        Util.sendResponse(res, resCode.badRequest);
                    });
            });
        });
    }
);

router.patch(
    '/communities/:community_id/memberships/:operation',
    authenticate,
    loginRequired,
    (req, res) => {
        let user = res.locals.user as UserInfo;
        let community_id = parseInt(req.params.community_id?.toString() || '');
        let operation = req.params.operation?.toString() || '';
        let operation_text: string = '';

        if (operation === 'accept') {
            operation = 'APPROVED';
            operation_text = 'Approved';
        } else if (operation === 'reject') {
            operation = 'NOT_APPROVED';
            operation_text = 'Rejected';
        } else if (operation === 'disable') {
            operation = 'DISABLED';
            operation_text = 'Disabled';
        } else {
            Util.sendResponse(res, resCode.notFound);
            return;
        }

        let memberships = req.body as Array<CommunityMember>;
        let member_ids = memberships.map((v) => v.id);

        client.community_member
            .updateMany({
                where: {
                    community_id: community_id,
                    community: {
                        admin_user_id: user.id,
                        status: 'APPROVED',
                    },
                    id: { in: member_ids },
                },
                data: {
                    status: operation as
                        | 'APPROVED'
                        | 'NOT_APPROVED'
                        | 'DISABLED',
                },
            })
            .then((community_members) => {
                Util.sendResponse(res, resCode.success);

                client.community_member
                    .findMany({
                        where: {
                            community_id: community_id,
                            community: {
                                admin_user_id: user.id,
                            },
                            id: { in: member_ids },
                        },
                        include: {
                            community: {
                                select: {
                                    name: true,
                                },
                            },
                            user: {
                                select: {
                                    email: true,
                                    name: true,
                                },
                            },
                        },
                    })
                    .then((members) => {
                        members?.forEach((member) => {
                            sendMembershipStatusEmail({
                                community_data: {
                                    id: member.community_id,
                                    name: member.community.name!,
                                    url: Util.getCommunityURL(
                                        member.community_id
                                    ),
                                },
                                status: operation_text as
                                    | 'Accepted'
                                    | 'Disabled'
                                    | 'Rejected',
                                user: {
                                    name: member.user.name!,
                                    email: member.user.email!,
                                },
                            });
                        });
                    });
            });
    }
);

router.post(
    '/communities/:id/join',
    authenticate,
    loginRequired,
    (req, res) => {
        let user = res.locals.user as UserInfo;
        let community_id = parseInt(req.params.id?.toString() || '');

        client.community_member
            .findMany({
                where: {
                    user_id: user.id,
                    status: {
                        not: 'DISABLED',
                    },
                    community: {
                        id: community_id,
                    },
                },
                include: { community: true },
            })
            .then((community_members) => {
                if (community_members.length) {
                    Util.sendResponse(
                        res,
                        resCode.forbidden,
                        'Request was already sent'
                    );
                    return;
                }

                client.community
                    .findFirst({
                        where: {
                            id: community_id,
                            status: 'APPROVED',
                        },
                    })
                    .then((community) => {
                        if (community?.status !== 'APPROVED') {
                            Util.sendResponse(
                                res,
                                resCode.forbidden,
                                'Can only join Approved Communities'
                            );
                            return;
                        }

                        let status: 'PENDING_APPROVAL' | 'APPROVED' =
                            'PENDING_APPROVAL';

                        if (community.auto_approve_members) {
                            status = 'APPROVED';
                        }

                        client.community_member
                            .create({
                                data: {
                                    community_id: community_id,
                                    user_id: user.id,
                                    status: status,
                                },
                            })
                            .then((community_member) => {
                                Util.sendResponseJson(
                                    res,
                                    resCode.accepted,
                                    community_member
                                );
                            });
                    });
            });
    }
);

function validateCommunityPatch(body: any) {
    const errors: any = {};
    if (body.auto_approve_members === undefined) {
        errors.auto_approve_members = [
            'Field "auto_approve_members" is required',
        ];
    } else if (typeof body.auto_approve_members !== 'boolean') {
        errors.auto_approve_members = [
            'Field "auto_approve_members" must be a boolean',
        ];
    }
    return errors;
}

router.patch('/communities/:id', authenticate, loginRequired, (req, res) => {
    const user = res.locals.user as UserInfo;
    const id = parseInt(req.params.id?.toString() || '');

    const body = req.body as { auto_approve_members?: boolean };
    const errors = validateCommunityPatch(body);
    if (Object.keys(errors).length) {
        return Util.sendResponseJson(res, resCode.badRequest, errors);
    }

    // single update operation guarded by admin_user_id in where clause
    client.community
        .update({
            where: { id: id, admin_user_id: user.id },
            data: { auto_approve_members: body.auto_approve_members },
        })
        .then((result) => {
            if (!result) {
                return Util.sendResponse(
                    res,
                    resCode.forbidden,
                    'You are not authorized to update this community'
                );
            }

            Util.sendResponseJson(res, resCode.success, result);
        })
        .catch((e) => {
            console.error(e);
            Util.sendResponse(res, resCode.serverError);
        });
});

router.post(
    '/communities/:id/leave',
    authenticate,
    loginRequired,
    (req, res) => {
        const user = res.locals.user as UserInfo;
        const community_id = parseInt(req.params.id?.toString() || '');

        // mark existing membership as DISABLED for this user and community
        client.community_member
            .updateMany({
                where: {
                    user_id: user.id,
                    community_id: community_id,
                    status: { not: 'DISABLED' },
                    community: {
                        admin_user_id: { not: user.id },
                    },
                },
                data: {
                    status: 'DISABLED',
                },
            })
            .then((result) => {
                if (result.count === 0) {
                    // no active membership found
                    return Util.sendResponse(
                        res,
                        resCode.forbidden,
                        'No active membership found for this community'
                    );
                }

                Util.sendResponse(res, resCode.success);
            })
            .catch((e) => {
                console.error(e);
                Util.sendResponse(res, resCode.serverError);
            });
    }
);

module.exports = router;
