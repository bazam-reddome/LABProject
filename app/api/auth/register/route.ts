import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { registerSchema } from '@/lib/validation';
import { hashPassword, signSession, setSessionCookie } from '@/lib/auth';
import { ok, fail, handleError } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = registerSchema.parse(body);

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
    if (existing.length) return fail(409, 'Email already in use');

    const passwordHash = await hashPassword(input.password);
    const [user] = await db
      .insert(users)
      .values({ email: input.email, passwordHash, name: input.name, role: input.role })
      .returning();

    const token = await signSession(user);
    await setSessionCookie(token);
    return ok({ id: user.id, email: user.email, name: user.name, role: user.role }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
