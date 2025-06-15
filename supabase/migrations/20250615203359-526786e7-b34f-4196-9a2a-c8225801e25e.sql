
-- Create event_payments table to track payment access for events
CREATE TABLE public.event_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  is_post_event BOOLEAN NOT NULL DEFAULT false,
  access_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS on event_payments table
ALTER TABLE public.event_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_payments
CREATE POLICY "Users can view their own payments" ON public.event_payments FOR SELECT USING (
  auth.uid() = user_id
);

CREATE POLICY "System can insert payments" ON public.event_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update payments" ON public.event_payments FOR UPDATE USING (true);
