import Link from 'next/link';
import { Card, CardBody, CardTitle } from '@/components/ui/Card';
import type { Course } from '@/db/schema';

type Props = {
  course: Course & { instructorName?: string | null; lessonCount?: number };
};

export function CourseCard({ course }: Props) {
  return (
    <Link href={`/courses/${course.slug}`} className="group block no-underline">
      <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="aspect-video w-full bg-zinc-100 dark:bg-zinc-800">
          {course.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.coverUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400 text-sm">
              No cover
            </div>
          )}
        </div>
        <CardBody>
          <CardTitle className="text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {course.title}
          </CardTitle>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {course.description || 'No description yet.'}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
            <span>{course.instructorName ?? 'Instructor'}</span>
            <span>{course.lessonCount ?? 0} lessons</span>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
