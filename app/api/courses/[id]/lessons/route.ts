import { NextRequest } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { courses, lessons } from '@/db/schema';
import { lessonInputSchema } from '@/lib/validation';
import { requireRole } from '@/lib/auth';
import { ok, fail, handleError } from '@/lib/api';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, id))
      .orderBy(asc(lessons.position));
    return ok({ lessons: rows });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('instructor', 'admin');
    const { id } = await params;

    const [course] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    if (!course) return fail(404, 'Course not found');
    if (user.role !== 'admin' && course.instructorId !== user.id) return fail(403, 'Forbidden');

    const body = await req.json();
    const input = lessonInputSchema.parse(body);

    const [row] = await db
      .insert(lessons)
      .values({
        courseId: id,
        title: input.title,
        contentMd: input.contentMd,
        videoUrl: input.videoUrl,
        position: input.position,
        durationSeconds: input.durationSeconds,
      })
      .returning();
    return ok({ lesson: row }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
