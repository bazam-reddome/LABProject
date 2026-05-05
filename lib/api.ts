import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AuthError } from '@/lib/auth';

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function fail(status: number, message: string, extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function handleError(err: unknown): NextResponse {
  if (err instanceof AuthError) return fail(err.status, err.message);
  if (err instanceof ZodError) return fail(400, 'Invalid input', { issues: err.flatten() });
  if (err instanceof Error) {
    console.error('[api]', err);
    return fail(500, err.message || 'Internal error');
  }
  console.error('[api] unknown error', err);
  return fail(500, 'Internal error');
}
