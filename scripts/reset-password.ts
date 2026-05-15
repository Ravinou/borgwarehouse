/**
 * CLI script to reset the admin password directly.
 * Requires physical access to the server : this is intentional security.
 *
 * Usage:
 *   pnpm reset:password
 *
 * Docker:
 *   docker exec borgwarehouse pnpm --dir /home/borgwarehouse/app reset:password
 *
 * Prints the new password to the terminal. Log in and change it afterwards.
 */
import { hashSync } from 'bcryptjs';
import { randomInt } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { updateSqlitePassword } from '../helpers/sqlite-utils';

const configDir = path.join(process.cwd(), 'config');
const usersJsonPath = path.join(configDir, 'users.json');

const PASSWORD_CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
const PASSWORD_LENGTH = 20;

export function generatePassword(): string {
  let password = '';
  for (let i = 0; i < PASSWORD_LENGTH; i++) {
    password += PASSWORD_CHARS[randomInt(PASSWORD_CHARS.length)];
  }
  return password;
}

export function run(): void {
  let users: Array<{ id: number; username: string; roles: string[]; password: string }>;
  try {
    users = JSON.parse(readFileSync(usersJsonPath, 'utf-8'));
  } catch {
    console.error('[reset-password] Cannot read config/users.json.');
    console.error('  Make sure BorgWarehouse has been started at least once.');
    process.exit(1);
    return;
  }

  const adminIndex = users.findIndex((u) => u.roles.includes('admin'));
  if (adminIndex === -1) {
    console.error('[reset-password] No admin user found in config/users.json.');
    process.exit(1);
    return;
  }

  const admin = users[adminIndex];
  const newPassword = generatePassword();
  const newHash = hashSync(newPassword, 10);

  // Update users.json
  users[adminIndex] = { ...admin, password: newHash };
  writeFileSync(usersJsonPath, JSON.stringify(users, null, 4));

  // Update SQLite (silently no-ops if not yet initialized)
  updateSqlitePassword(admin.id.toString(), newHash);

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║          BorgWarehouse — Password Reset          ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  User     : ${admin.username.padEnd(37)}║`);
  console.log(`║  Password : ${newPassword.padEnd(37)}║`);
  console.log('║                                                  ║');
  console.log('║  Log in and change this password immediately.    ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
}

// Auto-execute only when run as a CLI script, not during tests
if (!process.env.VITEST) {
  run();
}
