import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Not found</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        The page you’re looking for doesn’t exist.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white no-underline hover:bg-blue-700"
      >
        Back to catalog
      </Link>
    </div>
  );
}
