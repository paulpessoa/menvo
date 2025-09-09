-- Listar todos os triggers ativos
SELECT 
    schemaname, 
    tablename, 
    triggername, 
    tgfoid::regproc as function_name 
FROM pg_trigger t 
JOIN pg_class c ON t.tgrelid = c.oid 
JOIN pg_namespace n ON c.relnamespace = n.oid 
WHERE n.nspname IN ('public', 'auth') 
AND NOT tgisinternal 
ORDER BY schemaname, tablename, triggername;
