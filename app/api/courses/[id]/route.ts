import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { courses } from '@/db/schema';
import { courseInputSchema } from '@/lib/validation';
import { requireRole } from '@/lib/auth';
import { ok, fail, handleError } from '@/lib/api';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [row] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    if (!row) return fail(404, 'Course not found');
    return ok({ course: row });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('instructor', 'admin');
    const { id } = await params;
    const [course] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    if (!course) return fail(404, 'Course not found');
    if (user.role !== 'admin' && course.instructorId !== user.id) return fail(403, 'Forbidden');

    const body = await req.json();
    const input = courseInputSchema.partial().parse(body);

    const [updated] = await db
      .update(courses)
      .set({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.coverUrl !== undefined && { coverUrl: input.coverUrl ?? null }),
        ...(input.published !== undefined && { published: input.published }),
      })
      .where(eq(courses.id, id))
      .returning();
    return ok({ course: updated });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole('instructor', 'admin');
    const { id } = await params;
    const [course] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    if (!course) return fail(404, 'Course not found');
    if (user.role !== 'admin' && course.instructorId !== user.id) return fail(403, 'Forbidden');

    await db.delete(courses).where(eq(courses.id, id));
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
