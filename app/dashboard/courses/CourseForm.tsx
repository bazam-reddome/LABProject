'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { slugify } from '@/lib/utils';

type Mode = { mode: 'create' } | {
  mode: 'edit';
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    coverUrl: string | null;
    published: boolean;
  };
};

export function CourseForm(props: Mode) {
  const router = useRouter();
  const initial = props.mode === 'edit' ? props.course : null;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? '');
  const [published, setPublished] = useState(initial?.published ?? false);
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
          slug: slug || slugify(title),
          description,
          coverUrl: coverUrl || undefined,
          published,
        };
        const res =
          props.mode === 'create'
            ? await fetch('/api/courses', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
              })
            : await fetch(`/api/courses/${props.course.id}`, {
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
        const data = await res.json();
        if (props.mode === 'create') router.push(`/dashboard/courses/${data.course.id}/edit`);
        else router.refresh();
      }}
    >
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </div>
      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
        />
        <p className="mt-1 text-xs text-zinc-500">
          URL-friendly identifier. Lowercase, hyphens, digits.
        </p>
      </div>
      <div>
        <Label htmlFor="description">Description (markdown)</Label>
        <Textarea
          id="description"
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="coverUrl">Cover image URL</Label>
        <Input
          id="coverUrl"
          type="url"
          placeholder="https://…"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300"
        />
        Published (visible in catalog)
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : props.mode === 'create' ? 'Create course' : 'Save changes'}
        </Button>
        {props.mode === 'edit' && (
          <Button
            type="button"
            variant="danger"
            disabled={busy}
            onClick={async () => {
              if (!confirm('Delete this course and all its lessons?')) return;
              setBusy(true);
              const res = await fetch(`/api/courses/${props.course.id}`, { method: 'DELETE' });
              setBusy(false);
              if (res.ok) router.push('/dashboard');
            }}
          >
            Delete course
          </Button>
        )}
      </div>
    </form>
  );
}
