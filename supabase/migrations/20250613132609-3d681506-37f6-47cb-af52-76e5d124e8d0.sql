
-- Create direct_messages table for DM chat between connections
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID REFERENCES public.connections(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create location_shares table for real-time location sharing during events
CREATE TABLE public.location_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS on new tables
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for direct_messages
CREATE POLICY "Users can view messages in their connections" ON public.direct_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.connections 
    WHERE id = direct_messages.connection_id 
    AND (requester_id = auth.uid() OR addressee_id = auth.uid())
    AND status = 'accepted'
  )
);

CREATE POLICY "Connected users can send messages" ON public.direct_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.connections 
    WHERE id = direct_messages.connection_id 
    AND (requester_id = auth.uid() OR addressee_id = auth.uid())
    AND status = 'accepted'
  )
);

-- RLS Policies for location_shares
CREATE POLICY "Event attendees can view location shares" ON public.location_shares FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.event_attendees 
    WHERE event_id = location_shares.event_id AND user_id = auth.uid()
  ) AND expires_at > now()
);

CREATE POLICY "Users can share their own location" ON public.location_shares FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.event_attendees 
    WHERE event_id = location_shares.event_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own location" ON public.location_shares FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own location" ON public.location_shares FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for direct messages and location shares
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

ALTER TABLE public.location_shares REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_shares;

-- Add date_of_birth column to profiles if it doesn't exist (needed for age-based matching)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
