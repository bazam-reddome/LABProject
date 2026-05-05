'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function CompleteButton({
  lessonId,
  initialCompleted,
}: {
  lessonId: string;
  initialCompleted: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant={completed ? 'secondary' : 'primary'}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const next = !completed;
        const res = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ lessonId, completed: next }),
        });
        setBusy(false);
        if (res.ok) {
          setCompleted(next);
          router.refresh();
        }
      }}
    >
      {busy ? 'Saving…' : completed ? 'Completed ✓' : 'Mark as complete'}
    </Button>
  );
}
