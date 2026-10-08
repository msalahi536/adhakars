CREATE TABLE public.recitation_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  path text NOT NULL UNIQUE,
  url text NOT NULL,
  size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recitation_files TO anon, authenticated;
GRANT ALL ON public.recitation_files TO service_role;
ALTER TABLE public.recitation_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view recitation files" ON public.recitation_files FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.dhikr_recitations (
  dhikr_id text PRIMARY KEY,
  file_id uuid NOT NULL REFERENCES public.recitation_files(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dhikr_recitations TO anon, authenticated;
GRANT ALL ON public.dhikr_recitations TO service_role;
ALTER TABLE public.dhikr_recitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view card recitations" ON public.dhikr_recitations FOR SELECT TO anon, authenticated USING (true);