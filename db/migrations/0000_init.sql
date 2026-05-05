CREATE TYPE "user_role" AS ENUM ('student', 'instructor', 'admin');

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "password_hash" text NOT NULL,
  "name" varchar(120) NOT NULL,
  "role" user_role DEFAULT 'student' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "users_email_unique" ON "users" ("email");

CREATE TABLE "courses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" varchar(200) NOT NULL,
  "slug" varchar(220) NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "instructor_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "published" boolean DEFAULT false NOT NULL,
  "cover_url" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "courses_slug_unique" ON "courses" ("slug");
CREATE INDEX "courses_instructor_idx" ON "courses" ("instructor_id");

CREATE TABLE "lessons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "title" varchar(200) NOT NULL,
  "content_md" text DEFAULT '' NOT NULL,
  "video_url" text,
  "position" integer DEFAULT 0 NOT NULL,
  "duration_seconds" integer DEFAULT 0 NOT NULL
);
CREATE INDEX "lessons_course_idx" ON "lessons" ("course_id", "position");

CREATE TABLE "enrollments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "enrolled_at" timestamptz DEFAULT now() NOT NULL,
  "completed_at" timestamptz
);
CREATE UNIQUE INDEX "enrollments_user_course_unique" ON "enrollments" ("user_id", "course_id");

CREATE TABLE "lesson_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "lesson_id" uuid NOT NULL REFERENCES "lessons"("id") ON DELETE CASCADE,
  "completed" boolean DEFAULT false NOT NULL,
  "watched_seconds" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "lesson_progress_user_lesson_unique" ON "lesson_progress" ("user_id", "lesson_id");
