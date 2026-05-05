import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LoginForm } from './LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const { next } = await searchParams;
  if (user) redirect(next ?? '/');

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Sign in to continue learning.
      </p>
      <div className="mt-6">
        <LoginForm next={next} />
      </div>
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        No account?{' '}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`}>
          Create one
        </Link>
      </p>
    </div>
  );
}
