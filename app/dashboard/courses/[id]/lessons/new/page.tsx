import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { courses, lessons } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { LessonForm } from '../LessonForm';

export default async function NewLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'instructor' && user.role !== 'admin') redirect('/');
  const { id } = await params;

  const [course] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!course) notFound();
  if (user.role !== 'admin' && course.instructorId !== user.id) redirect('/dashboard');

  const existing = await db
    .select({ position: lessons.position })
    .from(lessons)
    .where(eq(lessons.courseId, course.id));
  const nextPos = existing.length === 0 ? 1 : Math.max(...existing.map((l) => l.position)) + 1;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">New lesson — {course.title}</h1>
      <div className="mt-6">
        <LessonForm mode="create" courseId={course.id} defaultPosition={nextPos} />
      </div>
    </div>
  );
}
