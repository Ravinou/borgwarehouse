/**
 * Migration nextauth to better-auth.
 * Next.js instrumentation hook runs once when the server starts.
 * Automatically creates the better-auth SQLite schema and migrates
 * existing users from config/users.json on first boot.
 * No manual command needed.
 */
export async function register() {
  // Only run in the Node.js runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { migrateUsersFromJson } = await import('./lib/auth-migrate');
    await migrateUsersFromJson();
  }
}
