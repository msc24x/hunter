import express, { Request, Response } from 'express';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';
import { Util } from '../../util/util';
import { resCode } from '../../config/settings';
import { authenticate, loginRequired } from '../auth';
import { Community, UserInfo } from '../../config/types';
import { createFile } from '../../util/serverStorage';
import { error } from 'console';

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

    if (!data.name) {
        errors.name = ['Name is required'];
    }

    if (!data.description) {
        errors.description = ['Description is required'];
    }

    if (!data.website_link) {
        errors.website_link = ['Website link is required'];
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
    console.log(description);

    client.$transaction(async (tranc) => {
        var community = await tranc.community.create({
            data: {
                name,
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

        Util.sendResponseJson(res, resCode.created, community);
    });
});

router.get('/communities/:id', (req, res) => {
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

router.get('/communities', (req, res) => {
    client.community
        .findMany({
            where: {
                // status: 'APPROVED',
            },
            include: {
                admin_user: {
                    select: {
                        id: true,
                        name: true,
                        avatar_url: true,
                    },
                },
            },
        })
        .then((communities) => {
            Util.sendResponseJson(res, resCode.accepted, communities);
        });
});

module.exports = router;
