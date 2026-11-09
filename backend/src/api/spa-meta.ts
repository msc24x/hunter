import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import Container from 'typedi';
import { Cache } from 'memory-cache';
import { DatabaseProvider } from '../services/databaseProvider';
import config from '../config/config';

const INDEX_HTML = path.join(__dirname, '../../static/index.html');
const META_CACHE_TTL = 10 * 60 * 1000;

const GENERIC_TITLE = 'Hunter - Open Source Contest Platform';
const GENERIC_DESCRIPTION =
    'Create and manage custom contests easily with Hunter - Open Source platform built for simplicity, speed, and control';

const client = Container.get(DatabaseProvider).client();
const mcache = new Cache();

interface PageMeta {
    title: string;
    description: string;
    canonicalPath?: string;
    noindex?: boolean;
}

let template: string | null = null;

function getTemplate(): string | null {
    if (template) {
        return template;
    }
    try {
        template = fs.readFileSync(INDEX_HTML, 'utf8');
    } catch (e) {
        console.error('spa-meta: cannot read index.html:', e);
        return null;
    }
    return template;
}

function siteBase(): string {
    return `${config.protocol}://${config.frontend}`;
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function cleanText(s: string | null | undefined, maxLen = 160): string {
    if (!s) {
        return '';
    }
    const text = s
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    return text.length > maxLen
        ? text.slice(0, maxLen - 1).trimEnd() + '…'
        : text;
}

const STATIC_PAGES: Record<string, PageMeta> = {
    '/': {
        title: GENERIC_TITLE,
        description: GENERIC_DESCRIPTION,
        canonicalPath: '/',
    },
    '/home': {
        title: GENERIC_TITLE,
        description: GENERIC_DESCRIPTION,
        canonicalPath: '/',
    },
    '/compete': {
        title: 'Public Competitions - Hunter',
        description:
            'Browse public coding contests, programming challenges, quizzes, and long-answer evaluations on Hunter.',
        canonicalPath: '/compete',
    },
    '/about': {
        title: 'Hunter - Open Source platform built for simplicity, speed, and control',
        description: GENERIC_DESCRIPTION,
        canonicalPath: '/about',
    },
    '/docs/mcp': {
        title: 'Hunter MCP Server - AI assistants for contest hosting',
        description:
            'Connect AI assistants and coding agents to Hunter over the Model Context Protocol. Manage contests and questions end to end with API tokens.',
        canonicalPath: '/docs/mcp',
    },
    '/communities/browse': {
        title: 'Communities - Hunter',
        description:
            'Browse Hunter communities, tech clubs, and their public contests.',
        canonicalPath: '/communities/browse',
    },
};

const NOINDEX: PageMeta = {
    title: GENERIC_TITLE,
    description: GENERIC_DESCRIPTION,
    noindex: true,
};

async function getCompetitionMeta(id: number): Promise<PageMeta | null> {
    const key = `spa-meta:comp:${id}`;
    const cached = mcache.get(key);
    if (cached !== null) {
        return (cached as { meta: PageMeta | null }).meta;
    }

    try {
        const c = await client.competitions.findUnique({
            where: { id },
            select: {
                title: true,
                description: true,
                visibility: true,
                deleted_at: true,
                practice: true,
                community_only: true,
                community: { select: { status: true } },
            },
        });

        const indexable =
            !!c &&
            !c.deleted_at &&
            !c.practice &&
            c.visibility === 'PUBLIC' &&
            (!c.community_only || c.community?.status === 'APPROVED');

        const meta: PageMeta | null = indexable
            ? {
                  title: `${c!.title?.trim() || 'Competition'} - Hunter`,
                  description:
                      cleanText(c!.description) || GENERIC_DESCRIPTION,
                  canonicalPath: `/compete/p/${id}`,
              }
            : null;

        mcache.put(key, { meta }, META_CACHE_TTL);
        return meta;
    } catch (e) {
        console.error(`spa-meta: competition ${id} lookup failed:`, e);
        return null;
    }
}

async function getCommunityMeta(id: number): Promise<PageMeta | null> {
    const key = `spa-meta:comm:${id}`;
    const cached = mcache.get(key);
    if (cached !== null) {
        return (cached as { meta: PageMeta | null }).meta;
    }

    try {
        const c = await client.community.findUnique({
            where: { id },
            select: { name: true, description: true, status: true },
        });

        const meta: PageMeta | null =
            c && c.status === 'APPROVED'
                ? {
                      title: `${c.name?.trim() || 'Community'} - Hunter Community`,
                      description:
                          cleanText(c.description) ||
                          'Hunter community page with public contests and members.',
                      canonicalPath: `/communities/browse/${id}`,
                  }
                : null;

        mcache.put(key, { meta }, META_CACHE_TTL);
        return meta;
    } catch (e) {
        console.error(`spa-meta: community ${id} lookup failed:`, e);
        return null;
    }
}

function requestPath(req: Request): string {
    const raw = req.originalUrl.split('?')[0];
    return raw.replace(/\/+$/, '') || '/';
}

async function resolveMeta(req: Request): Promise<PageMeta> {
    const p = requestPath(req);

    const staticMeta = STATIC_PAGES[p];
    if (staticMeta) {
        return staticMeta;
    }

    let m = p.match(/^\/u\/(\d+)$/);
    if (m) {
        const user = await client.users
            .findUnique({ where: { id: parseInt(m[1]) }, select: { name: true } })
            .catch((e) => {
                console.error(`spa-meta: user ${m![1]} lookup failed:`, e);
                return null;
            });
        const name = user?.name?.trim();
        return {
            title: `${name || 'User'} - Hunter`,
            description: name
                ? `Public profile of ${name} on Hunter.`
                : GENERIC_DESCRIPTION,
            canonicalPath: `/u/${m[1]}`,
        };
    }

    m = p.match(/^\/communities\/browse\/(\d+)$/);
    if (m) {
        return (await getCommunityMeta(parseInt(m[1]))) || NOINDEX;
    }

    m = p.match(/^\/compete\/p\/(\d+)(\/\d+)?$/);
    if (m) {
        const meta = await getCompetitionMeta(parseInt(m[1]));
        if (!meta) {
            return NOINDEX;
        }
        return { ...meta, canonicalPath: `/compete/p/${m[1]}` };
    }

    return NOINDEX;
}

function injectMeta(html: string, meta: PageMeta, reqPath: string): string {
    let out = html;

    out = out.replace(/<link[^>]*rel="canonical"[^>]*>/gi, '');
    out = out.replace(
        /<meta[^>]*property="og:(title|description|url)"[^>]*>/gi,
        ''
    );

    out = out.replace(
        /<title>[^<]*<\/title>/i,
        `<title>${escapeHtml(meta.title)}</title>`
    );

    const descTag = `<meta name="description" content="${escapeHtml(
        meta.description
    )}">`;
    if (/<meta[^>]*name="description"[^>]*>/i.test(out)) {
        out = out.replace(
            /<meta[^>]*name="description"[^>]*>/i,
            descTag
        );
    } else {
        out = out.replace('</head>', `        ${descTag}\n    </head>`);
    }

    const robots = meta.noindex ? 'noindex, nofollow' : 'index, follow';
    const robotsTag = `<meta name="robots" content="${robots}">`;
    const hasRobots = /<meta[^>]*name="robots"[^>]*>/i.test(out);
    if (hasRobots) {
        out = out.replace(
            /<meta[^>]*name="robots"[^>]*>/i,
            robotsTag
        );
    }

    const base = siteBase();
    const ogUrl = meta.canonicalPath
        ? `${base}${meta.canonicalPath}`
        : `${base}${reqPath}`;
    const tags = [
        hasRobots ? '' : robotsTag,
        meta.canonicalPath
            ? `<link rel="canonical" href="${escapeHtml(
                  `${base}${meta.canonicalPath}`
              )}">`
            : '',
        `<meta property="og:title" content="${escapeHtml(meta.title)}">`,
        `<meta property="og:description" content="${escapeHtml(
            meta.description
        )}">`,
        `<meta property="og:url" content="${escapeHtml(ogUrl)}">`,
    ]
        .filter(Boolean)
        .join('\n        ');

    out = out.replace('</head>', `        ${tags}\n    </head>`);
    return out;
}

export function spaFallback(req: Request, res: Response) {
    const html = getTemplate();
    if (!html) {
        res.sendFile(INDEX_HTML);
        return;
    }

    resolveMeta(req)
        .then((meta) => {
            res
                .type('html')
                .send(injectMeta(html, meta, requestPath(req)));
        })
        .catch((e) => {
            console.error('spa-meta: resolve failed, serving plain index:', e);
            res.type('html').send(html);
        });
}
