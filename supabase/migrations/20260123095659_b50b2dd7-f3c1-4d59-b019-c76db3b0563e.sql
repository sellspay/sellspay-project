-- Allow admins to delete editor applications (for removing expired rejected applications)
CREATE POLICY "Admins can delete applications"
ON public.editor_applications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));