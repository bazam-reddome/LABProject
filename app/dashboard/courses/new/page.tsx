import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { CourseForm } from '../CourseForm';

export default async function NewCoursePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/dashboard/courses/new');
  if (user.role !== 'instructor' && user.role !== 'admin') redirect('/');

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">New Course</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        You can save as a draft and publish later.
      </p>
      <div className="mt-6">
        <CourseForm mode="create" />
      </div>
    </div>
  );
}
