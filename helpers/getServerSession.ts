import type { GetServerSidePropsContext } from 'next';
import type { NextApiRequest, NextApiResponse } from 'next';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '~/lib/auth';

export type BwSession = {
  user: {
    name: string;
    email?: string;
    id?: string;
    roles?: string[];
  };
} | null;

/**
 * Drop-in replacement for next-auth's getServerSession(req, res, authOptions).
 * Returns a session object with the same shape used across the codebase,
 * or null if the request is unauthenticated.
 */
export async function getSession(
  req: NextApiRequest | GetServerSidePropsContext['req'],
  _res?: NextApiResponse | GetServerSidePropsContext['res']
): Promise<BwSession> {
  const result = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!result) return null;

  const userWithRoles = result.user as typeof result.user & { roles?: string };

  return {
    user: {
      name: result.user.name,
      email: result.user.email,
      id: result.user.id,
      roles: userWithRoles.roles ? (JSON.parse(userWithRoles.roles) as string[]) : [],
    },
  };
}
