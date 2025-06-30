
-- Create table to track profile views
CREATE TABLE public.profile_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id UUID NOT NULL,
  viewed_user_id UUID NOT NULL,
  event_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(viewer_id, viewed_user_id, event_id)
);

-- Add Row Level Security
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Create policies for profile views
CREATE POLICY "Users can view profile views where they are involved" 
  ON public.profile_views 
  FOR SELECT 
  USING (viewer_id = auth.uid() OR viewed_user_id = auth.uid());

CREATE POLICY "Users can insert their own profile views" 
  ON public.profile_views 
  FOR INSERT 
  WITH CHECK (viewer_id = auth.uid());

-- Create table for terms and conditions acceptance
CREATE TABLE public.terms_acceptance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  terms_type TEXT NOT NULL CHECK (terms_type IN ('messaging', 'location_sharing')),
  accepted BOOLEAN NOT NULL DEFAULT false,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, terms_type)
);

-- Add Row Level Security for terms acceptance
ALTER TABLE public.terms_acceptance ENABLE ROW LEVEL SECURITY;

-- Create policies for terms acceptance
CREATE POLICY "Users can view their own terms acceptance" 
  ON public.terms_acceptance 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own terms acceptance" 
  ON public.terms_acceptance 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own terms acceptance" 
  ON public.terms_acceptance 
  FOR UPDATE 
  USING (user_id = auth.uid());
