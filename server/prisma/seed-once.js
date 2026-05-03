// Idempotent seed runner used in production deploys.
// Skips silently if the database already has users, the env is missing,
// or the seed itself fails — never blocks server startup.
import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function shouldSeed() {
  try {
    const count = await prisma.user.count();
    return count === 0;
  } finally {
    await prisma.$disconnect();
  }
}

try {
  if (await shouldSeed()) {
    console.log('seed-once: empty database, running seed…');
    const result = spawnSync('node', [path.join(__dirname, 'seed.js')], {
      stdio: 'inherit',
    });
    if (result.status !== 0) {
      console.warn(`seed-once: seed exited with ${result.status} — continuing anyway.`);
    }
  } else {
    console.log('seed-once: database already populated, skipping.');
  }
} catch (e) {
  console.warn('seed-once: error during pre-flight check, skipping seed:', e?.message);
}

process.exit(0);
