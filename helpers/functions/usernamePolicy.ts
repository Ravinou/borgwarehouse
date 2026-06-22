/**
 * Single source of truth for the BorgWarehouse username policy.
 *
 * The username is an identity/display string only (login identifier + name shown
 * in alert notifications). It is never used to build filesystem paths or shell
 * commands, so a broad, modern character set is safe.
 *
 * Rules (state of the art, GitHub/Discord-like):
 *  - Allowed characters: letters, digits, dot, underscore and hyphen.
 *  - Length: 1 to 64 characters.
 *  - Uniqueness and login are case-insensitive (the auth layer normalizes to
 *    lowercase), so this policy must stay aligned with the better-auth username
 *    plugin options in `lib/auth.ts` to avoid locking users out at login.
 *
 * The previous policy (`^[a-z]{1,40}$`) is a strict subset of this one, so every
 * existing username remains valid (no migration needed for old installs).
 */

export const USERNAME_MIN_LENGTH = 1;
export const USERNAME_MAX_LENGTH = 64;

/** Character class shared by the validation regex (note: `-` is kept last so it stays literal). */
export const USERNAME_ALLOWED_CHARS = 'a-zA-Z0-9._-';

export const USERNAME_REGEX = new RegExp(
  `^[${USERNAME_ALLOWED_CHARS}]{${USERNAME_MIN_LENGTH},${USERNAME_MAX_LENGTH}}$`
);

export const USERNAME_POLICY_MESSAGE = `Allowed: letters, numbers, dots, underscores and hyphens (${USERNAME_MIN_LENGTH}–${USERNAME_MAX_LENGTH} characters).`;

/** Validate a username against the BorgWarehouse policy. */
export const isValidUsername = (username: string): boolean => USERNAME_REGEX.test(username);
