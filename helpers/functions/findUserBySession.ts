import { BorgWarehouseUser } from '~/types';
import { Optional } from '~/types/optional';
import { BwSession } from '~/helpers/getServerSession';

/**
 * Finds a user in the borgwarehouse users list from a session.
 *
 * Uses the numeric user ID as the authoritative key : it is immutable,
 * unique, and set at migration time from users.json into better-auth.
 * This is robust regardless of whether the user has set an email address.
 */
export function findUserBySession(
  usersList: BorgWarehouseUser[],
  session: BwSession
): Optional<BorgWarehouseUser> {
  const rawId = session?.user?.id;
  if (!rawId) return undefined;
  const sessionId = parseInt(rawId, 10);
  if (isNaN(sessionId)) return undefined;
  return usersList.find((u) => u.id === sessionId);
}

export function findUserIndexBySession(usersList: BorgWarehouseUser[], session: BwSession): number {
  const rawId = session?.user?.id;
  if (!rawId) return -1;
  const sessionId = parseInt(rawId, 10);
  if (isNaN(sessionId)) return -1;
  return usersList.findIndex((u) => u.id === sessionId);
}
