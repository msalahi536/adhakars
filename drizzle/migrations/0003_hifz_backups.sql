CREATE TABLE public.hifz_backups (
  user_id uuid PRIMARY KEY,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hifz_backups TO authenticated;
GRANT ALL ON public.hifz_backups TO service_role;
ALTER TABLE public.hifz_backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own hifz select" ON public.hifz_backups FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own hifz insert" ON public.hifz_backups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own hifz update" ON public.hifz_backups FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own hifz delete" ON public.hifz_backups FOR DELETE TO authenticated USING (auth.uid() = user_id);