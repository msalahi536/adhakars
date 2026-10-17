CREATE TABLE public.isnad_names (ar text PRIMARY KEY, en text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.isnad_names TO anon, authenticated;
GRANT ALL ON public.isnad_names TO service_role;
ALTER TABLE public.isnad_names ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read narrator names" ON public.isnad_names FOR SELECT TO anon, authenticated USING (true);