-- Add RLS policy allowing users to update their own editor applications
CREATE POLICY "Users can update their own applications"
ON public.editor_applications
FOR UPDATE
TO authenticated
USING (user_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
))
WITH CHECK (user_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));