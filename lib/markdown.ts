import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

marked.setOptions({ gfm: true, breaks: true });

export function renderMarkdown(input: string): string {
  const raw = marked.parse(input ?? '', { async: false }) as string;
  return DOMPurify.sanitize(raw);
}
