import express, { Request, Response } from 'express';
import Container from 'typedi';
import fs from 'fs';
import path from 'path';
import { DatabaseProvider } from '../services/databaseProvider';
import { computeContestQuality } from '../services/contestQuality';
import config from '../config/config';

const router = express.Router();
const client = Container.get(DatabaseProvider).client();

const CACHE_TTL_MS = 5 * 60 * 60 * 1000;
const HTTP_MAX_AGE = 1800;
const LLMS_MAX_CONTESTS = 100;
const LLMS_MAX_COMMUNITIES = 50;
const MIN_TITLE_LENGTH = 10;
const MIN_DESCRIPTION_LENGTH = 64;

interface CatalogData {
    competitions: {
        id: number;
        title: string | null;
        description: string | null;
        created_at: Date;
        updated_at: Date;
        questions: any[];
    }[];
    communities: {
        id: number;
        name: string | null;
        description: string | null;
        created_at: Date;
    }[];
    docsPages: { path: string; title?: string }[];
}

interface CacheEntry {
    body: string;
    contentType: string;
    expiresAt: number;
}

let catalogCache: { data: CatalogData; expiresAt: number } | null = null;
const pageCache = new Map<string, CacheEntry>();

const siteBase = () => `${config.protocol}://${config.frontend}`;

function loadDocsPages(): { path: string; title?: string }[] {
    const candidates = [
        path.join(__dirname, '../../../src/assets/docs-pages.json'),
        path.join(__dirname, '../../static/assets/docs-pages.json'),
    ];
    for (const candidate of candidates) {
        try {
            if (fs.existsSync(candidate)) {
                const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8'));
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Failed to load docs-pages.json:', e);
        }
    }
    return [];
}

async function getCatalog(forceRefresh: boolean): Promise<CatalogData> {
    if (!forceRefresh && catalogCache && catalogCache.expiresAt > Date.now()) {
        return catalogCache.data;
    }

    const [rawCompetitions, communities] = await Promise.all([
        client.competitions.findMany({
            where: {
                visibility: 'PUBLIC',
                deleted_at: null,
                OR: [
                    { community_only: false },
                    {
                        community_only: true,
                        community: { status: 'APPROVED' },
                    },
                ],
            },
            select: {
                id: true,
                title: true,
                description: true,
                created_at: true,
                updated_at: true,
                questions: {
                    where: { deleted_at: null },
                    include: {
                        question_verifications: { where: { success: true } },
                        question_choices: true,
                    },
                },
            },
            orderBy: { updated_at: 'desc' },
        }),
        client.community.findMany({
            where: { status: 'APPROVED' },
            select: {
                id: true,
                name: true,
                description: true,
                created_at: true,
            },
            orderBy: { created_at: 'desc' },
        }),
    ]);

    const competitions = rawCompetitions.filter(
        (c) =>
            (c.title?.length ?? 0) >= MIN_TITLE_LENGTH &&
            (c.description?.length ?? 0) >= MIN_DESCRIPTION_LENGTH &&
            computeContestQuality(c).acceptable
    );

    const data: CatalogData = {
        competitions,
        communities,
        docsPages: loadDocsPages(),
    };
    catalogCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return data;
}

function xmlEscape(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function lastmod(d: Date | null | undefined): string {
    return d ? `<lastmod>${d.toISOString().slice(0, 10)}</lastmod>` : '';
}

function renderSitemap(c: CatalogData): string {
    const base = siteBase();
    const urls: {
        loc: string;
        lastmod?: Date | null;
        changefreq: string;
        priority: string;
    }[] = [
        { loc: '/', changefreq: 'weekly', priority: '1.0' },
        { loc: '/home', changefreq: 'weekly', priority: '0.8' },
        { loc: '/compete', changefreq: 'weekly', priority: '0.9' },
        { loc: '/communities/browse', changefreq: 'weekly', priority: '0.8' },
        { loc: '/about', changefreq: 'monthly', priority: '0.6' },
    ];

    for (const page of c.docsPages) {
        urls.push({
            loc: page.path,
            changefreq: 'monthly',
            priority: '0.7',
        });
    }
    for (const comp of c.competitions) {
        urls.push({
            loc: `/compete/p/${comp.id}`,
            lastmod: comp.updated_at ?? comp.created_at,
            changefreq: 'weekly',
            priority: '0.6',
        });
    }
    for (const community of c.communities) {
        urls.push({
            loc: `/communities/browse/${community.id}`,
            lastmod: community.created_at,
            changefreq: 'monthly',
            priority: '0.5',
        });
    }

    const body = urls
        .map((u) => {
            const mod = lastmod(u.lastmod);
            return `  <url>\n    <loc>${xmlEscape(base + u.loc)}</loc>\n${mod ? `    ${mod}\n` : ''}    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`;
        })
        .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function mdSafe(s: string | null | undefined, maxLen = 200): string {
    if (!s) return '';
    const text = s
        .replace(/<[^>]*>/g, ' ')
        .replace(/[[\]()`]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return text.length > maxLen
        ? text.slice(0, maxLen - 1).trimEnd() + '…'
        : text;
}

function llmsLink(
    title: string | null | undefined,
    url: string,
    desc?: string | null
): string {
    const label = mdSafe(title, 120) || url;
    const detail = desc ? `: ${mdSafe(desc)}` : '';
    return `- [${label}](${url})${detail}`;
}

function renderLlms(c: CatalogData): string {
    const base = siteBase();
    const lines: string[] = [
        '# Hunter',
        '',
        '> Hunter is an open-source contest hosting platform for coding competitions, programming challenges, MCQ quizzes, coding assessments, and long-answer evaluations. It works as an online judge: contestants solve problems on the platform and Showdown judges code submissions. Hosts can create, manage, schedule, and publish contests end to end — including from AI assistants and coding agents via the built-in MCP server.',
        '',
        '## Platform',
        `- [Hunter](${base}/): homepage and public competition feed`,
        `- [About Hunter](${base}/about): what Hunter is and how it works`,
        `- [Public Competitions](${base}/compete): browse live, upcoming, and ended coding contests and programming challenges`,
        `- [Communities](${base}/communities/browse): browse community hubs, tech clubs, and their contests`,
        '',
    ];

    if (c.docsPages.length) {
        lines.push('## Docs');
        for (const page of c.docsPages) {
            const [label, ...rest] = (page.title || page.path)
                .split(' - ')
                .map((s) => s.trim());
            const detail = rest.length ? `: ${mdSafe(rest.join(' - '))}` : '';
            lines.push(`- [${mdSafe(label, 120)}](${base}${page.path})${detail}`);
        }
        lines.push('');
    }

    if (c.competitions.length) {
        lines.push('## Public Contests');
        for (const comp of c.competitions.slice(0, LLMS_MAX_CONTESTS)) {
            lines.push(
                llmsLink(
                    comp.title,
                    `${base}/compete/p/${comp.id}`,
                    comp.description
                )
            );
        }
        lines.push('');
    }

    if (c.communities.length) {
        lines.push('## Communities');
        for (const community of c.communities.slice(
            0,
            LLMS_MAX_COMMUNITIES
        )) {
            lines.push(
                llmsLink(
                    community.name,
                    `${base}/communities/browse/${community.id}`,
                    community.description
                )
            );
        }
        lines.push('');
    }

    lines.push(
        '## Developers',
        `- Hunter MCP server: Streamable HTTP endpoint at ${base}/api/mcp. Hosts authenticate with API tokens — shown once at creation, stored as SHA-256 hashes. Tools manage contests and questions end to end; client setup is documented at ${base}/docs/mcp.`,
        ''
    );

    return lines.join('\n');
}

async function serve(
    req: Request,
    res: Response,
    key: string,
    contentType: string,
    render: (c: CatalogData) => string
) {
    const forceRefresh = req.query.nocache === 'true';
    const cached = pageCache.get(key);

    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
        sendEntry(res, cached, false);
        return;
    }

    try {
        const catalog = await getCatalog(forceRefresh);
        const entry: CacheEntry = {
            body: render(catalog),
            contentType,
            expiresAt: Date.now() + CACHE_TTL_MS,
        };
        pageCache.set(key, entry);
        sendEntry(res, entry, forceRefresh);
    } catch (e) {
        console.error(`Failed to render ${key}:`, e);
        if (cached) {
            sendEntry(res, cached, false);
        } else {
            res.status(500)
                .type('text/plain')
                .send('Failed to generate ' + key);
        }
    }
}

function sendEntry(res: Response, entry: CacheEntry, noStore: boolean) {
    res.set('Content-Type', entry.contentType)
        .set(
            'Cache-Control',
            noStore ? 'no-store' : `public, max-age=${HTTP_MAX_AGE}`
        )
        .send(entry.body);
}

router.get('/sitemap.xml', (req, res) => {
    serve(req, res, 'sitemap', 'application/xml; charset=utf-8', renderSitemap);
});

router.get('/llms.txt', (req, res) => {
    serve(req, res, 'llms', 'text/plain; charset=utf-8', renderLlms);
});

module.exports = router;
