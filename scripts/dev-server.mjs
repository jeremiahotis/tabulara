import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const HOST = process.env.HOST ?? '127.0.0.1';
const PORT = Number(process.env.PORT ?? '3000');
const ROOT_DIR = process.cwd();
const STATIC_DIR = path.join(ROOT_DIR, 'web');

const REQUIRED_ENVELOPE_FIELDS = ['command_id', 'type', 'actor', 'timestamp', 'payload'];

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Request payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function validateCommandEnvelope(body) {
  const missingFields = REQUIRED_ENVELOPE_FIELDS.filter((field) => body[field] === undefined);

  if (missingFields.length === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    error: {
      code: 'CMD_ENVELOPE_VALIDATION_FAILED',
      category: 'validation',
      missing_fields: missingFields,
      details: missingFields.map((field) => ({ field, reason: 'required' })),
    },
  };
}

async function serveFile(filePath, contentType, res) {
  try {
    const content = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${HOST}:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/api/v1/health') {
    writeJson(res, 200, {
      status: 'ok',
      services: {
        frontend: 'up',
        backend: 'up',
      },
      apiVersion: 'v1',
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/v1/commands/dispatch') {
    try {
      const body = await readJsonBody(req);
      const validationResult = validateCommandEnvelope(body);

      if (!validationResult.ok) {
        writeJson(res, 400, {
          error: validationResult.error,
          mutation_applied: false,
          event_appended: false,
        });
        return;
      }

      writeJson(res, 202, {
        accepted: true,
        command_id: body.command_id,
      });
      return;
    } catch (error) {
      writeJson(res, 400, {
        error: {
          code: 'CMD_INVALID_JSON',
          category: 'validation',
          message: error instanceof Error ? error.message : 'Invalid request payload',
        },
        mutation_applied: false,
        event_appended: false,
      });
      return;
    }
  }

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    await serveFile(path.join(STATIC_DIR, 'index.html'), 'text/html; charset=utf-8', res);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/app.js') {
    await serveFile(path.join(STATIC_DIR, 'app.js'), 'text/javascript; charset=utf-8', res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, HOST, () => {
  console.log(`tabulara dev server running at http://${HOST}:${PORT}`);
});
