import { spawn, spawnSync } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const frontendPort = process.env.PORT || '10000';
const backendPort = process.env.BACKEND_PORT || '3001';

const migration = spawnSync(npm, ['run', 'prisma:deploy'], {
  cwd: new URL('../backend/', import.meta.url),
  env: process.env,
  stdio: 'inherit',
});

if (migration.status !== 0) {
  process.exit(migration.status ?? 1);
}

const services = [
  spawn(npm, ['run', 'start:prod'], {
    cwd: new URL('../backend/', import.meta.url),
    env: { ...process.env, PORT: backendPort },
    stdio: 'inherit',
  }),
  spawn(npm, ['run', 'start'], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, PORT: frontendPort, HOSTNAME: '0.0.0.0' },
    stdio: 'inherit',
  }),
];

let stopping = false;

function stop(signal, exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const service of services) {
    if (!service.killed) service.kill(signal);
  }
  setTimeout(() => process.exit(exitCode), 5000).unref();
}

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => stop(signal));
}

for (const service of services) {
  service.on('exit', (code, signal) => {
    if (stopping) return;
    console.error(`service exited (${signal ?? `code ${code ?? 1}`})`);
    stop('SIGTERM', code ?? 1);
  });
  service.on('error', (error) => {
    console.error(error);
    stop('SIGTERM', 1);
  });
}
