-- Add price field to events table
ALTER TABLE public.events 
ADD COLUMN price_cents INTEGER DEFAULT 2600; -- Default to $26.00

-- Add comment for clarity
COMMENT ON COLUMN public.events.price_cents IS 'Event price in cents (e.g., 2600 = $26.00)';