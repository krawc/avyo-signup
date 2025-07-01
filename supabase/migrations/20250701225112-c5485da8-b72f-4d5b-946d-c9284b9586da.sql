
-- Allow authenticated users to create reports
CREATE POLICY "Authenticated users can create reports" 
ON public.reports 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = reporter_user_id);
