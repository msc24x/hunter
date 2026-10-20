import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { TransportOptions } from 'nodemailer';

dotenv.config({
    path: `.env/.env.${process.env.ENV || 'local'}`,
});

const smtp = {
    host: process.env.SMTP_HOST!,
    port: process.env.SMTP_PORT!,
    auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
    },
} as TransportOptions;

// Ordered SMTP providers from SMTP_PROVIDERS — a JSON array of nodemailer
// transport options, index 0 = primary. Falls back to the SMTP_* vars.
const smtpProviders = ((): TransportOptions[] => {
    if (process.env.SMTP_PROVIDERS) {
        try {
            const parsed = JSON.parse(process.env.SMTP_PROVIDERS);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed as TransportOptions[];
            }
            console.warn(
                '[Config] SMTP_PROVIDERS must be a non-empty JSON array, using SMTP_* vars'
            );
        } catch (error) {
            console.warn('[Config] could not parse SMTP_PROVIDERS, using SMTP_* vars', error);
        }
    }
    return [smtp];
})();

export default {
    staff_email: process.env.STAFF_EMAIL,
    filesPath: 'files/',
    env: process.env.ENV as 'local' | 'prod',
    protocol: process.env.PROTOCOL,
    frontend: process.env.FRONTEND_DOMAIN,
    port: process.env.API_PORT,
    dbConnectionConfig: {
        db_url: process.env.DB_URL,
    },
    smtp,
    smtpProviders,
    // Attempts per provider before failover.
    smtpMaxRetries: parseInt(process.env.SMTP_MAX_RETRIES || '3') || 3,
    // Milliseconds a failed provider is skipped.
    smtpFailoverCooldownMs: parseInt(process.env.SMTP_FAILOVER_COOLDOWN_MS || '300000'),
    questionTypes: {
        code: 0,
        mcq: 1,
        fill: 2,
        long: 3,
    },
    choiceTypes: {
        selectable: 0,
        hidden: 1,
    },
    fileScopes: {
        community_banners: 'community/banners/',
        materials: 'materials/',
    },
    materialTypes: {
        rich_text: 0,
        pdf: 1,
        image: 2,
        audio: 3,
        video: 4,
    },
    // Per-type file size limits (bytes) and allowed extensions.
    // Magic-byte validation is performed in routes/materials.ts.
    materialFileLimits: {
        1: { max: 10 * 1024 * 1024, exts: ['pdf'] },
        2: { max: 5 * 1024 * 1024, exts: ['png', 'jpg', 'jpeg', 'webp', 'gif'] },
        3: { max: 50 * 1024 * 1024, exts: ['mp3', 'wav', 'ogg'] },
        4: { max: 100 * 1024 * 1024, exts: ['mp4', 'webm'] },
    },
    // Schema for the "Import / Generate Questions" feature.
    // Served via GET /competitions/questions/import/schema.
    importSchema: {
        description:
            'JSON shape for bulk-importing questions into a competition.',
        topLevel: {
            delete_existing: {
                type: 'boolean',
                required: true,
                description:
                    'If true, all current questions are deleted before the new set is created.',
            },
            default_points: {
                type: 'number',
                required: true,
                min: 0,
                max: 40,
                description:
                    'Fallback positive marking used when a question omits `points`.',
            },
            default_neg_points: {
                type: 'number',
                required: true,
                min: 0,
                max: 40,
                description:
                    'Fallback negative marking used when a question omits `neg_points`.',
            },
            questions: {
                type: 'array',
                required: true,
                maxItems: 10,
                description: 'The questions to create, in display order.',
            },
        },
        question: {
            type: {
                type: 'number',
                required: true,
                enum: [0, 1, 2, 3],
                description: 'Question type (0=code, 1=mcq, 2=fill, 3=long).',
            },
            title: {
                type: 'string',
                required: false,
                maxLength: 400,
                description: 'Question title.',
            },
            statement: {
                type: 'string',
                required: false,
                maxLength: 4000,
                description:
                    'Question statement. HTML is sanitized on save; LaTeX is supported.',
            },
            points: {
                type: 'number',
                required: false,
                min: 0,
                max: 40,
                description:
                    'Positive marking. Falls back to default_points if omitted.',
            },
            neg_points: {
                type: 'number',
                required: false,
                min: 0,
                max: 40,
                description:
                    'Negative marking. Falls back to default_neg_points if omitted.',
            },
            position: {
                type: 'number',
                required: false,
                description:
                    'Display order. Auto-assigned by array index if omitted.',
            },
            case_sensitive: {
                type: 'boolean',
                required: false,
                default: false,
                description:
                    'fill type only. Whether answers are case-sensitive.',
            },
            char_limit: {
                type: 'number',
                required: false,
                min: 0,
                description:
                    'long type only. Minimum words acceptable in a response.',
            },
            question_choices: {
                type: 'array',
                required: false,
                description: 'mcq / fill only. Choices for the question.',
                item: {
                    text: {
                        type: 'string',
                        required: true,
                        maxLength: 150,
                    },
                    is_correct: {
                        type: 'boolean',
                        required: true,
                    },
                    position: {
                        type: 'number',
                        required: false,
                        description: 'Auto-assigned by array index if omitted.',
                    },
                },
            },
            sample_cases: {
                type: 'string',
                required: false,
                maxLength: 1000,
                description:
                    'code type only. Short sample input shown to participants (stored in DB).',
            },
            sample_sols: {
                type: 'string',
                required: false,
                maxLength: 1000,
                description:
                    'code type only. Short sample output shown to participants (stored in DB).',
            },
            test_cases: {
                type: 'string',
                required: false,
                description: 'code type only. Main test cases file content.',
            },
            solutions: {
                type: 'string',
                required: false,
                description:
                    'code type only. Main expected output file content.',
            },
            solution_code: {
                type: 'string',
                required: false,
                description:
                    'code type only. Correct solution code used to verify the question after import. Requires solution_lang.',
            },
            solution_lang: {
                type: 'string',
                required: false,
                enum: ['c', 'cpp', 'py', 'js', 'ts', 'go', 'java'],
                description:
                    'code type only. Language of solution_code. Required if solution_code is present.',
            },
        },
    },
};
