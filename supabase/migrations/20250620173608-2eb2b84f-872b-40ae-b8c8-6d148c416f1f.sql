
-- Create a table to track user responses to matches
CREATE TABLE public.match_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  response TEXT NOT NULL CHECK (response IN ('yes', 'no')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id, target_user_id)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.match_responses ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view responses involving them
CREATE POLICY "Users can view their own match responses" 
  ON public.match_responses 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = target_user_id);

-- Create policy that allows users to create their own responses
CREATE POLICY "Users can create their own match responses" 
  ON public.match_responses 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own responses
CREATE POLICY "Users can update their own match responses" 
  ON public.match_responses 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create a view for mutual matches (when both users said yes)
CREATE VIEW public.mutual_matches AS
SELECT DISTINCT
  r1.event_id,
  r1.user_id AS user1_id,
  r1.target_user_id AS user2_id,
  r1.created_at AS match_date
FROM match_responses r1
JOIN match_responses r2 ON (
  r1.event_id = r2.event_id AND
  r1.user_id = r2.target_user_id AND
  r1.target_user_id = r2.user_id AND
  r1.response = 'yes' AND
  r2.response = 'yes'
)
WHERE r1.user_id < r1.target_user_id; -- Avoid duplicates

-- Add RLS to the view
ALTER VIEW public.mutual_matches SET (security_invoker = true);

-- Enable realtime for match_responses table
ALTER TABLE public.match_responses REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_responses;
