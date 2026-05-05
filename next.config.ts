import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '/': ['./db/migrations/**/*.sql'],
  },
};

export default nextConfig;
