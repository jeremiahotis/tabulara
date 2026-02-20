import { spawn } from 'node:child_process';

const FRONTEND_HOST = process.env.HOST ?? '127.0.0.1';
const FRONTEND_PORT = process.env.PORT ?? '4173';
const API_HOST = process.env.API_HOST ?? '127.0.0.1';
const API_PORT = process.env.API_PORT ?? '4174';

const apiProcess = spawn(
  process.execPath,
  ['scripts/local-api-server.mjs'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      API_HOST,
      API_PORT,
      FRONTEND_HEALTH_URL: `http://${FRONTEND_HOST}:${FRONTEND_PORT}/`,
    },
  },
);

const frontendProcess = spawn(
  process.execPath,
  [
    './node_modules/vite/bin/vite.js',
    '--host',
    FRONTEND_HOST,
    '--port',
    FRONTEND_PORT,
    '--strictPort',
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      API_TARGET: `http://${API_HOST}:${API_PORT}`,
    },
  },
);

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  if (!apiProcess.killed) {
    apiProcess.kill('SIGTERM');
  }
  if (!frontendProcess.killed) {
    frontendProcess.kill('SIGTERM');
  }

  setTimeout(() => process.exit(exitCode), 100);
}

apiProcess.on('exit', (code) => {
  if (shuttingDown) {
    return;
  }
  console.error(`API process exited with code ${code ?? 1}`);
  shutdown(code ?? 1);
});

frontendProcess.on('exit', (code) => {
  if (shuttingDown) {
    return;
  }
  console.error(`Frontend process exited with code ${code ?? 1}`);
  shutdown(code ?? 1);
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log(
  `tabulara dev stack started: frontend=http://${FRONTEND_HOST}:${FRONTEND_PORT} api=http://${API_HOST}:${API_PORT}`,
);
