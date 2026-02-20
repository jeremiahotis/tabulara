import { createServer } from 'node:http';
import { createCommandDispatcher } from './command-dispatcher.mjs';
import { createLatencySmokeHarness } from './latency-smoke-harness.mjs';

const API_HOST = process.env.API_HOST ?? '127.0.0.1';
const API_PORT = Number(process.env.API_PORT ?? '4174');
const FRONTEND_HEALTH_URL = process.env.FRONTEND_HEALTH_URL ?? 'http://127.0.0.1:4173/';
const FRONTEND_HEALTH_TIMEOUT_MS = Number(process.env.FRONTEND_HEALTH_TIMEOUT_MS ?? '1000');

const dispatcher = createCommandDispatcher();
const latencySmokeHarness = createLatencySmokeHarness();

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

async function checkFrontendHealth() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FRONTEND_HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(FRONTEND_HEALTH_URL, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'text/html',
      },
    });
    return response.ok ? 'up' : 'down';
  } catch {
    return 'down';
  } finally {
    clearTimeout(timeoutId);
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${API_HOST}:${API_PORT}`);

  if (req.method === 'GET' && url.pathname === '/api/v1/health') {
    const frontendStatus = await checkFrontendHealth();
    writeJson(res, 200, {
      status: 'ok',
      services: {
        frontend: frontendStatus,
        backend: 'up',
      },
      apiVersion: 'v1',
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/v1/commands/dispatch') {
    try {
      const body = await readJsonBody(req);
      const result = dispatcher.dispatch(body);
      writeJson(res, result.statusCode, result.body);
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

  if (req.method === 'POST' && url.pathname === '/api/v1/perf/latency-smoke/run') {
    try {
      const body = await readJsonBody(req);
      const result = latencySmokeHarness.runLatencySmoke(body);
      writeJson(res, result.statusCode, result.body);
      return;
    } catch (error) {
      writeJson(res, 400, {
        error: {
          code: 'LATENCY_SCENARIO_SET_INVALID',
          reason: error instanceof Error ? error.message : 'invalid_request_payload',
        },
        mutation_applied: false,
      });
      return;
    }
  }

  if (req.method === 'GET' && /^\/api\/v1\/perf\/latency-smoke\/runs\/[^/]+\/artifact$/.test(url.pathname)) {
    const parts = url.pathname.split('/');
    const runId = parts[6];
    const artifact = latencySmokeHarness.getArtifact(runId);
    if (!artifact) {
      writeJson(res, 404, {
        error: {
          code: 'LATENCY_ARTIFACT_NOT_FOUND',
          run_id: runId,
        },
      });
      return;
    }

    writeJson(res, 200, artifact);
    return;
  }

  writeJson(res, 404, { error: 'Not found' });
});

server.listen(API_PORT, API_HOST, () => {
  console.log(`tabulara local API running at http://${API_HOST}:${API_PORT}`);
});
