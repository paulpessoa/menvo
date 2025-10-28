drop policy "Authenticated users can send messages" on "public"."messages";

drop view if exists "public"."mentors_admin_view";

drop view if exists "public"."mentors_view";

drop index if exists "public"."idx_conversations_mentor_mentee";

drop index if exists "public"."idx_messages_conversation_created";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.cleanup_user_feedback()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
        BEGIN
            -- Log the cleanup operation
            RAISE LOG 'Cleaning up feedback for deleted user: %', OLD.id;
            
            -- Delete feedback by user_id (assumindo que feedback tem user_id)
            DELETE FROM public.feedback WHERE user_id = OLD.id;
            
            -- Log completion
            RAISE LOG 'Feedback cleanup completed for user: %', OLD.id;
            
            RETURN OLD;
        END;
        $function$
;

create or replace view "public"."mentors_admin_view" as  SELECT p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.full_name,
    p.bio,
    p.avatar_url,
    p.slug,
    p.verified,
    p.verified_at,
    p.created_at,
    p.updated_at,
    p.job_title AS current_position,
    p.company AS current_company,
    p.experience_years,
    p.linkedin_url,
    p.github_url,
    p.twitter_url,
    p.website_url,
    p.expertise_areas,
    p.expertise_areas AS mentor_skills,
    p.mentorship_topics,
    p.languages,
    p.inclusive_tags,
    p.inclusive_tags AS inclusion_tags,
    p.session_price_usd,
    p.availability_status,
    p.city,
    p.state,
    p.country,
    COALESCE(p.city, ''::text) AS location,
    p.timezone,
    COALESCE(p.average_rating, (0)::numeric) AS rating,
    COALESCE(p.total_reviews, 0) AS reviews,
    COALESCE(p.total_sessions, 0) AS sessions,
    p.average_rating,
    p.total_reviews,
    p.total_sessions,
    (p.availability_status = 'available'::text) AS is_available,
    60 AS session_duration,
    ARRAY['mentor'::text] AS active_roles,
    p.phone,
    p.age,
        CASE
            WHEN (p.verified = true) THEN 'verified'::text
            WHEN ((p.first_name IS NULL) OR (p.last_name IS NULL) OR (TRIM(BOTH FROM p.first_name) = ''::text) OR (TRIM(BOTH FROM p.last_name) = ''::text) OR (p.bio IS NULL) OR (length(TRIM(BOTH FROM p.bio)) = 0)) THEN 'incomplete_profile'::text
            ELSE 'pending_verification'::text
        END AS profile_status
   FROM ((profiles p
     JOIN user_roles ur ON ((p.id = ur.user_id)))
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE (r.name = 'mentor'::text);


create or replace view "public"."mentors_view" as  SELECT p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.full_name,
    p.bio,
    p.avatar_url,
    p.slug,
    p.verified,
    p.verified_at,
    p.created_at,
    p.updated_at,
    p.job_title AS current_position,
    p.company AS current_company,
    p.experience_years,
    p.linkedin_url,
    p.github_url,
    p.twitter_url,
    p.website_url,
    p.expertise_areas,
    p.expertise_areas AS mentor_skills,
    p.mentorship_topics,
    p.languages,
    p.inclusive_tags,
    p.inclusive_tags AS inclusion_tags,
    p.session_price_usd,
    p.availability_status,
    p.city,
    p.state,
    p.country,
    COALESCE(p.city, ''::text) AS location,
    p.timezone,
    COALESCE(p.average_rating, (0)::numeric) AS rating,
    COALESCE(p.total_reviews, 0) AS reviews,
    COALESCE(p.total_sessions, 0) AS sessions,
    p.average_rating,
    p.total_reviews,
    p.total_sessions,
    (p.availability_status = 'available'::text) AS is_available,
    60 AS session_duration,
    ARRAY['mentor'::text] AS active_roles,
    p.phone,
    p.age
   FROM ((profiles p
     JOIN user_roles ur ON ((p.id = ur.user_id)))
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((r.name = 'mentor'::text) AND (p.verified = true) AND (p.first_name IS NOT NULL) AND (p.last_name IS NOT NULL) AND (TRIM(BOTH FROM p.first_name) <> ''::text) AND (TRIM(BOTH FROM p.last_name) <> ''::text) AND (p.bio IS NOT NULL) AND (length(TRIM(BOTH FROM p.bio)) > 0));


CREATE OR REPLACE FUNCTION public.update_test_file_uploads_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_files_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;


  create policy "messages_insert_policy"
  on "public"."messages"
  as permissive
  for insert
  to authenticated
with check (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM conversations
  WHERE ((conversations.id = messages.conversation_id) AND ((conversations.mentee_id = auth.uid()) OR (conversations.mentor_id = auth.uid())))))));



  create policy "messages_select_policy"
  on "public"."messages"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM conversations
  WHERE ((conversations.id = messages.conversation_id) AND ((conversations.mentee_id = auth.uid()) OR (conversations.mentor_id = auth.uid()))))));



