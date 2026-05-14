import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import Database from 'better-sqlite3';
import { compare, hash } from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const configDir = path.join(process.cwd(), 'config');
const dbPath = path.join(configDir, 'better_auth.sqlite');

// Ensure config directory exists
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// In development, trust all localhost origins regardless of port so that
// NEXTAUTH_URL=https://localhost (legacy) doesn't break the dev server.
const devTrustedOrigins =
  process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000']
    : [];

// Additional trusted origins from env var (comma-separated), for production
// reverse-proxy / multi-domain setups:
//   BETTER_AUTH_TRUSTED_ORIGINS=https://borgwarehouse.example.com,https://bw.local
const extraTrustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
  ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',').map((o) => o.trim())
  : [];

// Session expiry in seconds. Defaults to 3600 (1 hour).
// Override with SESSION_EXPIRY_SECONDS env var, e.g. SESSION_EXPIRY_SECONDS=28800 for 8 hours.
const sessionExpiresIn = process.env.SESSION_EXPIRY_SECONDS
  ? parseInt(process.env.SESSION_EXPIRY_SECONDS, 10)
  : 3600;

export const auth = betterAuth({
  database: new Database(dbPath),
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXTAUTH_URL,
  trustedOrigins: [...devTrustedOrigins, ...extraTrustedOrigins],
  session: {
    expiresIn: sessionExpiresIn,
  },
  emailAndPassword: {
    enabled: true,
    // Use bcrypt to stay compatible with existing password hashes from users.json
    password: {
      hash: (password) => hash(password, 10),
      verify: ({ hash: storedHash, password }) => compare(password, storedHash),
    },
  },
  plugins: [
    username({
      // Support any existing username length
      minUsernameLength: 1,
      // Normalize to lowercase for consistent lookup
      usernameNormalization: (u) => u.toLowerCase(),
    }),
  ],
  user: {
    additionalFields: {
      roles: {
        type: 'string',
        required: false,
        defaultValue: '[]',
        input: true,
      },
    },
  },
});
