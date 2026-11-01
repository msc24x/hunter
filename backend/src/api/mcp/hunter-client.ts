import { Request } from 'express';
import config from '../../config/config';
import { UserInfo } from '../../config/types';

// Node 18 globals not typed by @types/node@17.
declare const fetch: any;
declare const FormData: any;
declare const Blob: any;
declare const AbortController: any;

const DEFAULT_TIMEOUT_MS = 15000;
const JUDGE_TIMEOUT_MS = 120000;

export type CallOptions = {
    query?: Record<string, any>;
    body?: any;
    form?: typeof FormData;
    headers?: Record<string, string>;
    timeoutMs?: number;
};

export type HunterClient = {
    call: (
        method: string,
        path: string,
        options?: CallOptions,
    ) => Promise<{ status: number; data: any }>;
    user: UserInfo;
};

// Loopback client: MCP tools call our own REST API so permission and
// business rules stay identical to the HTTP endpoints. The caller's
// credentials (Bearer token or session cookie) are forwarded as-is.
export function createHunterClient(
    req: Request,
    user: UserInfo,
): HunterClient {
    const baseUrl = `http://127.0.0.1:${config.port}/api`;

    const authHeaders: Record<string, string> = {};
    if (req.headers.authorization) {
        authHeaders['authorization'] = req.headers.authorization;
    } else if (req.headers.cookie) {
        authHeaders['cookie'] = req.headers.cookie;
    }

    async function call(method: string, path: string, options: CallOptions = {}) {
        const url = new URL(baseUrl + path);

        for (const [key, value] of Object.entries(options.query ?? {})) {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.set(key, String(value));
            }
        }

        const headers: Record<string, string> = {
            ...authHeaders,
            ...(options.headers ?? {}),
        };

        let body: any;
        if (options.form) {
            body = options.form;
        } else if (options.body !== undefined) {
            headers['content-type'] = 'application/json';
            body = JSON.stringify(options.body);
        }

        const controller = new AbortController();
        const timer = setTimeout(
            () => controller.abort(),
            options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        );

        try {
            const res = await fetch(url, {
                method,
                headers,
                body,
                signal: controller.signal,
            });
            const text = await res.text();
            let data: any = null;
            try {
                data = text ? JSON.parse(text) : null;
            } catch {
                data = text;
            }
            return { status: res.status, data };
        } finally {
            clearTimeout(timer);
        }
    }

    return { call, user };
}

export { JUDGE_TIMEOUT_MS };
