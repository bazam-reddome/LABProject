import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { courses, lessons, users } from '@/db/schema';
import { CourseCard } from '@/components/CourseCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const rows = await db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      description: courses.description,
      instructorId: courses.instructorId,
      published: courses.published,
      coverUrl: courses.coverUrl,
      createdAt: courses.createdAt,
      instructorName: users.name,
      lessonCount: sql<number>`count(${lessons.id})::int`,
    })
    .from(courses)
    .leftJoin(users, eq(users.id, courses.instructorId))
    .leftJoin(lessons, eq(lessons.courseId, courses.id))
    .where(eq(courses.published, true))
    .groupBy(courses.id, users.name)
    .orderBy(desc(courses.createdAt));

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Course Catalog</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Browse our published courses and enroll to start learning.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700">
          <p className="text-lg font-medium">No courses yet</p>
          <p className="mt-1 text-sm">Sign in as an instructor to publish the first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}
