import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { lessons, lessonProgress, enrollments } from '@/db/schema';
import { progressSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { ok, fail, handleError } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const input = progressSchema.parse(body);

    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, input.lessonId)).limit(1);
    if (!lesson) return fail(404, 'Lesson not found');

    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, user.id), eq(enrollments.courseId, lesson.courseId)))
      .limit(1);
    if (!enrollment) return fail(403, 'Not enrolled in this course');

    const [existing] = await db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, user.id), eq(lessonProgress.lessonId, input.lessonId)))
      .limit(1);

    const now = new Date();
    let row;
    if (existing) {
      [row] = await db
        .update(lessonProgress)
        .set({
          completed: input.completed ?? existing.completed,
          watchedSeconds: input.watchedSeconds ?? existing.watchedSeconds,
          updatedAt: now,
        })
        .where(eq(lessonProgress.id, existing.id))
        .returning();
    } else {
      [row] = await db
        .insert(lessonProgress)
        .values({
          userId: user.id,
          lessonId: input.lessonId,
          completed: input.completed ?? false,
          watchedSeconds: input.watchedSeconds ?? 0,
          updatedAt: now,
        })
        .returning();
    }

    return ok({ progress: row });
  } catch (err) {
    return handleError(err);
  }
}
