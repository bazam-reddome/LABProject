import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { courses, enrollments } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { ok, fail, handleError } from '@/lib/api';

const enrollSchema = z.object({ courseId: z.string().uuid() });

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db.select().from(enrollments).where(eq(enrollments.userId, user.id));
    return ok({ enrollments: rows });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { courseId } = enrollSchema.parse(body);

    const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    if (!course) return fail(404, 'Course not found');
    if (!course.published) return fail(400, 'Course is not published');

    const existing = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, user.id), eq(enrollments.courseId, courseId)))
      .limit(1);
    if (existing.length) return ok({ enrollment: existing[0] });

    const [row] = await db
      .insert(enrollments)
      .values({ userId: user.id, courseId })
      .returning();
    return ok({ enrollment: row }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
