
-- 1. Create a trigger function to prevent duplicate consecutive messages
CREATE OR REPLACE FUNCTION public.prevent_duplicate_vibecoder_message()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  recent_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.vibecoder_messages
    WHERE project_id = NEW.project_id
      AND role = NEW.role
      AND content IS NOT DISTINCT FROM NEW.content
      AND (code_snapshot IS NOT NULL) = (NEW.code_snapshot IS NOT NULL)
      AND created_at > now() - interval '5 seconds'
  ) INTO recent_exists;

  IF recent_exists THEN
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Attach the trigger
DROP TRIGGER IF EXISTS prevent_duplicate_vibecoder_message_trigger ON public.vibecoder_messages;
CREATE TRIGGER prevent_duplicate_vibecoder_message_trigger
  BEFORE INSERT ON public.vibecoder_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_vibecoder_message();

-- 3. Clean up existing duplicate messages (keep oldest per group by created_at)
DELETE FROM public.vibecoder_messages
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, role, content, (code_snapshot IS NOT NULL))
    id
  FROM public.vibecoder_messages
  ORDER BY project_id, role, content, (code_snapshot IS NOT NULL), created_at ASC
);
