/*
# Create lesson_overrides table (multi-user, owner-scoped)

1. New Tables
- `public.lesson_overrides`
  - `user_id` (uuid, not null, defaults to auth.uid()) — owner, references auth.users(id) ON DELETE CASCADE
  - `course_id` (text, not null) — which course this override applies to (e.g. 'private', 'instrument')
  - `lesson_n` (int, not null) — the lesson number within that course
  - `title` (text, nullable) — override title; null means use the default
  - `deck` (text, nullable) — override slide deck URL; null means use the default
  - `topics` (text, nullable) — override topics text; null means use the default
  - `standard` (text, nullable) — override standard text; null means use the default
  - `note` (text, nullable) — override note text; null means use the default
  - `draft` (boolean, nullable) — override draft flag; null means use the default
  - `optional` (boolean, nullable) — override optional flag; null means use the default
  - `updated_at` (timestamptz, not null, defaults to now())
  - Primary key: (user_id, course_id, lesson_n)
2. Security
- Enable Row Level Security on `lesson_overrides`.
- Four separate owner-scoped policies (SELECT/INSERT/UPDATE/DELETE), each restricted to `TO authenticated` with `auth.uid() = user_id`.
- No access for the anon role.
3. Notes
- A null column means "use the built-in default value." This lets users override only the fields they changed (e.g. just the deck URL) without touching the rest.
- Lesson numbers are immutable: the app never adds, deletes, or reorders lessons. Logged sessions reference lessons by number.
*/

CREATE TABLE IF NOT EXISTS public.lesson_overrides (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id text NOT NULL,
  lesson_n int NOT NULL,
  title text,
  deck text,
  topics text,
  standard text,
  note text,
  draft boolean,
  optional boolean,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id, lesson_n)
);

ALTER TABLE public.lesson_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_lesson_overrides" ON public.lesson_overrides;
CREATE POLICY "select_own_lesson_overrides"
ON public.lesson_overrides FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_lesson_overrides" ON public.lesson_overrides;
CREATE POLICY "insert_own_lesson_overrides"
ON public.lesson_overrides FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_lesson_overrides" ON public.lesson_overrides;
CREATE POLICY "update_own_lesson_overrides"
ON public.lesson_overrides FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_lesson_overrides" ON public.lesson_overrides;
CREATE POLICY "delete_own_lesson_overrides"
ON public.lesson_overrides FOR DELETE
TO authenticated
USING (auth.uid() = user_id);