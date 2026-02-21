CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id,
    user_id,
    username,
    full_name,
    avatar_url,
    banner_url,
    bio,
    is_creator,
    is_editor,
    verified,
    website,
    social_links,
    created_at,
    creator_tags,
    editor_hourly_rate_cents,
    editor_about,
    editor_city,
    editor_country,
    editor_languages,
    editor_services,
    editor_social_links,
    (EXISTS ( SELECT 1
           FROM user_roles ur
          WHERE ((ur.user_id = p.user_id) AND (ur.role = 'owner'::app_role)))) AS is_owner
   FROM profiles p
  WHERE ((is_creator = true) OR (is_seller = true) OR (verified = true) OR (is_editor = true));