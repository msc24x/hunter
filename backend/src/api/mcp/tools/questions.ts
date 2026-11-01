import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { HunterClient, JUDGE_TIMEOUT_MS } from '../hunter-client';
import { respond } from '../respond';

// Node 18 globals not typed by @types/node@17.
declare const FormData: any;
declare const Blob: any;

const questionTypes = z
    .number()
    .int()
    .min(0)
    .max(3)
    .describe('Question type: 0=code, 1=mcq, 2=fill, 3=long');

const questionChoice = z.object({
    id: z
        .number()
        .int()
        .optional()
        .describe('Existing choice id. Omit or use negative for new choices.'),
    text: z.string().max(150).describe('Choice text'),
    is_correct: z
        .boolean()
        .optional()
        .describe('Whether this choice is a correct answer'),
    position: z.number().int().optional(),
    delete: z
        .boolean()
        .optional()
        .describe('Set true to delete an existing choice'),
});

export function registerQuestionTools(
    server: McpServer,
    hunter: HunterClient,
) {
    server.registerTool(
        'get_questions',
        {
            title: 'Get contest questions',
            description:
                'Lists questions of one of your contests, with full host view (statements, choices with correct answers, attached materials). Pass question_id for a single question.',
            inputSchema: {
                competition_id: z.number().int(),
                question_id: z.number().int().optional(),
            },
        },
        async (args) => {
            const { status, data } = await hunter.call(
                'GET',
                `/competitions/${args.competition_id}/questions${
                    args.question_id ? '/' + args.question_id : ''
                }`,
                {
                    // The route serves the full host view only when the
                    // referer contains '/editor/'.
                    headers: { referer: '/editor/' },
                },
            );
            return respond(status, data);
        },
    );

    server.registerTool(
        'get_question_import_schema',
        {
            title: 'Get question import format',
            description:
                'Returns the JSON schema expected by import_questions: per-type fields, limits, and required keys. Call this before composing bulk imports.',
            inputSchema: {},
        },
        async () => {
            const { status, data } = await hunter.call(
                'GET',
                '/competitions/questions/import/schema',
            );
            return respond(status, data);
        },
    );

    server.registerTool(
        'create_question',
        {
            title: 'Create a question',
            description:
                'Creates an empty question of the given type in one of your contests, then fill it in with update_question. For creating many questions at once prefer import_questions.',
            inputSchema: {
                competition_id: z.number().int(),
                type: questionTypes,
            },
        },
        async (args) => {
            const { status, data } = await hunter.call(
                'POST',
                `/competitions/${args.competition_id}/questions`,
                { body: { type: args.type } },
            );
            return respond(status, data);
        },
    );

    server.registerTool(
        'update_question',
        {
            title: 'Update a question',
            description:
                'Updates fields of one of your questions. For mcq/fill questions, question_choices syncs the full choice set: entries without id (or negative id) are created, existing ids are updated, delete:true removes.',
            inputSchema: {
                competition_id: z.number().int(),
                question_id: z.number().int(),
                type: questionTypes.describe(
                    'Question type (required for choice sync): 0=code, 1=mcq, 2=fill, 3=long',
                ),
                title: z.string().max(400).optional(),
                statement: z
                    .string()
                    .max(4000)
                    .optional()
                    .describe('Question statement. HTML is sanitized on save.'),
                points: z.number().min(0).max(40).optional(),
                neg_points: z.number().min(0).max(40).optional(),
                case_sensitive: z
                    .boolean()
                    .optional()
                    .describe('fill type only'),
                char_limit: z
                    .number()
                    .int()
                    .min(0)
                    .nullable()
                    .optional()
                    .describe('long type only. Minimum words expected.'),
                sample_cases: z
                    .string()
                    .max(1000)
                    .optional()
                    .describe('code type only. Sample input shown to users.'),
                sample_sols: z
                    .string()
                    .max(1000)
                    .optional()
                    .describe('code type only. Sample output shown to users.'),
                question_choices: z
                    .array(questionChoice)
                    .optional()
                    .describe('mcq/fill only. Desired full set of choices.'),
                material_ids: z
                    .array(z.number().int())
                    .optional()
                    .describe(
                        'Desired full set of linked material ids (must belong to this contest). Omit to leave links unchanged.',
                    ),
            },
        },
        async (args) => {
            const { competition_id, question_id, ...fields } = args;
            const { status, data } = await hunter.call(
                'PUT',
                `/competitions/${competition_id}/questions/${question_id}`,
                // The route reads `params.id` from the body for choice
                // create/delete, so the question id must be sent in both
                // the URL and the body.
                { body: { id: question_id, ...fields } },
            );
            return respond(status, data);
        },
    );

    server.registerTool(
        'delete_question',
        {
            title: 'Delete a question',
            description:
                'Soft-deletes a question from one of your contests. Results from participants are kept.',
            inputSchema: {
                competition_id: z.number().int(),
                question_id: z.number().int(),
            },
        },
        async (args) => {
            const { status, data } = await hunter.call(
                'DELETE',
                `/competitions/${args.competition_id}/questions/${args.question_id}`,
            );
            return respond(status, data);
        },
    );

    server.registerTool(
        'import_questions',
        {
            title: 'Bulk import questions',
            description:
                'Creates up to 10 questions in one call inside one of your contests. Use get_question_import_schema first for the exact JSON shape. Coding questions can include test_cases, solutions, and solution_code/solution_lang which are verified automatically after import. IMPORTANT for coding questions: test_cases and solutions are the REAL judging files, not samples. Generate a large set of varied cases covering edge cases and boundary values (empty/min/max inputs, limits, tricky combinations), and make solutions the exact correct output for every test case in the same order.',
            inputSchema: {
                competition_id: z.number().int(),
                questions: z
                    .array(z.record(z.any()))
                    .min(1)
                    .max(10)
                    .describe(
                        'Question objects per the import schema (type, title, statement, question_choices, test_cases, solutions, etc.)',
                    ),
                delete_existing: z
                    .boolean()
                    .optional()
                    .describe(
                        'Delete all current questions before importing (default false)',
                    ),
                default_points: z
                    .number()
                    .min(0)
                    .max(40)
                    .optional()
                    .describe('Fallback points when a question omits points'),
                default_neg_points: z
                    .number()
                    .min(0)
                    .max(40)
                    .optional()
                    .describe(
                        'Fallback negative points when a question omits neg_points',
                    ),
            },
        },
        async (args) => {
            const { competition_id, ...body } = args;
            const { status, data } = await hunter.call(
                'POST',
                `/competitions/${competition_id}/questions/import`,
                { body, timeoutMs: JUDGE_TIMEOUT_MS },
            );
            return respond(status, data);
        },
    );

    server.registerTool(
        'upload_question_file',
        {
            title: 'Upload question test files',
            description:
                'Uploads the test cases or expected solutions file for a coding question in one of your contests (max 1.5MB). These are the REAL judging files, not samples: for testcases generate a large set of varied cases covering edge cases and boundary values (empty/min/max inputs, limits, tricky combinations); for solutions provide the exact expected output for every test case in the same order. Uploading invalidates previous verification, so run verify_question afterward.',
            inputSchema: {
                competition_id: z.number().int(),
                question_id: z.number().int(),
                file_type: z
                    .enum(['testcases', 'solutions'])
                    .describe(
                        'testcases = judge input, solutions = expected output',
                    ),
                content: z
                    .string()
                    .max(1_500_000)
                    .describe('Full text content of the file'),
            },
        },
        async (args) => {
            const form = new FormData();
            form.append(
                'file',
                new Blob([args.content], { type: 'text/plain' }),
                `${args.file_type}.txt`,
            );

            const { status, data } = await hunter.call(
                'POST',
                `/competitions/${args.competition_id}/questions/${args.question_id}/${args.file_type}`,
                { form },
            );
            return respond(status, data);
        },
    );

    server.registerTool(
        'verify_question',
        {
            title: 'Verify a coding question',
            description:
                'Runs a correct solution through the judge against the uploaded test cases and records the verification, proving the question is solvable. Required before a coding question can go live. Needs testcases and solutions files uploaded first. The solution must produce the exact expected output for EVERY test case in the file (multi-line input means multi-line output), so write it to handle all cases, not only the samples.',
            inputSchema: {
                competition_id: z.number().int(),
                question_id: z.number().int(),
                code: z
                    .string()
                    .describe('Correct solution source code to execute'),
                lang: z
                    .enum(['c', 'cpp', 'py', 'js', 'ts', 'go', 'java'])
                    .describe('Solution language'),
            },
        },
        async (args) => {
            const { status, data } = await hunter.call(
                'POST',
                `/competitions/${args.competition_id}/questions/${args.question_id}/verification`,
                {
                    body: {
                        solution: { code: args.code, lang: args.lang },
                    },
                    timeoutMs: JUDGE_TIMEOUT_MS,
                },
            );
            return respond(status, data);
        },
    );
}
