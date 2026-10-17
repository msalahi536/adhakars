CREATE TABLE public.giveaway_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE,
  email text NOT NULL,
  goals text[] NOT NULL DEFAULT '{}',
  tickets integer NOT NULL DEFAULT 1,
  surahs integer NOT NULL DEFAULT 0,
  dhikr integer NOT NULL DEFAULT 0,
  referrals integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.giveaway_entries TO service_role;
ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.giveaway_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code text NOT NULL,
  visitor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ref_code, visitor_id)
);
GRANT ALL ON public.giveaway_referrals TO service_role;
ALTER TABLE public.giveaway_referrals ENABLE ROW LEVEL SECURITY;