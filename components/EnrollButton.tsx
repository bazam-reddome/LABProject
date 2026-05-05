'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function EnrollButton({
  courseId,
  enrolled,
  firstLessonHref,
}: {
  courseId: string;
  enrolled: boolean;
  firstLessonHref?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (enrolled && firstLessonHref) {
    return (
      <Button onClick={() => router.push(firstLessonHref)}>Continue learning</Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const res = await fetch('/api/enrollments', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ courseId }),
          });
          setBusy(false);
          if (!res.ok) {
            if (res.status === 401) {
              router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
              return;
            }
            const data = await res.json().catch(() => ({}));
            setError(data?.error ?? 'Could not enroll');
            return;
          }
          router.refresh();
          if (firstLessonHref) router.push(firstLessonHref);
        }}
      >
        {busy ? 'Enrolling…' : 'Enroll'}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
