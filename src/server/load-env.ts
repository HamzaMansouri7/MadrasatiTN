import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

/**
 * Local dev: fill missing variables from the repo .env so the AI keys reach the server.
 * Variables already set (PM2 env on the VPS) always win. Must be the first import of server.ts,
 * because the AI clients read their keys when their module loads.
 */
if (existsSync('.env')) {
  const vars = parseEnv(readFileSync('.env', 'utf8'));
  for (const [k, v] of Object.entries(vars)) {
    if (process.env[k] === undefined) process.env[k] = v;
  }
}
