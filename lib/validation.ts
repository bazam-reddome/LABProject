import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(120),
  role: z.enum(['student', 'instructor']).default('student'),
});

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

export const courseInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, digits, hyphens'),
  description: z.string().max(5000).default(''),
  coverUrl: z.string().url().max(2000).optional().or(z.literal('').transform(() => undefined)),
  published: z.boolean().default(false),
});

export const lessonInputSchema = z.object({
  title: z.string().min(1).max(200),
  contentMd: z.string().max(50000).default(''),
  videoUrl: z.string().url().max(2000).optional().or(z.literal('').transform(() => undefined)),
  position: z.coerce.number().int().min(0).max(10000),
  durationSeconds: z.coerce.number().int().min(0).max(86400).default(0),
});

export const progressSchema = z.object({
  lessonId: z.string().uuid(),
  completed: z.boolean().optional(),
  watchedSeconds: z.number().int().min(0).max(86400).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CourseInput = z.infer<typeof courseInputSchema>;
export type LessonInput = z.infer<typeof lessonInputSchema>;
