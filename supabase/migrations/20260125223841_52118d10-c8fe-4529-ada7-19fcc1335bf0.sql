-- Drop and recreate public_profiles view to add banner_position_y
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
SELECT 
    id,
    user_id,
    username,
    full_name,
    avatar_url,
    banner_url,
    banner_position_y,
    background_url,
    bio,
    website,
    social_links,
    verified,
    is_creator,
    is_editor,
    is_seller,
    show_recent_uploads,
    global_font,
    global_custom_font,
    editor_about,
    editor_city,
    editor_country,
    editor_hourly_rate_cents,
    editor_languages,
    editor_services,
    editor_social_links,
    created_at,
    updated_at,
    (EXISTS ( SELECT 1
           FROM user_roles ur
          WHERE ur.user_id = p.user_id AND ur.role = 'owner'::app_role)) AS is_owner
FROM profiles p;