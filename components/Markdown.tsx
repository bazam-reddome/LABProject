import { renderMarkdown } from '@/lib/markdown';

// Content is sanitized with DOMPurify inside renderMarkdown (see lib/markdown.ts).
export function Markdown({ source }: { source: string }) {
  const html = renderMarkdown(source);
  return <div className="prose-md max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
}
