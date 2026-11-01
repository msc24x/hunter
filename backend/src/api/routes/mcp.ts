import express, { Request, Response } from 'express';
import { authenticate, loginRequired } from '../auth';
import { Util } from '../../util/util';
import { resCode } from '../../config/settings';
import { UserInfo } from '../../config/types';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { buildMcpServer } from '../mcp/server';
import { createHunterClient } from '../mcp/hunter-client';

var router = express.Router();

// MCP endpoint (Streamable HTTP, stateless). A fresh server+transport is
// built per request and bound to the authenticated user; tool calls reach
// our own REST API with the same credentials, so permissions are identical.
router.post('/mcp', authenticate, loginRequired, async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });
    const server = buildMcpServer(
        createHunterClient(req, res.locals.user as UserInfo),
    );

    res.on('close', () => {
        transport.close();
        server.close();
    });

    try {
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    } catch (err) {
        console.error('MCP request failed:', err);
        if (!res.headersSent) {
            Util.sendResponse(res, resCode.serverError);
        }
    }
});

// Stateless transport only supports POST. Explicit 405 keeps GET/DELETE
// from falling through to the SPA index.html.
router.all('/mcp', authenticate, loginRequired, (req: Request, res: Response) => {
    res.status(405).json({
        jsonrpc: '2.0',
        error: {
            code: -32000,
            message: 'Method not allowed. This MCP server accepts POST only.',
        },
        id: null,
    });
});

module.exports = router;
