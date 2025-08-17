-- Quick check to see what we have in the remote database
SELECT 'Tables' as type, COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public';
SELECT 'Functions' as type, COUNT(*) as count FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public';
SELECT 'Roles' as type, COUNT(*) as count FROM public.roles;
SELECT 'Permissions' as type, COUNT(*) as count FROM public.permissions;