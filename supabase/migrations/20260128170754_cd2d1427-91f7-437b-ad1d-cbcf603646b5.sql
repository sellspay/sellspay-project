-- Create a function to notify admins when editor applications need review
CREATE OR REPLACE FUNCTION public.notify_admin_on_editor_application_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_username text;
  v_message text;
BEGIN
  -- Only trigger when status becomes 'pending'
  IF NEW.status = 'pending' THEN
    -- Get the username from the profile
    SELECT username INTO v_username
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Build message based on whether this is a new or updated application
    IF TG_OP = 'INSERT' THEN
      v_message := 'New editor application from @' || COALESCE(v_username, 'unknown');
    ELSE
      -- This is an update (re-submission for review)
      v_message := 'Editor application updated by @' || COALESCE(v_username, 'unknown') || ' - needs re-review';
    END IF;
    
    -- Create admin notification
    INSERT INTO public.admin_notifications (
      type,
      message,
      applicant_id,
      application_type,
      redirect_url
    ) VALUES (
      'editor_application',
      v_message,
      NEW.user_id,
      'editor',
      '/admin'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT (new applications)
DROP TRIGGER IF EXISTS on_editor_application_insert ON public.editor_applications;
CREATE TRIGGER on_editor_application_insert
  AFTER INSERT ON public.editor_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_editor_application_change();

-- Create trigger for UPDATE (when status changes to pending)
DROP TRIGGER IF EXISTS on_editor_application_status_pending ON public.editor_applications;
CREATE TRIGGER on_editor_application_status_pending
  AFTER UPDATE ON public.editor_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_admin_on_editor_application_change();