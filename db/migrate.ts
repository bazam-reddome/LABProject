import fs from 'node:fs/promises';
import path from 'node:path';
import postgres from 'postgres';

const MIGRATIONS_DIR = path.join(process.cwd(), 'db', 'migrations');

export async function runMigrations(databaseUrl?: string): Promise<void> {
  const url = databaseUrl ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "_migrations" (
        "name" text PRIMARY KEY,
        "applied_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    const entries = await fs.readdir(MIGRATIONS_DIR);
    const files = entries.filter((f) => f.endsWith('.sql')).sort();

    const applied = await sql<{ name: string }[]>`SELECT name FROM "_migrations"`;
    const appliedSet = new Set(applied.map((r) => r.name));

    for (const file of files) {
      if (appliedSet.has(file)) continue;
      const fullPath = path.join(MIGRATIONS_DIR, file);
      const contents = await fs.readFile(fullPath, 'utf8');
      console.log(`[migrate] applying ${file}`);
      await sql.begin(async (tx) => {
        await tx.unsafe(contents);
        await tx`INSERT INTO "_migrations" (name) VALUES (${file})`;
      });
    }
    console.log('[migrate] up to date');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  runMigrations().catch((err) => {
    console.error('[migrate] failed', err);
    process.exit(1);
  });
}
