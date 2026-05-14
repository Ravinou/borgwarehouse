import { createAuthClient } from 'better-auth/react';
import { usernameClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  plugins: [usernameClient()],
});

export type BwAuthSession = {
  user: {
    name?: string;
    email?: string;
    id?: string;
    roles?: string[];
  };
} | null;

/** Migration next-auth to better-auth.
 * Session status values are identical to next-auth's for backward compat.
 */
type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * Drop-in replacement for next-auth's useSession().
 * Returns { status, data } with the same shape used throughout the codebase.
 */
export function useAuthSession(): { status: SessionStatus; data: BwAuthSession } {
  const { data, isPending } = authClient.useSession();

  const status: SessionStatus = isPending ? 'loading' : data ? 'authenticated' : 'unauthenticated';

  const userWithExtra = data?.user as { roles?: string } | undefined;

  const session: BwAuthSession = data
    ? {
        user: {
          name: data.user.name ?? undefined,
          email: data.user.email ?? undefined,
          id: data.user.id ?? undefined,
          roles: userWithExtra?.roles ? (JSON.parse(userWithExtra.roles) as string[]) : [],
        },
      }
    : null;

  return { status, data: session };
}
