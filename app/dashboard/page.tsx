import Link from 'next/link';
import { redirect } from 'next/navigation';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { courses, lessons } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardBody, CardTitle } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/dashboard');
  if (user.role !== 'instructor' && user.role !== 'admin') redirect('/');

  const rows = await db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      published: courses.published,
      createdAt: courses.createdAt,
      lessonCount: sql<number>`count(${lessons.id})::int`,
    })
    .from(courses)
    .leftJoin(lessons, eq(lessons.courseId, courses.id))
    .where(eq(courses.instructorId, user.id))
    .groupBy(courses.id)
    .orderBy(desc(courses.createdAt));

  return (
    <div>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Create courses and add lessons.
          </p>
        </div>
        <Link
          href="/dashboard/courses/new"
          className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white no-underline hover:bg-blue-700"
        >
          + New course
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700">
          <p className="text-lg font-medium">No courses yet</p>
          <p className="mt-1 text-sm">Create your first course to start adding lessons.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rows.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/courses/${c.id}/edit`}
                className="block no-underline"
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-zinc-900 dark:text-zinc-100">
                        {c.title}
                      </CardTitle>
                      <span
                        className={[
                          'rounded-full px-2 py-0.5 text-xs',
                          c.published
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
                        ].join(' ')}
                      >
                        {c.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      /{c.slug} · {c.lessonCount} lessons
                    </p>
                  </CardBody>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
