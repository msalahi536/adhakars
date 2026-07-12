
CREATE TABLE public.custom_adhkar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  arabic_text TEXT NOT NULL,
  transliteration TEXT,
  translation TEXT,
  source_reference TEXT,
  target_count INTEGER NOT NULL DEFAULT 1 CHECK (target_count >= 1 AND target_count <= 10000),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX custom_adhkar_user_sort_idx ON public.custom_adhkar (user_id, sort_order, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_adhkar TO authenticated;
GRANT ALL ON public.custom_adhkar TO service_role;

ALTER TABLE public.custom_adhkar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own custom adhkar"
  ON public.custom_adhkar FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own custom adhkar"
  ON public.custom_adhkar FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own custom adhkar"
  ON public.custom_adhkar FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own custom adhkar"
  ON public.custom_adhkar FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER custom_adhkar_set_updated_at
  BEFORE UPDATE ON public.custom_adhkar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
