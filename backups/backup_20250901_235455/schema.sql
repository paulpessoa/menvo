

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."user_role" AS ENUM (
    'pending',
    'mentee',
    'mentor',
    'admin',
    'volunteer',
    'moderator'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."user_status" AS ENUM (
    'pending',
    'active',
    'suspended',
    'rejected'
);


ALTER TYPE "public"."user_status" OWNER TO "postgres";


CREATE TYPE "public"."verification_status" AS ENUM (
    'pending',
    'pending_validation',
    'active',
    'rejected'
);


ALTER TYPE "public"."verification_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
    claims jsonb;
    user_id_val UUID;
    profile_record RECORD;
    user_permissions TEXT[];
BEGIN
    -- Extract user ID from event
    user_id_val := (event->>'user_id')::UUID;
    
    -- Get comprehensive user profile information
    SELECT 
        p.role::TEXT as role,
        p.status::TEXT as status,
        p.verification_status::TEXT as verification_status,
        p.first_name,
        p.last_name,
        p.full_name,
        p.avatar_url,
        p.is_available,
        p.verified_at
    INTO profile_record
    FROM public.profiles p
    WHERE p.id = user_id_val;
    
    -- Get user permissions
    SELECT public.get_user_permissions(user_id_val) INTO user_permissions;
    
    -- Build comprehensive custom claims
    claims := jsonb_build_object(
        'role', COALESCE(profile_record.role, 'pending'),
        'status', COALESCE(profile_record.status, 'pending'),
        'verification_status', COALESCE(profile_record.verification_status, 'pending'),
        'permissions', COALESCE(user_permissions, ARRAY[]::TEXT[]),
        'user_id', user_id_val,
        'first_name', profile_record.first_name,
        'last_name', profile_record.last_name,
        'full_name', profile_record.full_name,
        'avatar_url', profile_record.avatar_url,
        'is_available', COALESCE(profile_record.is_available, false),
        'verified_at', profile_record.verified_at
    );
    
    -- Merge with existing claims
    RETURN jsonb_set(event, '{claims}', (COALESCE(event->'claims', '{}'::jsonb)) || claims);
END;
$$;


ALTER FUNCTION "public"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_profile_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Only generate slug if not provided or empty
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        -- Generate base slug from full_name or email
        base_slug := LOWER(REGEXP_REPLACE(
            COALESCE(
                NULLIF(TRIM(NEW.first_name || ' ' || NEW.last_name), ''),
                SPLIT_PART(NEW.email, '@', 1)
            ), 
            '[^a-zA-Z0-9]+', '-', 'g'
        ));
        base_slug := TRIM(base_slug, '-');
        
        -- Ensure uniqueness
        final_slug := base_slug;
        WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = final_slug AND id != NEW.id) LOOP
            counter := counter + 1;
            final_slug := base_slug || '-' || counter;
        END LOOP;
        
        NEW.slug := final_slug;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_profile_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_permissions"("user_uuid" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_permissions TEXT[];
BEGIN
    SELECT ARRAY_AGG(DISTINCT p.name) INTO user_permissions
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_uuid;
    
    RETURN COALESCE(user_permissions, ARRAY[]::TEXT[]);
END;
$$;


ALTER FUNCTION "public"."get_user_permissions"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_metadata JSONB;
    first_name_val TEXT;
    last_name_val TEXT;
    user_type_val TEXT;
    user_role_val public.user_role;
    verification_status_val public.verification_status;
    role_record RECORD;
BEGIN
    -- Extract metadata
    user_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    
    -- Extract name information
    first_name_val := COALESCE(
        NULLIF(TRIM(user_metadata->>'first_name'), ''),
        NULLIF(TRIM(user_metadata->>'given_name'), ''),
        SPLIT_PART(COALESCE(NULLIF(TRIM(user_metadata->>'full_name'), ''), NEW.email), ' ', 1)
    );
    
    last_name_val := COALESCE(
        NULLIF(TRIM(user_metadata->>'last_name'), ''),
        NULLIF(TRIM(user_metadata->>'family_name'), ''),
        CASE 
            WHEN TRIM(user_metadata->>'full_name') != '' AND position(' ' in TRIM(user_metadata->>'full_name')) > 0
            THEN TRIM(SUBSTRING(TRIM(user_metadata->>'full_name') FROM position(' ' in TRIM(user_metadata->>'full_name')) + 1))
            ELSE 'User'
        END
    );
    
    -- Determine user type and role
    user_type_val := COALESCE(NULLIF(TRIM(user_metadata->>'user_type'), ''), 'pending');
    
    CASE user_type_val
        WHEN 'mentor' THEN 
            user_role_val := 'mentor'::public.user_role;
            verification_status_val := 'pending_validation'::public.verification_status;
        WHEN 'mentee' THEN 
            user_role_val := 'mentee'::public.user_role;
            verification_status_val := 'active'::public.verification_status;
        WHEN 'admin' THEN 
            user_role_val := 'admin'::public.user_role;
            verification_status_val := 'active'::public.verification_status;
        WHEN 'volunteer' THEN 
            user_role_val := 'volunteer'::public.user_role;
            verification_status_val := 'active'::public.verification_status;
        WHEN 'moderator' THEN 
            user_role_val := 'moderator'::public.user_role;
            verification_status_val := 'active'::public.verification_status;
        ELSE 
            user_role_val := 'pending'::public.user_role;
            verification_status_val := 'pending'::public.verification_status;
    END CASE;
    
    -- Insert profile
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        full_name,
        avatar_url,
        role,
        status,
        verification_status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        first_name_val,
        last_name_val,
        COALESCE(first_name_val || ' ' || last_name_val, first_name_val, last_name_val, NEW.email),
        user_metadata->>'avatar_url',
        user_role_val,
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN 'active'::public.user_status ELSE 'pending'::public.user_status END,
        verification_status_val,
        NOW(),
        NOW()
    );
    
    -- Assign role in user_roles table
    SELECT * INTO role_record FROM public.roles WHERE name = user_role_val::TEXT;
    IF role_record.id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id, is_primary, assigned_at)
        VALUES (NEW.id, role_record.id, true, NOW());
    END IF;
    
    -- Create validation request for mentors
    IF user_role_val = 'mentor'::public.user_role THEN
        INSERT INTO public.validation_requests (
            user_id,
            request_type,
            status,
            data,
            submitted_at
        ) VALUES (
            NEW.id,
            'mentor_verification',
            'pending',
            jsonb_build_object(
                'user_type', user_type_val,
                'registration_method', CASE WHEN user_metadata->>'provider' IS NOT NULL THEN 'oauth' ELSE 'email' END,
                'provider', user_metadata->>'provider'
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_all_user_metadata"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    profile_record RECORD;
    updated_count INTEGER := 0;
    metadata_update JSONB;
BEGIN
    -- Loop through all profiles and sync their metadata
    FOR profile_record IN 
        SELECT id, role, status, verification_status, first_name, last_name, full_name, avatar_url, updated_at
        FROM public.profiles
    LOOP
        -- Build metadata object
        metadata_update := jsonb_build_object(
            'role', profile_record.role::TEXT,
            'status', profile_record.status::TEXT,
            'verification_status', profile_record.verification_status::TEXT,
            'first_name', profile_record.first_name,
            'last_name', profile_record.last_name,
            'full_name', profile_record.full_name,
            'avatar_url', profile_record.avatar_url,
            'updated_at', profile_record.updated_at::TEXT
        );

        -- Update auth.users raw_user_meta_data
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || metadata_update
        WHERE id = profile_record.id;

        updated_count := updated_count + 1;
    END LOOP;

    RETURN updated_count;
END;
$$;


ALTER FUNCTION "public"."sync_all_user_metadata"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_user_metadata"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    metadata_update JSONB;
BEGIN
    -- Build metadata object with profile information
    metadata_update := jsonb_build_object(
        'role', NEW.role::TEXT,
        'status', NEW.status::TEXT,
        'verification_status', NEW.verification_status::TEXT,
        'first_name', NEW.first_name,
        'last_name', NEW.last_name,
        'full_name', NEW.full_name,
        'avatar_url', NEW.avatar_url,
        'updated_at', NEW.updated_at::TEXT
    );

    -- Update auth.users raw_user_meta_data
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || metadata_update
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_user_metadata"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_permission"("user_uuid" "uuid", "permission_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    has_permission BOOLEAN := false;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = user_uuid 
        AND p.name = permission_name
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$;


ALTER FUNCTION "public"."user_has_permission"("user_uuid" "uuid", "permission_name" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "resource" "text" NOT NULL,
    "action" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "full_name" "text",
    "slug" "text",
    "avatar_url" "text",
    "bio" "text",
    "location" "text",
    "role" "public"."user_role" DEFAULT 'pending'::"public"."user_role" NOT NULL,
    "status" "public"."user_status" DEFAULT 'pending'::"public"."user_status" NOT NULL,
    "verification_status" "public"."verification_status" DEFAULT 'pending'::"public"."verification_status" NOT NULL,
    "expertise_areas" "text"[],
    "linkedin_url" "text",
    "github_url" "text",
    "website_url" "text",
    "is_available" boolean DEFAULT true,
    "timezone" "text",
    "verified_at" timestamp with time zone,
    "verification_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "display_name" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_system_role" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "is_primary" boolean DEFAULT true,
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."validation_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "request_type" "text" DEFAULT 'mentor_verification'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "data" "jsonb",
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "review_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."validation_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waiting_list" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "whatsapp" "text",
    "reason" "text" NOT NULL,
    "user_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "text",
    CONSTRAINT "check_waiting_list_required_fields" CHECK ((("email" IS NOT NULL) AND ("name" IS NOT NULL) AND ("reason" IS NOT NULL) AND ("type" IS NOT NULL) AND ("email" <> ''::"text") AND ("name" <> ''::"text") AND ("reason" <> ''::"text") AND ("type" <> ''::"text")))
);


ALTER TABLE "public"."waiting_list" OWNER TO "postgres";


ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_permission_id_key" UNIQUE ("role_id", "permission_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waiting_list"
    ADD CONSTRAINT "unique_waiting_list_email" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_id_key" UNIQUE ("user_id", "role_id");



ALTER TABLE ONLY "public"."validation_requests"
    ADD CONSTRAINT "validation_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waiting_list"
    ADD CONSTRAINT "waiting_list_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_profiles_slug" ON "public"."profiles" USING "btree" ("slug");



CREATE INDEX "idx_profiles_status" ON "public"."profiles" USING "btree" ("status");



CREATE INDEX "idx_profiles_verification_status" ON "public"."profiles" USING "btree" ("verification_status");



CREATE INDEX "idx_role_permissions_permission_id" ON "public"."role_permissions" USING "btree" ("permission_id");



CREATE INDEX "idx_role_permissions_role_id" ON "public"."role_permissions" USING "btree" ("role_id");



CREATE INDEX "idx_user_roles_is_primary" ON "public"."user_roles" USING "btree" ("is_primary");



CREATE INDEX "idx_user_roles_role_id" ON "public"."user_roles" USING "btree" ("role_id");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "idx_validation_requests_request_type" ON "public"."validation_requests" USING "btree" ("request_type");



CREATE INDEX "idx_validation_requests_status" ON "public"."validation_requests" USING "btree" ("status");



CREATE INDEX "idx_validation_requests_user_id" ON "public"."validation_requests" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "generate_profile_slug_trigger" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."generate_profile_slug"();



CREATE OR REPLACE TRIGGER "sync_user_metadata_trigger" AFTER INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_user_metadata"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_roles_updated_at" BEFORE UPDATE ON "public"."roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_validation_requests_updated_at" BEFORE UPDATE ON "public"."validation_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."validation_requests"
    ADD CONSTRAINT "validation_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."validation_requests"
    ADD CONSTRAINT "validation_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all profiles" ON "public"."profiles" USING ("public"."user_has_permission"("auth"."uid"(), 'admin_users'::"text"));



CREATE POLICY "Admins can manage user roles" ON "public"."user_roles" USING (("public"."user_has_permission"("auth"."uid"(), 'admin_users'::"text") OR "public"."user_has_permission"("auth"."uid"(), 'manage_roles'::"text")));



CREATE POLICY "Admins have full access" ON "public"."profiles" TO "admin" USING (true) WITH CHECK (true);



CREATE POLICY "Anonymous waiting list entry" ON "public"."waiting_list" FOR INSERT TO "anon" WITH CHECK ((("email" IS NOT NULL) AND ("name" IS NOT NULL) AND ("reason" IS NOT NULL) AND ("type" IS NOT NULL) AND (NOT (EXISTS ( SELECT 1
   FROM "public"."waiting_list" "waiting_list_1"
  WHERE ("waiting_list_1"."email" = "waiting_list_1"."email"))))));



CREATE POLICY "Authenticated users can view permissions" ON "public"."permissions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view role permissions" ON "public"."role_permissions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view roles" ON "public"."roles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Mentees can manage their own profile" ON "public"."profiles" TO "mentee" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Mentors can manage their own profile" ON "public"."profiles" TO "mentor" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Moderators can manage validation requests" ON "public"."validation_requests" USING (("public"."user_has_permission"("auth"."uid"(), 'admin_verifications'::"text") OR "public"."user_has_permission"("auth"."uid"(), 'moderate_verifications'::"text")));



CREATE POLICY "Moderators can update specific profile fields" ON "public"."profiles" FOR UPDATE TO "moderator" USING (true) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Moderators can view and update limited profiles" ON "public"."profiles" FOR SELECT TO "moderator" USING (true);



CREATE POLICY "Pending users can view own profile" ON "public"."profiles" FOR SELECT TO "pending" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Public can view verified mentor profiles" ON "public"."profiles" FOR SELECT USING ((("role" = 'mentor'::"public"."user_role") AND ("status" = 'active'::"public"."user_status") AND ("verification_status" = 'active'::"public"."verification_status")));



CREATE POLICY "Users can create own validation requests" ON "public"."validation_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own roles" ON "public"."user_roles" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own roles" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own validation requests" ON "public"."validation_requests" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "View waiting list" ON "public"."waiting_list" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Volunteers can view profiles" ON "public"."profiles" FOR SELECT TO "volunteer" USING (true);



ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."validation_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waiting_list" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";
GRANT USAGE ON SCHEMA "public" TO "mentor";
GRANT USAGE ON SCHEMA "public" TO "mentee";
GRANT USAGE ON SCHEMA "public" TO "pending";
GRANT USAGE ON SCHEMA "public" TO "volunteer";
GRANT USAGE ON SCHEMA "public" TO "admin";
GRANT USAGE ON SCHEMA "public" TO "moderator";

























































































































































REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."generate_profile_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_profile_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_profile_slug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_all_user_metadata"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_all_user_metadata"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_all_user_metadata"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_user_metadata"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_user_metadata"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_user_metadata"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_permission"("user_uuid" "uuid", "permission_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_permission"("user_uuid" "uuid", "permission_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_permission"("user_uuid" "uuid", "permission_name" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."profiles" TO "mentor";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."profiles" TO "mentee";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."profiles" TO "admin";
GRANT SELECT,UPDATE ON TABLE "public"."profiles" TO "moderator";
GRANT SELECT ON TABLE "public"."profiles" TO "volunteer";
GRANT SELECT ON TABLE "public"."profiles" TO "pending";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."validation_requests" TO "anon";
GRANT ALL ON TABLE "public"."validation_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."validation_requests" TO "service_role";



GRANT ALL ON TABLE "public"."waiting_list" TO "anon";
GRANT ALL ON TABLE "public"."waiting_list" TO "authenticated";
GRANT ALL ON TABLE "public"."waiting_list" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
