import { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { courses } from '@/db/schema';
import { courseInputSchema } from '@/lib/validation';
import { requireRole } from '@/lib/auth';
import { ok, fail, handleError } from '@/lib/api';

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(courses)
      .where(eq(courses.published, true))
      .orderBy(desc(courses.createdAt));
    return ok({ courses: rows });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('instructor', 'admin');
    const body = await req.json();
    const input = courseInputSchema.parse(body);

    const existing = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.slug, input.slug))
      .limit(1);
    if (existing.length) return fail(409, 'Slug already in use');

    const [row] = await db
      .insert(courses)
      .values({
        title: input.title,
        slug: input.slug,
        description: input.description,
        coverUrl: input.coverUrl,
        published: input.published,
        instructorId: user.id,
      })
      .returning();
    return ok({ course: row }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
