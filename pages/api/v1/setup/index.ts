import { hash } from 'bcryptjs';
import { writeFileSync } from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { isFirstRun, setupLockFile } from '~/helpers/isFirstRun';
import { ensureSchemaReady } from '~/lib/auth-migrate';
import { ConfigService } from '~/services';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'config', 'better_auth.sqlite');

/**
 * GET  /api/v1/setup — returns whether first-run setup is required.
 * POST /api/v1/setup — creates the first admin account.
 *
 * If SETUP_SECRET is set in the environment, the POST body must include a
 * matching `secret` field — acts as an extra guard on exposed instances.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(res);
  }
  if (req.method === 'POST') {
    return handlePost(req, res);
  }
  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleGet(res: NextApiResponse) {
  return res.status(200).json({
    setupRequired: await isFirstRun(),
    requiresSecret: !!process.env.SETUP_SECRET,
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Triple-check: lock file + users.json + SQLite
    if (!(await isFirstRun())) {
      return res.status(403).json({ message: 'Setup already completed.' });
    }

    // Optional setup secret
    const envSecret = process.env.SETUP_SECRET;
    if (envSecret) {
      const { secret } = req.body as { secret?: string };
      if (!secret || secret !== envSecret) {
        return res.status(403).json({ message: 'Invalid setup secret.' });
      }
    }

    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || typeof username !== 'string' || !/^[a-z]{1,40}$/.test(username)) {
      return res.status(400).json({ message: 'Invalid username. Only a-z characters, 1–40 chars.' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    // Ensure the better-auth schema exists (tables may not exist on fresh install)
    await ensureSchemaReady();

    const passwordHash = await hash(password, 10);
    const now = new Date().toISOString();
    const userId = '0';

    // 1. Write to users.json
    await ConfigService.updateUsersList([
      {
        id: 0,
        username,
        password: passwordHash,
        email: '',
        roles: ['admin'],
      },
    ]);

    // 2. Insert directly into SQLite
    const db = new Database(dbPath);
    try {
      db.prepare(`
        INSERT INTO "user" (id, name, email, emailVerified, username, displayUsername, roles, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, username, `${username}@borgwarehouse.local`, 0, username.toLowerCase(), username, JSON.stringify(['admin']), now, now);

      db.prepare(`
        INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(`${userId}-credential`, username.toLowerCase(), 'credential', userId, passwordHash, now, now);
    } finally {
      db.close();
    }

    // 3. Write lock file — permanently seals the setup endpoint
    writeFileSync(setupLockFile, new Date().toISOString());

    return res.status(201).json({ message: 'Admin account created.' });
  } catch (error) {
    console.error('[setup] Error creating admin:', error);
    return res.status(500).json({ message: 'Failed to create admin account.' });
  }
}
