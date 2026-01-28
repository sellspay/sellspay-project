-- Update admin notification trigger to include a concise change summary for editor application re-reviews
CREATE OR REPLACE FUNCTION public.notify_admin_on_editor_application_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_username text;
  v_message text;
  v_changes text := '';
  v_old_rate numeric;
  v_new_rate numeric;
  v_old_city text;
  v_new_city text;
  v_old_country text;
  v_new_country text;
BEGIN
  -- Only trigger when status becomes 'pending'
  IF NEW.status = 'pending' THEN
    -- Get the username from the profile
    SELECT username INTO v_username
    FROM public.profiles
    WHERE id = NEW.user_id;

    IF TG_OP = 'INSERT' THEN
      v_message := 'New editor application from @' || COALESCE(v_username, 'unknown');
    ELSE
      -- Build change summary (only include fields that actually changed)
      v_old_city := NULLIF(OLD.city, '');
      v_new_city := NULLIF(NEW.city, '');
      v_old_country := NULLIF(OLD.country, '');
      v_new_country := NULLIF(NEW.country, '');

      IF (v_old_city IS DISTINCT FROM v_new_city) OR (v_old_country IS DISTINCT FROM v_new_country) THEN
        v_changes := v_changes || CASE WHEN v_changes <> '' THEN ', ' ELSE '' END ||
          'location ' ||
          COALESCE(v_old_city, '—') ||
          CASE WHEN v_old_country IS NOT NULL THEN ', ' || v_old_country ELSE '' END ||
          ' → ' ||
          COALESCE(v_new_city, '—') ||
          CASE WHEN v_new_country IS NOT NULL THEN ', ' || v_new_country ELSE '' END;
      END IF;

      v_old_rate := COALESCE(OLD.hourly_rate_cents, 0) / 100.0;
      v_new_rate := COALESCE(NEW.hourly_rate_cents, 0) / 100.0;
      IF OLD.hourly_rate_cents IS DISTINCT FROM NEW.hourly_rate_cents THEN
        v_changes := v_changes || CASE WHEN v_changes <> '' THEN ', ' ELSE '' END ||
          'rate $' || trim(to_char(v_old_rate, 'FM999990')) || '/hr → $' || trim(to_char(v_new_rate, 'FM999990')) || '/hr';
      END IF;

      IF v_changes = '' THEN
        v_message := 'Editor application updated by @' || COALESCE(v_username, 'unknown') || ' - needs re-review';
      ELSE
        v_message := 'Editor application updated by @' || COALESCE(v_username, 'unknown') || ' (' || v_changes || ') - needs re-review';
      END IF;
    END IF;

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
$function$;