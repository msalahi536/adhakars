CREATE TABLE public.hifz_sample_consents (
 user_id uuid PRIMARY KEY, consented_at timestamptz NOT NULL DEFAULT now(), adult_confirmed boolean NOT NULL DEFAULT false
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hifz_sample_consents TO authenticated;
GRANT ALL ON public.hifz_sample_consents TO service_role;
ALTER TABLE public.hifz_sample_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own consent read" ON public.hifz_sample_consents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own adult consent insert" ON public.hifz_sample_consents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND adult_confirmed);
CREATE POLICY "Own adult consent update" ON public.hifz_sample_consents FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND adult_confirmed);
CREATE POLICY "Own consent delete" ON public.hifz_sample_consents FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.hifz_samples (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, path text NOT NULL UNIQUE,
 passages jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), note text NOT NULL DEFAULT '', consented_at timestamptz NOT NULL
);
GRANT SELECT, INSERT, DELETE ON public.hifz_samples TO authenticated;
GRANT ALL ON public.hifz_samples TO service_role;
ALTER TABLE public.hifz_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own samples read for deletion" ON public.hifz_samples FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own adult samples insert" ON public.hifz_samples FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND split_part(path, '/', 1) = auth.uid()::text AND char_length(note) <= 200 AND EXISTS (SELECT 1 FROM public.hifz_sample_consents c WHERE c.user_id = auth.uid() AND c.adult_confirmed AND c.consented_at = hifz_samples.consented_at));
CREATE POLICY "Own samples delete" ON public.hifz_samples FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Adult sample upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hifz-samples' AND (storage.foldername(name))[1] = auth.uid()::text AND EXISTS (SELECT 1 FROM public.hifz_sample_consents c WHERE c.user_id = auth.uid() AND c.adult_confirmed));
CREATE POLICY "Own sample files read for deletion" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'hifz-samples' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own sample files delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hifz-samples' AND (storage.foldername(name))[1] = auth.uid()::text);