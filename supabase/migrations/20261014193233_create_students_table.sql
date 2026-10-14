/*
# Create students table (multi-user, owner-scoped)

1. New Tables
- `public.students`
  - `id` (text, not null) — the app-generated student identifier (from uid())
  - `user_id` (uuid, not null, defaults to auth.uid()) — owner, references auth.users(id) ON DELETE CASCADE
  - `data` (jsonb, not null) — the full Student object (logs, knowledge test, metadata) as JSON
  - `updated_at` (timestamptz, not null, defaults to now()) — last write timestamp
  - Primary key: (user_id, id)
2. Security
- Enable Row Level Security on `students`.
- Four separate owner-scoped policies (SELECT/INSERT/UPDATE/DELETE), each restricted to `TO authenticated` with `auth.uid() = user_id`.
- No access for the anon role.
3. Notes
- The `user_id` column has `DEFAULT auth.uid()` so frontend inserts that omit `user_id` still satisfy the INSERT policy's WITH CHECK.
- Each student is stored as a single JSONB row rather than normalized child tables; this preserves the existing `Student` shape exactly (logs included).
*/

CREATE TABLE IF NOT EXISTS public.students (
  id text NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_students" ON public.students;
CREATE POLICY "select_own_students"
ON public.students FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_students" ON public.students;
CREATE POLICY "insert_own_students"
ON public.students FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_students" ON public.students;
CREATE POLICY "update_own_students"
ON public.students FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_students" ON public.students;
CREATE POLICY "delete_own_students"
ON public.students FOR DELETE
TO authenticated
USING (auth.uid() = user_id);