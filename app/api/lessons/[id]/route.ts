import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { courses, lessons } from '@/db/schema';
import { lessonInputSchema } from '@/lib/validation';
import { requireRole } from '@/lib/auth';
import { ok, fail, handleError } from '@/lib/api';

async function loadLessonAndCourse(id: string) {
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  if (!lesson) return null;
  const [course] = await db.select().from(courses).where(eq(courses.id, lesson.courseId)).limit(1);
  if (!course) return null;
  return { lesson, course };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('instructor', 'admin');
    const { id } = await params;
    const found = await loadLessonAndCourse(id);
    if (!found) return fail(404, 'Lesson not found');
    if (user.role !== 'admin' && found.course.instructorId !== user.id) return fail(403, 'Forbidden');

    const body = await req.json();
    const input = lessonInputSchema.partial().parse(body);
    const [updated] = await db
      .update(lessons)
      .set({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.contentMd !== undefined && { contentMd: input.contentMd }),
        ...(input.videoUrl !== undefined && { videoUrl: input.videoUrl ?? null }),
        ...(input.position !== undefined && { position: input.position }),
        ...(input.durationSeconds !== undefined && { durationSeconds: input.durationSeconds }),
      })
      .where(eq(lessons.id, id))
      .returning();
    return ok({ lesson: updated });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('instructor', 'admin');
    const { id } = await params;
    const found = await loadLessonAndCourse(id);
    if (!found) return fail(404, 'Lesson not found');
    if (user.role !== 'admin' && found.course.instructorId !== user.id) return fail(403, 'Forbidden');

    await db.delete(lessons).where(eq(lessons.id, id));
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
