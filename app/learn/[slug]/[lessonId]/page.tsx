import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { courses, lessons, enrollments, lessonProgress } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { Markdown } from '@/components/Markdown';
import { ProgressBar } from '@/components/ProgressBar';
import { CompleteButton } from '@/components/CompleteButton';
import { youtubeEmbed, formatDuration } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function LearnPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const me = await getCurrentUser();
  if (!me) redirect(`/login?next=${encodeURIComponent(`/learn/${slug}/${lessonId}`)}`);

  const [course] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
  if (!course) notFound();

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, me.id), eq(enrollments.courseId, course.id)))
    .limit(1);
  if (!enrollment) redirect(`/courses/${course.slug}`);

  const courseLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, course.id))
    .orderBy(asc(lessons.position));

  const lesson = courseLessons.find((l) => l.id === lessonId);
  if (!lesson) notFound();

  const progressRows = courseLessons.length
    ? await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, me.id),
            inArray(
              lessonProgress.lessonId,
              courseLessons.map((l) => l.id),
            ),
          ),
        )
    : [];
  const progressById = new Map(progressRows.map((p) => [p.lessonId, p]));
  const completedCount = progressRows.filter((p) => p.completed).length;
  const currentProgress = progressById.get(lesson.id);

  const idx = courseLessons.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? courseLessons[idx - 1] : null;
  const next = idx < courseLessons.length - 1 ? courseLessons[idx + 1] : null;
  const embed = lesson.videoUrl ? youtubeEmbed(lesson.videoUrl) : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="lg:sticky lg:top-6 h-fit rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <Link
          href={`/courses/${course.slug}`}
          className="text-xs text-zinc-500 no-underline hover:underline"
        >
          ← {course.title}
        </Link>
        <div className="mt-3">
          <ProgressBar value={completedCount} max={courseLessons.length} />
        </div>
        <ol className="mt-4 space-y-1">
          {courseLessons.map((l, i) => {
            const done = progressById.get(l.id)?.completed;
            const active = l.id === lesson.id;
            return (
              <li key={l.id}>
                <Link
                  href={`/learn/${course.slug}/${l.id}`}
                  className={[
                    'block rounded-md px-2 py-1.5 text-sm no-underline',
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                  ].join(' ')}
                >
                  <span className="mr-2 opacity-60">{i + 1}.</span>
                  {l.title}
                  {done && !active && <span className="ml-1 text-green-600">✓</span>}
                </Link>
              </li>
            );
          })}
        </ol>
      </aside>

      <article>
        <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
        <p className="mt-1 text-xs text-zinc-500">
          {formatDuration(lesson.durationSeconds)}
        </p>

        {embed && (
          <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe
              src={embed}
              title={lesson.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        )}

        <div className="mt-6">
          <Markdown source={lesson.contentMd || '_No content yet._'} />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <div className="flex gap-2">
            {prev && (
              <Link
                href={`/learn/${course.slug}/${prev.id}`}
                className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm no-underline dark:border-zinc-700"
              >
                ← Previous
              </Link>
            )}
            {next && (
              <Link
                href={`/learn/${course.slug}/${next.id}`}
                className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm no-underline dark:border-zinc-700"
              >
                Next →
              </Link>
            )}
          </div>
          <CompleteButton
            lessonId={lesson.id}
            initialCompleted={!!currentProgress?.completed}
          />
        </div>
      </article>
    </div>
  );
}
