import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const configDir = path.join(process.cwd(), 'config');
const dbPath = path.join(configDir, 'better_auth.sqlite');

// Ensure config directory exists
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

export const auth = betterAuth({
  database: new Database(dbPath),
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXTAUTH_URL,
  emailAndPassword: {
    enabled: true,
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
