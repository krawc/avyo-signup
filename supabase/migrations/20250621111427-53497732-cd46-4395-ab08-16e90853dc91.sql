
-- Clear existing location shares data to avoid null constraint violation
DELETE FROM public.location_shares;

-- Drop existing RLS policies that depend on event_id
DROP POLICY IF EXISTS "Event attendees can view location shares" ON public.location_shares;
DROP POLICY IF EXISTS "Users can share their own location" ON public.location_shares;
DROP POLICY IF EXISTS "Users can update their own location" ON public.location_shares;
DROP POLICY IF EXISTS "Users can delete their own location" ON public.location_shares;

-- Update location_shares table to include connection_id instead of event_id
ALTER TABLE public.location_shares 
DROP COLUMN event_id,
ADD COLUMN connection_id UUID NOT NULL;

-- Add foreign key constraint to connections table
ALTER TABLE public.location_shares 
ADD CONSTRAINT location_shares_connection_id_fkey 
FOREIGN KEY (connection_id) REFERENCES public.connections(id) ON DELETE CASCADE;

-- Update the unique constraint to be per connection instead of per event
ALTER TABLE public.location_shares 
DROP CONSTRAINT IF EXISTS location_shares_user_id_event_id_key;

ALTER TABLE public.location_shares 
ADD CONSTRAINT location_shares_user_id_connection_id_key 
UNIQUE (user_id, connection_id);

-- Create new RLS policies for location_shares
CREATE POLICY "Users can view location shares in their connections" 
  ON public.location_shares 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.connections c 
      WHERE c.id = location_shares.connection_id 
      AND (c.requester_id = auth.uid() OR c.addressee_id = auth.uid())
      AND c.status = 'accepted'
    )
  );

CREATE POLICY "Users can create location shares for their connections" 
  ON public.location_shares 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.connections c 
      WHERE c.id = location_shares.connection_id 
      AND (c.requester_id = auth.uid() OR c.addressee_id = auth.uid())
      AND c.status = 'accepted'
    )
  );

CREATE POLICY "Users can update their own location shares" 
  ON public.location_shares 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own location shares" 
  ON public.location_shares 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Ensure replica identity is set (this is idempotent)
ALTER TABLE public.location_shares REPLICA IDENTITY FULL;
