import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { courses, lessons } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { LessonForm } from '../../LessonForm';

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'instructor' && user.role !== 'admin') redirect('/');
  const { id, lessonId } = await params;

  const [course] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!course) notFound();
  if (user.role !== 'admin' && course.instructorId !== user.id) redirect('/dashboard');

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  if (!lesson || lesson.courseId !== course.id) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">Edit lesson — {course.title}</h1>
      <div className="mt-6">
        <LessonForm
          mode="edit"
          courseId={course.id}
          lesson={{
            id: lesson.id,
            title: lesson.title,
            contentMd: lesson.contentMd,
            videoUrl: lesson.videoUrl,
            position: lesson.position,
            durationSeconds: lesson.durationSeconds,
          }}
        />
      </div>
    </div>
  );
}
