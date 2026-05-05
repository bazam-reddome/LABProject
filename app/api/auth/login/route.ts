import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { loginSchema } from '@/lib/validation';
import { signSession, setSessionCookie, verifyPassword } from '@/lib/auth';
import { ok, fail, handleError } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = loginSchema.parse(body);

    const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (!user) return fail(401, 'Invalid credentials');

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) return fail(401, 'Invalid credentials');

    const token = await signSession(user);
    await setSessionCookie(token);
    return ok({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (err) {
    return handleError(err);
  }
}
