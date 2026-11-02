GRANT SELECT, INSERT, DELETE ON public.hifz_samples TO authenticated;
GRANT ALL ON public.hifz_samples TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hifz_sample_consents TO authenticated;
GRANT ALL ON public.hifz_sample_consents TO service_role;
ALTER TABLE public.hifz_samples ADD COLUMN IF NOT EXISTS sura integer, ADD COLUMN IF NOT EXISTS first_ayah integer, ADD COLUMN IF NOT EXISTS last_ayah integer, ADD COLUMN IF NOT EXISTS consent_at timestamptz, ADD COLUMN IF NOT EXISTS file_path text;
UPDATE public.hifz_samples SET consent_at = consented_at, file_path = path, sura = (passages->0->>'sura')::integer, first_ayah = (passages->0->>'first')::integer, last_ayah = (passages->0->>'last')::integer WHERE consent_at IS NULL;
CREATE OR REPLACE FUNCTION public.validate_hifz_report_metadata() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN IF NEW.sura IS NULL OR NEW.sura < 1 OR NEW.sura > 114 OR NEW.first_ayah IS NULL OR NEW.first_ayah < 1 OR NEW.last_ayah IS NULL OR NEW.last_ayah < NEW.first_ayah OR NEW.last_ayah > 286 OR NEW.file_path IS DISTINCT FROM NEW.path OR NEW.consent_at IS DISTINCT FROM NEW.consented_at THEN RAISE EXCEPTION 'Invalid report metadata'; END IF; RETURN NEW; END; $$;
CREATE TRIGGER validate_hifz_report_metadata BEFORE INSERT ON public.hifz_samples FOR EACH ROW EXECUTE FUNCTION public.validate_hifz_report_metadata();