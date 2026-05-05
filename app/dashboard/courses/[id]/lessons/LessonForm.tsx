'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';

type Props =
  | { mode: 'create'; courseId: string; defaultPosition: number }
  | {
      mode: 'edit';
      courseId: string;
      lesson: {
        id: string;
        title: string;
        contentMd: string;
        videoUrl: string | null;
        position: number;
        durationSeconds: number;
      };
    };

export function LessonForm(props: Props) {
  const router = useRouter();
  const initial = props.mode === 'edit' ? props.lesson : null;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [contentMd, setContentMd] = useState(initial?.contentMd ?? '');
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? '');
  const [position, setPosition] = useState(
    initial?.position ?? (props.mode === 'create' ? props.defaultPosition : 1),
  );
  const [durationSeconds, setDurationSeconds] = useState(initial?.durationSeconds ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const payload = {
          title,
          contentMd,
          videoUrl: videoUrl || undefined,
          position,
          durationSeconds,
        };
        const res =
          props.mode === 'create'
            ? await fetch(`/api/courses/${props.courseId}/lessons`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
              })
            : await fetch(`/api/lessons/${props.lesson.id}`, {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
              });
        setBusy(false);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data?.error ?? 'Save failed');
          return;
        }
        router.push(`/dashboard/courses/${props.courseId}/edit`);
        router.refresh();
      }}
    >
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            type="number"
            min={0}
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="duration">Duration (seconds)</Label>
          <Input
            id="duration"
            type="number"
            min={0}
            value={durationSeconds}
            onChange={(e) => setDurationSeconds(Number(e.target.value))}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="videoUrl">YouTube URL (optional)</Label>
        <Input
          id="videoUrl"
          type="url"
          placeholder="https://www.youtube.com/watch?v=…"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="contentMd">Content (markdown)</Label>
        <Textarea
          id="contentMd"
          rows={14}
          value={contentMd}
          onChange={(e) => setContentMd(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : props.mode === 'create' ? 'Create lesson' : 'Save changes'}
        </Button>
        {props.mode === 'edit' && (
          <Button
            type="button"
            variant="danger"
            disabled={busy}
            onClick={async () => {
              if (!confirm('Delete this lesson?')) return;
              setBusy(true);
              const res = await fetch(`/api/lessons/${props.lesson.id}`, { method: 'DELETE' });
              setBusy(false);
              if (res.ok) {
                router.push(`/dashboard/courses/${props.courseId}/edit`);
                router.refresh();
              }
            }}
          >
            Delete lesson
          </Button>
        )}
      </div>
    </form>
  );
}
