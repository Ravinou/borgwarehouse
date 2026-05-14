import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import { genericOAuth } from 'better-auth/plugins/generic-oauth';
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

// --- Social providers (conditional on env vars) ---
type SocialProvidersConfig = Record<
  string,
  { clientId: string; clientSecret: string; tenantId?: string }
>;
const socialProviders: SocialProvidersConfig = {};

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  socialProviders.microsoft = {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    tenantId: process.env.MICROSOFT_TENANT_ID,
  };
}

if (process.env.GITLAB_CLIENT_ID && process.env.GITLAB_CLIENT_SECRET) {
  socialProviders.gitlab = {
    clientId: process.env.GITLAB_CLIENT_ID,
    clientSecret: process.env.GITLAB_CLIENT_SECRET,
  };
}

// --- Generic OIDC provider (e.g. Authentik, Keycloak, Zitadel) ---
// Requires: OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_ISSUER_URL
// Optional: OIDC_PROVIDER_NAME (display name, defaults to "SSO")
const oidcConfig =
  process.env.OIDC_CLIENT_ID && process.env.OIDC_CLIENT_SECRET && process.env.OIDC_ISSUER_URL
    ? [
        {
          providerId: 'oidc',
          discoveryUrl: `${process.env.OIDC_ISSUER_URL.replace(/\/$/, '')}/.well-known/openid-configuration`,
          clientId: process.env.OIDC_CLIENT_ID,
          clientSecret: process.env.OIDC_CLIENT_SECRET,
          scopes: ['openid', 'email', 'profile'],
          pkce: true,
          disableSignUp: true,
        },
      ]
    : [];

// Build plugins array
const plugins = [
  username({
    minUsernameLength: 1,
    usernameNormalization: (u: string) => u.toLowerCase(),
  }),
  ...(oidcConfig.length > 0 ? [genericOAuth({ config: oidcConfig })] : []),
];

// Disable password login when DISABLE_PASSWORD_LOGIN=true (OAuth-only mode)
// Safety: if no OAuth provider is configured, keep password login enabled regardless
const hasOAuthProviders = Object.keys(socialProviders).length > 0 || oidcConfig.length > 0;
const passwordLoginEnabled = !(process.env.DISABLE_PASSWORD_LOGIN === 'true' && hasOAuthProviders);

export const auth = betterAuth({
  database: new Database(dbPath),
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXTAUTH_URL,
  trustedOrigins: [...devTrustedOrigins, ...extraTrustedOrigins],
  session: {
    expiresIn: sessionExpiresIn,
  },
  emailAndPassword: {
    enabled: passwordLoginEnabled,
    disableSignUp: true,
    // Use bcrypt to stay compatible with existing password hashes from users.json
    password: {
      hash: (password) => hash(password, 10),
      verify: ({ hash: storedHash, password }) => compare(password, storedHash),
    },
  },
  // Social providers only sign in — they CANNOT create accounts.
  // The admin must already exist (email must match).
  socialProviders: Object.keys(socialProviders).length > 0 ? (socialProviders as any) : undefined,
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'github', 'microsoft', 'gitlab'],
      // IMPORTANT: Set to true when I'll implement multi-user support in borgwarehouse (one day...)
      // Prevents email squatting attacks where an attacker creates an unverified
      // account with a victim's email, then the victim's OAuth links to it.
      // Safe to disable in single-user mode (no public sign-up possible).
      requireLocalEmailVerified: false,
    },
  },
  plugins,
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
  databaseHooks: {
    user: {
      create: {
        // Prevent OAuth from creating new users — only allow sign-in to existing accounts
        before: async (user) => {
          const db = new Database(dbPath);
          try {
            const existing = db.prepare('SELECT id FROM user WHERE email = ?').get(user.email);
            if (!existing) {
              return false; // Block user creation
            }
          } finally {
            db.close();
          }
        },
      },
    },
  },
});

/** Returns the list of enabled OAuth provider IDs for the frontend */
export function getEnabledProviders(): { id: string; name: string }[] {
  const providers: { id: string; name: string }[] = [];
  if (socialProviders.github) providers.push({ id: 'github', name: 'GitHub' });
  if (socialProviders.google) providers.push({ id: 'google', name: 'Google' });
  if (socialProviders.microsoft) providers.push({ id: 'microsoft', name: 'Microsoft' });
  if (socialProviders.gitlab) providers.push({ id: 'gitlab', name: 'GitLab' });
  if (oidcConfig.length > 0)
    providers.push({ id: 'oidc', name: process.env.OIDC_PROVIDER_NAME ?? 'SSO' });
  return providers;
}

/** Whether username/password login is enabled */
export const isPasswordLoginEnabled = passwordLoginEnabled;
