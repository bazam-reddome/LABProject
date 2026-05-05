import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { courses, lessons, users, enrollments, lessonProgress } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { EnrollButton } from '@/components/EnrollButton';
import { Markdown } from '@/components/Markdown';
import { ProgressBar } from '@/components/ProgressBar';
import { formatDuration } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [course] = await db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      description: courses.description,
      coverUrl: courses.coverUrl,
      published: courses.published,
      instructorId: courses.instructorId,
      instructorName: users.name,
    })
    .from(courses)
    .leftJoin(users, eq(users.id, courses.instructorId))
    .where(eq(courses.slug, slug))
    .limit(1);

  if (!course || !course.published) notFound();

  const courseLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, course.id))
    .orderBy(asc(lessons.position));

  const me = await getCurrentUser();
  let enrolled = false;
  let completedCount = 0;
  if (me) {
    const [enr] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, me.id), eq(enrollments.courseId, course.id)))
      .limit(1);
    enrolled = !!enr;
    if (enrolled) {
      const progress = await db
        .select()
        .from(lessonProgress)
        .where(eq(lessonProgress.userId, me.id));
      const lessonIds = new Set(courseLessons.map((l) => l.id));
      completedCount = progress.filter((p) => p.completed && lessonIds.has(p.lessonId)).length;
    }
  }

  const firstLesson = courseLessons[0];
  const firstLessonHref = firstLesson
    ? `/learn/${course.slug}/${firstLesson.id}`
    : undefined;

  return (
    <article className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        {course.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.coverUrl}
            alt=""
            className="mb-6 aspect-video w-full rounded-xl object-cover"
          />
        )}
        <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">By {course.instructorName ?? 'Instructor'}</p>
        <div className="mt-6">
          <Markdown source={course.description || '_No description yet._'} />
        </div>

        <h2 className="mt-10 text-xl font-semibold">Lessons</h2>
        {courseLessons.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No lessons yet.</p>
        ) : (
          <ol className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {courseLessons.map((l, i) => (
              <li key={l.id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="font-medium">
                    <span className="mr-2 text-zinc-400">{i + 1}.</span>
                    {l.title}
                  </p>
                  <p className="text-xs text-zinc-500">{formatDuration(l.durationSeconds)}</p>
                </div>
                {enrolled && (
                  <Link
                    href={`/learn/${course.slug}/${l.id}`}
                    className="text-sm text-blue-600 dark:text-blue-400"
                  >
                    Open →
                  </Link>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      <aside className="lg:sticky lg:top-6 h-fit space-y-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <div className="text-sm text-zinc-500">{courseLessons.length} lessons</div>
        {me ? (
          <>
            {enrolled && courseLessons.length > 0 && (
              <ProgressBar value={completedCount} max={courseLessons.length} />
            )}
            <EnrollButton
              courseId={course.id}
              enrolled={enrolled}
              firstLessonHref={firstLessonHref}
            />
          </>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white no-underline hover:bg-blue-700"
          >
            Sign in to enroll
          </Link>
        )}
      </aside>
    </article>
  );
}
