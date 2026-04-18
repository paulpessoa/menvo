-- Script de correção manual: Remover avatar indevido do usuário admin
UPDATE public.profiles 
SET avatar_url = NULL 
WHERE email = 'admin@menvo.com.br';
