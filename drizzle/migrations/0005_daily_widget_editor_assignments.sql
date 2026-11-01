CREATE TABLE public.widget_daily_assignments (
  date date NOT NULL,
  widget_type text NOT NULL CHECK (widget_type IN ('quran_verse', 'sunnah')),
  content jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (date, widget_type)
);
GRANT ALL ON public.widget_daily_assignments TO service_role;
ALTER TABLE public.widget_daily_assignments ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.widget_daily_assignments IS 'Private dated Quran/Sunnah overrides; existing widget rotation remains fallback. Managed only by session-verified daily editor.';