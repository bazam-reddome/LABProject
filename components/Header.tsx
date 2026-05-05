import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { LogoutButton } from '@/components/LogoutButton';

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-semibold tracking-tight text-zinc-900 no-underline hover:no-underline dark:text-zinc-100"
        >
          LMS
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-zinc-700 dark:text-zinc-300 no-underline">
            Catalog
          </Link>
          {user && (user.role === 'instructor' || user.role === 'admin') && (
            <Link href="/dashboard" className="text-zinc-700 dark:text-zinc-300 no-underline">
              Dashboard
            </Link>
          )}
          {user ? (
            <>
              <span className="text-zinc-500 dark:text-zinc-400">{user.name}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-zinc-700 dark:text-zinc-300 no-underline">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-white no-underline hover:bg-blue-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
