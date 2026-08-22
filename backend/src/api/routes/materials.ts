import express, { Request, Response } from 'express';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';
import { Util, detectFileFormat } from '../../util/util';
import { resCode } from '../../config/settings';
import { authenticate, loginRequired } from '../auth';
import { UserInfo } from '../../config/types';
import config from '../../config/config';
import { createFile, deleteFile } from '../../util/serverStorage';
import fileUpload from 'express-fileupload';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

var router = express.Router();
const client = Container.get(DatabaseProvider).client();

// Resolve the on-disk relative path for a material file.
function materialFilePath(materialId: number, ext: string): string {
    return `${config.fileScopes.materials}${materialId}.${ext}`;
}

// GET /competitions/:comp_id/materials
// Host: list all (incl. soft-deleted? no — only live). Participant: gated by question GET logic.
router.get(
    '/competitions/:comp_id/materials',
    authenticate,
    async (req: Request, res: Response) => {
        const comp_id = parseInt(req.params.comp_id);
        const user: UserInfo | null = res.locals.user;

        if (isNaN(comp_id)) {
            Util.sendResponse(res, resCode.badRequest);
            return;
        }

        try {
            const competition = await client.competitions.findUnique({
                where: { id: comp_id, deleted_at: null },
                select: {
                    id: true,
                    host_user_id: true,
                    visibility: true,
                    practice: true,
                    scheduled_at: true,
                    scheduled_end_at: true,
                    competition_sessions: user
                        ? { where: { user_id: user.id } }
                        : undefined,
                },
            });

            if (!competition) {
                Util.sendResponse(res, resCode.notFound);
                return;
            }

            const isHost = competition.host_user_id === user?.id;

            const materials = await client.materials.findMany({
                where: {
                    competition_id: comp_id,
                    deleted_at: null,
                },
                orderBy: { id: 'asc' },
                select: {
                    id: true,
                    title: true,
                    type: true,
                    content: true,
                    file_path: true,
                    file_size: true,
                    created_at: true,
                    updated_at: true,
                    _count: {
                        select: {
                            question_materials: {
                                where: {
                                    question: { deleted_at: null },
                                },
                            },
                        },
                    },
                },
            });

            // Participants only see materials when the question statement
            // would be visible to them (mirrors question GET gating).
            if (!isHost) {
                const isPublic = competition.visibility !== 'PRIVATE';
                if (!isPublic) {
                    Util.sendResponse(res, resCode.notFound);
                    return;
                }
                const now = new Date();
                const started =
                    !competition.scheduled_at || competition.scheduled_at <= now;
                const hasSession =
                    (competition.competition_sessions?.length ?? 0) > 0;
                if (!started || (!hasSession && !competition.practice)) {
                    // Hide content until live for the participant.
                    materials.forEach((m) => {
                        m.content = null;
                        m.file_path = null;
                        m.file_size = null;
                    });
                }
            }

            // Flatten the _count into a simple linked_count for the client.
            const shaped = materials.map((m: any) => {
                const { _count, ...rest } = m;
                return {
                    ...rest,
                    linked_count: _count?.question_materials ?? 0,
                };
            });

            Util.sendResponseJson(res, resCode.success, shaped);
        } catch (err: any) {
            Util.sendResponse(res, resCode.serverError, err);
        }
    },
);

// GET /competitions/:comp_id/materials/:id
// Host-only: returns a single material plus the list of questions it is
// linked to (id + title), for the materials browser detail view.
router.get(
    '/competitions/:comp_id/materials/:id',
    authenticate,
    loginRequired,
    async (req: Request, res: Response) => {
        const comp_id = parseInt(req.params.comp_id);
        const id = parseInt(req.params.id);
        const user: UserInfo = res.locals.user;

        try {
            const material = await client.materials.findUnique({
                where: { id },
                select: {
                    id: true,
                    title: true,
                    type: true,
                    content: true,
                    file_path: true,
                    file_size: true,
                    created_at: true,
                    updated_at: true,
                    competition: { select: { host_user_id: true } },
                    question_materials: {
                        where: { question: { deleted_at: null } },
                        select: {
                            question_id: true,
                            material_id: true,
                            position: true,
                            question: {
                                select: { id: true, title: true },
                            },
                        },
                        orderBy: { position: 'asc' },
                    },
                },
            });

            if (
                !material ||
                material.competition.host_user_id !== user.id
            ) {
                Util.sendResponse(res, resCode.notFound);
                return;
            }

            const { competition, ...rest } = material;
            Util.sendResponseJson(res, resCode.success, rest);
        } catch (err: any) {
            Util.sendResponse(res, resCode.serverError, err);
        }
    },
);

// POST /competitions/:comp_id/materials
// Creates a material. For file types (pdf/image/audio/video) the file must be
// present in req.files.file. For rich_text, content is taken from req.body.content.
router.post(
    '/competitions/:comp_id/materials',
    authenticate,
    loginRequired,
    async (req: Request, res: Response) => {
        const comp_id = parseInt(req.params.comp_id);
        const user: UserInfo = res.locals.user;
        const body = req.body || {};
        const type = parseInt(body.type);

        const errors: Record<string, string> = {};

        if (!Object.values(config.materialTypes).includes(type)) {
            errors.type = 'Material type not supported';
            Util.sendResponseJson(res, resCode.badRequest, errors);
            return;
        }

        if ((body.title || '').length > 400) {
            errors.title = 'Characters more than 400 are not allowed in title';
        }

        const isFileType = type !== config.materialTypes.rich_text;

        let fileBuffer: Buffer | null = null;
        let fileExt: string | null = null;

        if (isFileType) {
            const uploaded = req.files?.file as
                | fileUpload.UploadedFile
                | undefined;
            if (!uploaded) {
                errors.file = 'A file is required for this material type';
            } else {
                const limit = (config.materialFileLimits as any)[type];
                if (uploaded.size > limit.max) {
                    errors.file = `File size exceeds the ${Math.floor(
                        limit.max / (1024 * 1024),
                    )}MB limit for this material type`;
                }
                fileBuffer = Buffer.from(uploaded.data);
                const detected = await detectFileFormat(fileBuffer, uploaded.name);
                if (!detected) {
                    errors.file = 'File format could not be recognized';
                } else if (!limit.exts.includes(detected)) {
                    errors.file = `File format ${detected} is not allowed for this material type (allowed: ${limit.exts.join(
                        ', ',
                    )})`;
                } else {
                    fileExt = detected;
                }
            }
        } else {
            // rich_text
            const content = body.content || '';
            if (content.length > 65535) {
                errors.content =
                    'Content is too large (max 65535 characters)';
            }
        }

        if (Object.keys(errors).length) {
            Util.sendResponseJson(res, resCode.badRequest, errors);
            return;
        }

        try {
            const competition = await client.competitions.findUnique({
                where: {
                    id: comp_id,
                    host_user_id: user.id,
                    deleted_at: null,
                },
                select: { id: true },
            });
            if (!competition) {
                Util.sendResponse(res, resCode.forbidden);
                return;
            }

            const purify = DOMPurify(new JSDOM('').window);
            const cleanContent = isFileType
                ? null
                : purify.sanitize(body.content || '');

            const created = await client.materials.create({
                data: {
                    competition_id: comp_id,
                    title: body.title ?? null,
                    type,
                    content: cleanContent,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            if (isFileType && fileBuffer && fileExt) {
                const relPath = materialFilePath(created.id, fileExt);
                try {
                    await createFile(relPath, fileBuffer);
                } catch (e) {
                    // Roll back the row if the file write fails.
                    await client.materials.delete({ where: { id: created.id } });
                    Util.sendResponseJson(res, resCode.serverError, {
                        file: 'Failed to store the uploaded file',
                    });
                    return;
                }
                const updated = await client.materials.update({
                    where: { id: created.id },
                    data: { file_path: relPath, file_size: fileBuffer.length },
                });
                Util.sendResponseJson(res, resCode.created, updated);
                return;
            }

            Util.sendResponseJson(res, resCode.created, created);
        } catch (err: any) {
            Util.sendResponse(res, resCode.serverError, err);
        }
    },
);

// PUT /competitions/:comp_id/materials/:id
// Updates title and either content (rich_text) or the file (file types).
// File replacement is done by sending a multipart request with req.files.file.
// JSON requests (no file) update title / rich_text content only.
router.put(
    '/competitions/:comp_id/materials/:id',
    authenticate,
    loginRequired,
    async (req: Request, res: Response) => {
        const comp_id = parseInt(req.params.comp_id);
        const id = parseInt(req.params.id);
        const user: UserInfo = res.locals.user;
        const body = req.body || {};

        const errors: Record<string, string> = {};
        if ((body.title || '').length > 400) {
            errors.title = 'Characters more than 400 are not allowed in title';
        }

        try {
            const material = await client.materials.findUnique({
                where: { id },
                select: {
                    id: true,
                    type: true,
                    file_path: true,
                    competition: { select: { host_user_id: true } },
                },
            });
            if (
                !material ||
                material.competition.host_user_id !== user.id
            ) {
                Util.sendResponse(res, resCode.notFound);
                return;
            }

            const isFileType = material.type !== config.materialTypes.rich_text;
            let newFileBuffer: Buffer | null = null;
            let newFileExt: string | null = null;

            if (isFileType) {
                const uploaded = req.files?.file as
                    | fileUpload.UploadedFile
                    | undefined;
                if (uploaded) {
                    const limit = (config.materialFileLimits as any)[
                        material.type
                    ];
                    if (uploaded.size > limit.max) {
                        errors.file = `File size exceeds the ${Math.floor(
                            limit.max / (1024 * 1024),
                        )}MB limit for this material type`;
                    } else {
                        newFileBuffer = Buffer.from(uploaded.data);
                        const detected = await detectFileFormat(
                            newFileBuffer,
                            uploaded.name,
                        );
                        if (!detected) {
                            errors.file = 'File format could not be recognized';
                        } else if (!limit.exts.includes(detected)) {
                            errors.file = `File format ${detected} is not allowed for this material type (allowed: ${limit.exts.join(
                                ', ',
                            )})`;
                        } else {
                            newFileExt = detected;
                        }
                    }
                }
                if (body.content != null) {
                    errors.content =
                        'Content cannot be set on file-based materials';
                }
            } else {
                const content = body.content ?? '';
                if (String(content).length > 65535) {
                    errors.content =
                        'Content is too large (max 65535 characters)';
                }
                if (req.files?.file) {
                    errors.file =
                        'File upload is not allowed for rich text materials';
                }
            }

            if (Object.keys(errors).length) {
                Util.sendResponseJson(res, resCode.badRequest, errors);
                return;
            }

            const purify = DOMPurify(new JSDOM('').window);
            const data: any = {
                title: body.title ?? null,
                updated_at: new Date(),
            };
            if (!isFileType) {
                data.content = purify.sanitize(String(body.content ?? ''));
            }

            const updated = await client.materials.update({
                where: { id },
                data,
            });

            // Replace the file on disk if a new one was uploaded.
            // Write the new file first, then update the DB, then delete the
            // old file — so a write failure doesn't leave the material
            // pointing at a deleted file.
            if (isFileType && newFileBuffer && newFileExt) {
                const relPath = materialFilePath(id, newFileExt);
                try {
                    await createFile(relPath, newFileBuffer);
                } catch (e) {
                    Util.sendResponseJson(res, resCode.serverError, {
                        file: 'Failed to store the uploaded file',
                    });
                    return;
                }
                const oldPath = material.file_path;
                const updatedWithFile = await client.materials.update({
                    where: { id },
                    data: {
                        file_path: relPath,
                        file_size: newFileBuffer.length,
                    },
                });
                // Clean up the old file only after the DB is updated.
                if (oldPath) {
                    try {
                        await deleteFile(oldPath);
                    } catch {}
                }
                Util.sendResponseJson(res, resCode.success, updatedWithFile);
                return;
            }

            Util.sendResponseJson(res, resCode.success, updated);
        } catch (err: any) {
            Util.sendResponse(res, resCode.serverError, err);
        }
    },
);

// DELETE /competitions/:comp_id/materials/:id
// Soft-deletes the material and removes its file from disk.
router.delete(
    '/competitions/:comp_id/materials/:id',
    authenticate,
    loginRequired,
    async (req: Request, res: Response) => {
        const comp_id = parseInt(req.params.comp_id);
        const id = parseInt(req.params.id);
        const user: UserInfo = res.locals.user;

        try {
            const material = await client.materials.findUnique({
                where: { id },
                select: {
                    id: true,
                    file_path: true,
                    competition: { select: { host_user_id: true } },
                },
            });
            if (
                !material ||
                material.competition.host_user_id !== user.id
            ) {
                Util.sendResponse(res, resCode.notFound);
                return;
            }

            await client.materials.update({
                where: { id },
                data: { deleted_at: new Date(), file_path: null },
            });

            if (material.file_path) {
                await deleteFile(material.file_path);
            }

            Util.sendResponse(res, resCode.success);
        } catch (err: any) {
            Util.sendResponse(res, resCode.serverError, err);
        }
    },
);

module.exports = router;
