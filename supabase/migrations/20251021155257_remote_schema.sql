drop trigger if exists "update_user_roles_updated_at" on "public"."user_roles";

-- Drop trigger first, then function
drop trigger if exists "on_auth_user_deleted_cleanup_mentorship_sessions" on "auth"."users";

drop function if exists "public"."cleanup_mentorship_sessions"();


  create table "public"."user_files" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "original_name" text not null,
    "file_name" text not null,
    "file_size" bigint not null,
    "mime_type" text not null,
    "s3_key" text not null,
    "s3_url" text,
    "upload_status" text default 'completed'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."user_files" enable row level security;

CREATE INDEX idx_user_files_created_at ON public.user_files USING btree (created_at DESC);

CREATE INDEX idx_user_files_s3_key ON public.user_files USING btree (s3_key);

CREATE INDEX idx_user_files_user_id ON public.user_files USING btree (user_id);

CREATE UNIQUE INDEX user_files_pkey ON public.user_files USING btree (id);

CREATE UNIQUE INDEX user_files_s3_key_key ON public.user_files USING btree (s3_key);

alter table "public"."user_files" add constraint "user_files_pkey" PRIMARY KEY using index "user_files_pkey";

alter table "public"."user_files" add constraint "user_files_s3_key_key" UNIQUE using index "user_files_s3_key_key";

alter table "public"."user_files" add constraint "user_files_upload_status_check" CHECK ((upload_status = ANY (ARRAY['uploading'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."user_files" validate constraint "user_files_upload_status_check";

alter table "public"."user_files" add constraint "user_files_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_files" validate constraint "user_files_user_id_fkey";

set check_function_bodies = off;

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

grant delete on table "public"."user_files" to "anon";

grant insert on table "public"."user_files" to "anon";

grant references on table "public"."user_files" to "anon";

grant select on table "public"."user_files" to "anon";

grant trigger on table "public"."user_files" to "anon";

grant truncate on table "public"."user_files" to "anon";

grant update on table "public"."user_files" to "anon";

grant delete on table "public"."user_files" to "authenticated";

grant insert on table "public"."user_files" to "authenticated";

grant references on table "public"."user_files" to "authenticated";

grant select on table "public"."user_files" to "authenticated";

grant trigger on table "public"."user_files" to "authenticated";

grant truncate on table "public"."user_files" to "authenticated";

grant update on table "public"."user_files" to "authenticated";

grant delete on table "public"."user_files" to "service_role";

grant insert on table "public"."user_files" to "service_role";

grant references on table "public"."user_files" to "service_role";

grant select on table "public"."user_files" to "service_role";

grant trigger on table "public"."user_files" to "service_role";

grant truncate on table "public"."user_files" to "service_role";

grant update on table "public"."user_files" to "service_role";


  create policy "public_can_view_mentors_view"
  on "public"."profiles"
  as permissive
  for select
  to anon, authenticated
using (((verified = true) AND (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = profiles.id) AND (r.name = 'mentor'::text))))));



  create policy "Users can delete own files"
  on "public"."user_files"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own files"
  on "public"."user_files"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own files"
  on "public"."user_files"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own files"
  on "public"."user_files"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));


CREATE TRIGGER trigger_update_user_files_updated_at BEFORE UPDATE ON public.user_files FOR EACH ROW EXECUTE FUNCTION update_user_files_updated_at();


