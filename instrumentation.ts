export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.SKIP_DB_BOOTSTRAP === 'true') return;

  const { runMigrations } = await import('./db/migrate');
  await runMigrations();

  if (process.env.SEED === 'true') {
    const { seed } = await import('./db/seed');
    await seed();
  }
}
