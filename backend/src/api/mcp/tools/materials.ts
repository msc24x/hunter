import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { HunterClient } from '../hunter-client';
import { respond } from '../respond';

// Node 18 globals not typed by @types/node@17.
declare const FormData: any;
declare const Blob: any;

// MCP requests arrive as JSON parsed by bodyParser.json(10mb), so base64
// file content is capped well under that (~5MB decoded). Larger files
// (big PDFs, audio, video) must be uploaded through the web UI.
const MAX_FILE_BASE64 = 7_000_000;

const materialType = z
    .number()
    .int()
    .min(0)
    .max(4)
    .describe(
        'Material type: 0=rich_text (HTML notes), 1=pdf, 2=image, 3=audio, 4=video',
    );

const linkingNote =
    'Materials are optional attachments for a contest (reference sheets, diagrams, example data, worked examples). ' +
    'Link them to questions with the material_ids parameter of update_question (full desired set, replace semantics; ' +
    'materials must belong to the same contest). One material can be linked to multiple questions. ' +
    'Only create materials when a question actually benefits — e.g. a graph to interpret, a data table, or a reference ' +
    'document — not for every contest. Note: import_questions does not accept material_ids; link after import via ' +
    'update_question per question.';

function fileForm(fields: Record<string, string>, args: any) {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) {
        form.append(key, value);
    }
    const buffer = Buffer.from(args.file_content_base64, 'base64');
    form.append('file', new Blob([buffer]), args.file_name || 'material-file');
    return form;
}

export function registerMaterialTools(server: McpServer, hunter: HunterClient) {
    server.registerTool(
        'list_materials',
        {
            title: 'List contest materials',
            description: `Lists materials attached to one of your contests (id, title, type, size, linked question count). ${linkingNote}`,
            inputSchema: {
                competition_id: z.number().int(),
            },
        },
        async (args) => {
            const { status, data } = await hunter.call(
                'GET',
                `/competitions/${args.competition_id}/materials`,
            );
            return respond(status, data);
        },
    );

    server.registerTool(
        'get_material',
        {
            title: 'Get material details',
            description: `Returns one material of your contest including its content/file path and the questions it is linked to. ${linkingNote}`,
            inputSchema: {
                competition_id: z.number().int(),
                material_id: z.number().int(),
            },
        },
        async (args) => {
            const { status, data } = await hunter.call(
                'GET',
                `/competitions/${args.competition_id}/materials/${args.material_id}`,
            );
            return respond(status, data);
        },
    );

    server.registerTool(
        'create_material',
        {
            title: 'Create a contest material',
            description: `Creates a material in one of your contests. For type 0 (rich_text) pass content (HTML, sanitized server-side, max 65535 chars). For file types (1=pdf, 2=image, 3=audio, 4=video) pass file_content_base64 plus an optional file_name with the real extension — the server validates the actual file format. File size is capped at ~5MB decoded; use the web UI for larger files. ${linkingNote}`,
            inputSchema: {
                competition_id: z.number().int(),
                type: materialType,
                title: z.string().max(400).optional(),
                content: z
                    .string()
                    .max(65535)
                    .optional()
                    .describe('rich_text only. HTML content.'),
                file_content_base64: z
                    .string()
                    .max(MAX_FILE_BASE64)
                    .optional()
                    .describe(
                        'File types only. Base64-encoded file content (~5MB decoded max).',
                    ),
                file_name: z
                    .string()
                    .max(200)
                    .optional()
                    .describe(
                        'File types only. Original filename incl. extension (e.g. diagram.png).',
                    ),
            },
        },
        async (args) => {
            const isRichText = args.type === 0;

            if (isRichText && args.file_content_base64) {
                return respond(400, {
                    file: 'File upload is not allowed for rich text materials',
                });
            }

            if (isRichText) {
                const { status, data } = await hunter.call(
                    'POST',
                    `/competitions/${args.competition_id}/materials`,
                    {
                        body: {
                            type: args.type,
                            title: args.title,
                            content: args.content,
                        },
                    },
                );
                return respond(status, data);
            }

            if (!args.file_content_base64) {
                return respond(400, {
                    file: 'file_content_base64 is required for file types',
                });
            }

            const form = fileForm(
                {
                    type: String(args.type),
                    ...(args.title !== undefined ? { title: args.title } : {}),
                },
                args,
            );
            const { status, data } = await hunter.call(
                'POST',
                `/competitions/${args.competition_id}/materials`,
                { form },
            );
            return respond(status, data);
        },
    );

    server.registerTool(
        'update_material',
        {
            title: 'Update a contest material',
            description: `Updates title, content (rich_text), or the file of a material in your contest. Omitted fields keep their current values. For file types pass file_content_base64 (+ optional file_name) to replace the file; ~5MB decoded max. ${linkingNote}`,
            inputSchema: {
                competition_id: z.number().int(),
                material_id: z.number().int(),
                title: z.string().max(400).optional(),
                content: z
                    .string()
                    .max(65535)
                    .optional()
                    .describe('rich_text only. HTML content.'),
                file_content_base64: z
                    .string()
                    .max(MAX_FILE_BASE64)
                    .optional()
                    .describe(
                        'File types only. Base64-encoded replacement file (~5MB decoded max).',
                    ),
                file_name: z
                    .string()
                    .max(200)
                    .optional()
                    .describe(
                        'File types only. Original filename incl. extension.',
                    ),
            },
        },
        async (args) => {
            // PUT is full-replace (omitted title -> null, omitted content -> ''),
            // so fetch the current material and merge.
            const current = await hunter.call(
                'GET',
                `/competitions/${args.competition_id}/materials/${args.material_id}`,
            );
            if (current.status !== 200 && current.status !== 202) {
                return respond(current.status, current.data);
            }
            const material = current.data;
            const isRichText = material.type === 0;

            if (isRichText && args.file_content_base64) {
                return respond(400, {
                    file: 'File upload is not allowed for rich text materials',
                });
            }

            if (!isRichText && args.content !== undefined) {
                return respond(400, {
                    content: 'Content cannot be set on file-based materials',
                });
            }

            if (!isRichText && args.file_content_base64) {
                const form = fileForm(
                    {
                        title:
                            args.title !== undefined
                                ? args.title
                                : (material.title ?? ''),
                    },
                    args,
                );
                const { status, data } = await hunter.call(
                    'PUT',
                    `/competitions/${args.competition_id}/materials/${args.material_id}`,
                    { form },
                );
                return respond(status, data);
            }

            const body: any = {
                title:
                    args.title !== undefined
                        ? args.title
                        : (material.title ?? null),
            };
            if (isRichText) {
                body.content =
                    args.content !== undefined
                        ? args.content
                        : (material.content ?? '');
            }

            const { status, data } = await hunter.call(
                'PUT',
                `/competitions/${args.competition_id}/materials/${args.material_id}`,
                { body },
            );
            return respond(status, data);
        },
    );

    server.registerTool(
        'delete_material',
        {
            title: 'Delete a contest material',
            description:
                'Deletes a material from your contest (soft delete; removes the stored file). Questions keep their text but lose the attachment link.',
            inputSchema: {
                competition_id: z.number().int(),
                material_id: z.number().int(),
            },
        },
        async (args) => {
            const { status, data } = await hunter.call(
                'DELETE',
                `/competitions/${args.competition_id}/materials/${args.material_id}`,
            );
            return respond(status, data);
        },
    );
}
