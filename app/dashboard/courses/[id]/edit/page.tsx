import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { courses, lessons } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { CourseForm } from '../../CourseForm';
import { formatDuration } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/dashboard');
  if (user.role !== 'instructor' && user.role !== 'admin') redirect('/');
  const { id } = await params;

  const [course] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!course) notFound();
  if (user.role !== 'admin' && course.instructorId !== user.id) redirect('/dashboard');

  const courseLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, course.id))
    .orderBy(asc(lessons.position));

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">Edit course</h1>
        <div className="mt-6">
          <CourseForm
            mode="edit"
            course={{
              id: course.id,
              title: course.title,
              slug: course.slug,
              description: course.description,
              coverUrl: course.coverUrl,
              published: course.published,
            }}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Lessons</h2>
          <Link
            href={`/dashboard/courses/${course.id}/lessons/new`}
            className="inline-flex h-9 items-center rounded-md bg-blue-600 px-3 text-sm font-medium text-white no-underline hover:bg-blue-700"
          >
            + New lesson
          </Link>
        </div>

        {courseLessons.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
            No lessons yet.
          </div>
        ) : (
          <ol className="mt-4 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {courseLessons.map((l, i) => (
              <li key={l.id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="font-medium">
                    <span className="mr-2 text-zinc-400">{i + 1}.</span>
                    {l.title}
                  </p>
                  <p className="text-xs text-zinc-500">
                    pos {l.position} · {formatDuration(l.durationSeconds)}
                  </p>
                </div>
                <Link
                  href={`/dashboard/courses/${course.id}/lessons/${l.id}/edit`}
                  className="text-sm text-blue-600 dark:text-blue-400"
                >
                  Edit →
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
