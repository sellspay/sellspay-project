-- Create the restore_project_version RPC function
-- This handles "time travel" by deleting all messages after a given point
-- and returning the code snapshot from that point

CREATE OR REPLACE FUNCTION public.restore_project_version(
  p_project_id uuid,
  p_message_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_target_created_at timestamptz;
  v_snapshot text;
  v_user_id uuid;
BEGIN
  -- Get the current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify the project belongs to the current user
  IF NOT EXISTS (
    SELECT 1 FROM vibecoder_projects
    WHERE id = p_project_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Project not found or unauthorized';
  END IF;

  -- 1. Get the target timestamp and code snapshot
  SELECT created_at, code_snapshot 
  INTO v_target_created_at, v_snapshot
  FROM vibecoder_messages
  WHERE id = p_message_id AND project_id = p_project_id;

  IF v_target_created_at IS NULL THEN
    RAISE EXCEPTION 'Target version not found';
  END IF;

  -- 2. Delete everything AFTER that timestamp
  DELETE FROM vibecoder_messages
  WHERE project_id = p_project_id
  AND created_at > v_target_created_at;

  RETURN v_snapshot;
END;
$$;