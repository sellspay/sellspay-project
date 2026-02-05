-- 1. Add active_project_id to profiles to track which project is currently live
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS active_project_id uuid REFERENCES public.vibecoder_projects(id) ON DELETE SET NULL;

-- 2. Create the "Total Deletion" RPC function
-- This deletes the project AND clears the live store if this project was the active one
CREATE OR REPLACE FUNCTION public.delete_project_fully(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user who owns this project (for security check)
  SELECT user_id INTO v_user_id
  FROM public.vibecoder_projects
  WHERE id = p_project_id;

  -- Only proceed if the project exists and user matches
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Security: Ensure the caller owns this project
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to delete this project';
  END IF;

  -- 1. Wipe the Live Store IF it matches this project
  -- Set the profile back to 'classic' mode and clear the project link
  UPDATE public.profiles
  SET 
    active_project_id = NULL,
    active_storefront_mode = 'classic'
  WHERE active_project_id = p_project_id
    AND user_id = v_user_id;

  -- 2. Delete all messages for this project (cascades from FK but let's be explicit)
  DELETE FROM public.vibecoder_messages
  WHERE project_id = p_project_id;

  -- 3. Delete the project container itself
  DELETE FROM public.vibecoder_projects
  WHERE id = p_project_id;
END;
$$;

-- 3. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_project_fully(uuid) TO authenticated;