SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '5ccb0055-d60b-4891-be62-98c777e7e369', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"a@b.com","user_id":"4e8ad30b-789d-473d-850f-013bff30533d","user_phone":""}}', '2025-08-16 22:34:29.805502+00', ''),
	('00000000-0000-0000-0000-000000000000', '82683a00-b5c3-4157-8ae5-2109cbbb1dfc', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"a@b.com","user_id":"4e8ad30b-789d-473d-850f-013bff30533d","user_phone":""}}', '2025-08-16 22:34:46.542229+00', ''),
	('00000000-0000-0000-0000-000000000000', '4179e628-5282-4a10-a620-a145f0817a69', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"paulmspessoa@gmail.com","user_id":"d1fbf28d-0507-4860-8dfd-c9e978a65442","user_phone":""}}', '2025-08-16 22:54:52.735197+00', ''),
	('00000000-0000-0000-0000-000000000000', '3022afdb-54fb-4612-98de-a8a9df73e899', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"paulmspessoa@gmail.com","user_id":"d1fbf28d-0507-4860-8dfd-c9e978a65442","user_phone":""}}', '2025-08-16 22:54:53.472282+00', ''),
	('00000000-0000-0000-0000-000000000000', '76436e10-2312-4197-9302-bc6fbf722b36', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"paulmspessoa@gmail.com","user_id":"a1386be2-e8a0-45c1-8c10-614126d2a545","user_phone":""}}', '2025-08-16 23:01:42.865841+00', ''),
	('00000000-0000-0000-0000-000000000000', '83210fec-7676-441a-8311-0901055c3ac1', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"paulmspessoa@gmail.com","user_id":"a1386be2-e8a0-45c1-8c10-614126d2a545","user_phone":""}}', '2025-08-16 23:01:43.684512+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b0c61a98-dfd8-4851-afac-f98da32a68a7', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"meri@meri.com","user_id":"c25c02c9-2e33-4729-8346-28d35f61fe1f","user_phone":""}}', '2025-08-16 23:03:55.714159+00', ''),
	('00000000-0000-0000-0000-000000000000', '8959e242-af73-40ce-a39e-bb4cf08a3a5a', '{"action":"login","actor_id":"c25c02c9-2e33-4729-8346-28d35f61fe1f","actor_username":"meri@meri.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-16 23:04:21.319893+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fcdc4d1d-4584-45e3-aabb-2154ea26f38a', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"demo@demo.com","user_id":"72c39edc-4c6c-4ab8-b80f-d48537896055","user_phone":""}}', '2025-08-16 23:09:29.752179+00', ''),
	('00000000-0000-0000-0000-000000000000', '23b4020d-8e8e-4713-b68e-f5908ffaa206', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"demo1@demo.com","user_id":"742fa6bc-f9e6-45b8-9b64-9e8ade2ec835","user_phone":""}}', '2025-08-16 23:10:49.794906+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b684a694-c4de-4294-9989-759f347f5207', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"demo1@demo.com","user_id":"742fa6bc-f9e6-45b8-9b64-9e8ade2ec835","user_phone":""}}', '2025-08-16 23:10:50.490382+00', ''),
	('00000000-0000-0000-0000-000000000000', '1a532803-1ccc-431a-98d7-beab0fac4a1f', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"demo1@demo.com","user_id":"4484330c-0f7f-44e6-85db-5009f709d764","user_phone":""}}', '2025-08-16 23:15:20.021945+00', ''),
	('00000000-0000-0000-0000-000000000000', '059a02a8-3f51-48f0-933e-b9c3b4caea1f', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"demo1@demo.com","user_id":"4484330c-0f7f-44e6-85db-5009f709d764","user_phone":""}}', '2025-08-16 23:15:20.996627+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ddbe30d0-2968-49f9-a29e-28000e0d0523', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"demo@demo.com","user_id":"72c39edc-4c6c-4ab8-b80f-d48537896055","user_phone":""}}', '2025-08-16 23:17:43.976016+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f4753e51-5ad0-4e88-9b1a-a5227b59defc', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"meri@meri.com","user_id":"c25c02c9-2e33-4729-8346-28d35f61fe1f","user_phone":""}}', '2025-08-16 23:17:43.978759+00', ''),
	('00000000-0000-0000-0000-000000000000', '401b65fd-e1b9-4c4a-bc31-c88c1c1cff5d', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"a@b.com","user_id":"ad0308de-1bd5-41b0-b713-d543a3c3080c","user_phone":""}}', '2025-08-16 23:23:20.597841+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a4ab907e-ff88-4c1a-b762-9b82bbc282df', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"a@b.com","user_id":"ad0308de-1bd5-41b0-b713-d543a3c3080c","user_phone":""}}', '2025-08-16 23:23:37.285973+00', ''),
	('00000000-0000-0000-0000-000000000000', '0d4ae01e-6634-41a5-b8be-112289d1d540', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"paulmspessoa@gmail.com","user_id":"7edce1bc-f984-40f9-a71f-d789b4ecfee0","user_phone":""}}', '2025-08-16 23:26:06.796615+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a6fd8872-e9af-4d92-9253-da2edd5c092c', '{"action":"user_confirmation_requested","actor_id":"7edce1bc-f984-40f9-a71f-d789b4ecfee0","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-16 23:27:07.718331+00', ''),
	('00000000-0000-0000-0000-000000000000', '0e9c4e48-29d7-4d9c-89e7-983d55204f9f', '{"action":"user_signedup","actor_id":"7edce1bc-f984-40f9-a71f-d789b4ecfee0","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-16 23:27:23.377153+00', ''),
	('00000000-0000-0000-0000-000000000000', '2fd532a3-3e9d-4590-bb14-6579f49a7710', '{"action":"login","actor_id":"7edce1bc-f984-40f9-a71f-d789b4ecfee0","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-16 23:27:41.863793+00', ''),
	('00000000-0000-0000-0000-000000000000', '6fb1056b-cee6-4b6a-81bf-bf540e3a63fa', '{"action":"user_recovery_requested","actor_id":"7edce1bc-f984-40f9-a71f-d789b4ecfee0","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"user"}', '2025-08-16 23:37:34.632045+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b509d4a7-a1f6-4d70-b67a-96e80c912133', '{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"mccartney.shalom@gmail.com","user_id":"939d3c0d-f086-47a7-a819-ba88073e0edf"}}', '2025-08-17 00:23:57.096613+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e9544919-74a7-4dd8-b126-d71105b8f0ca', '{"action":"user_signedup","actor_id":"939d3c0d-f086-47a7-a819-ba88073e0edf","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-17 00:24:28.63626+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e0327a97-1869-438d-ba11-d178295b4296', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"paulmspessoa@gmail.com","user_id":"7edce1bc-f984-40f9-a71f-d789b4ecfee0","user_phone":""}}', '2025-08-17 00:25:40.260727+00', ''),
	('00000000-0000-0000-0000-000000000000', '2b80df27-ac05-4239-bd94-c362a7ed525b', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"mccartney.shalom@gmail.com","user_id":"939d3c0d-f086-47a7-a819-ba88073e0edf","user_phone":""}}', '2025-08-17 00:25:42.889474+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a557c5bd-7deb-4cc2-89ba-84c9558206d7', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"paulmspessoa@gmail.com","user_id":"04c2873e-42e1-47df-8143-9f2e01d0918d","user_phone":""}}', '2025-08-17 01:03:30.93593+00', ''),
	('00000000-0000-0000-0000-000000000000', '2e3ae047-31a1-4c60-96db-b754ea226560', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"mccartney.shalom@gmail.com","user_id":"18beca7a-99e7-4c5a-9bc8-d40c061c6a8b","user_phone":""}}', '2025-08-17 01:05:31.879806+00', ''),
	('00000000-0000-0000-0000-000000000000', '9c3343fb-2e99-4818-a3e5-ccf343184ed3', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"mccartney.shalom@gmail.com","user_id":"18beca7a-99e7-4c5a-9bc8-d40c061c6a8b","user_phone":""}}', '2025-08-17 01:14:18.014773+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e010d56a-befe-4549-85e6-b47f8addc331', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"paulmspessoa@gmail.com","user_id":"04c2873e-42e1-47df-8143-9f2e01d0918d","user_phone":""}}', '2025-08-17 01:14:18.014878+00', ''),
	('00000000-0000-0000-0000-000000000000', '0f09e2bf-429a-4645-9235-cdf9ede490fb', '{"action":"user_confirmation_requested","actor_id":"1994c653-912b-4d01-9496-610732e4f550","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-17 01:17:03.376053+00', ''),
	('00000000-0000-0000-0000-000000000000', '78d22bda-ed2a-4e42-b50e-9f8048e24bb3', '{"action":"user_signedup","actor_id":"1994c653-912b-4d01-9496-610732e4f550","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-17 01:17:18.746917+00', ''),
	('00000000-0000-0000-0000-000000000000', '8d850949-8048-44fd-9c33-d59c514a9d7a', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"paulmspessoa@gmail.com","user_id":"1994c653-912b-4d01-9496-610732e4f550","user_phone":""}}', '2025-08-17 01:18:26.163376+00', ''),
	('00000000-0000-0000-0000-000000000000', 'edeb09d7-a01f-40d8-9ff9-3df1223cc640', '{"action":"user_confirmation_requested","actor_id":"653dbf96-9f87-4d3d-8ce1-c40238822df9","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-17 01:20:48.613027+00', ''),
	('00000000-0000-0000-0000-000000000000', '583cf026-b926-4c02-b3c4-2ddceaeae916', '{"action":"user_signedup","actor_id":"653dbf96-9f87-4d3d-8ce1-c40238822df9","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-17 01:22:04.59531+00', ''),
	('00000000-0000-0000-0000-000000000000', '53708f0d-6452-4c17-a104-2b784a4d8160', '{"action":"login","actor_id":"653dbf96-9f87-4d3d-8ce1-c40238822df9","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 01:25:39.625788+00', ''),
	('00000000-0000-0000-0000-000000000000', '3446a1a8-2cb9-4973-897d-680332d83dce', '{"action":"login","actor_id":"653dbf96-9f87-4d3d-8ce1-c40238822df9","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 01:27:47.599623+00', ''),
	('00000000-0000-0000-0000-000000000000', '6c592562-12dd-438f-9712-477a7e4cd6d7', '{"action":"user_confirmation_requested","actor_id":"c9a38bb9-31d0-402d-b7c6-b59cf5c0c3f5","actor_name":"Mai Con","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-17 01:28:55.235747+00', ''),
	('00000000-0000-0000-0000-000000000000', '95a00509-5c6e-4bd8-b0bd-cc60f2c47a44', '{"action":"user_signedup","actor_id":"c9a38bb9-31d0-402d-b7c6-b59cf5c0c3f5","actor_name":"Mai Con","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-17 01:31:24.667555+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f60fa607-bdec-46fd-ab43-a0be666dac69', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"paulmspessoa@gmail.com","user_id":"653dbf96-9f87-4d3d-8ce1-c40238822df9","user_phone":""}}', '2025-08-17 01:59:51.249571+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b9aa5837-dbd5-40d1-a36b-58b671b9e1fa', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"mccartney.shalom@gmail.com","user_id":"c9a38bb9-31d0-402d-b7c6-b59cf5c0c3f5","user_phone":""}}', '2025-08-17 01:59:51.249572+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e48b9929-c2e1-49fe-9fad-0118483fcb64', '{"action":"user_confirmation_requested","actor_id":"027b0648-8e84-4292-8cba-53da18d5a937","actor_name":"Men Vo","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-17 02:01:50.617931+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c9188bb0-7d5d-4e53-9d5d-737ca2905449', '{"action":"user_signedup","actor_id":"027b0648-8e84-4292-8cba-53da18d5a937","actor_name":"Men Vo","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-17 02:02:58.729898+00', ''),
	('00000000-0000-0000-0000-000000000000', '8c87cefa-fd49-4e6e-a80e-84a99dc61c9a', '{"action":"user_recovery_requested","actor_id":"027b0648-8e84-4292-8cba-53da18d5a937","actor_name":"Men Vo","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"user"}', '2025-08-17 02:13:22.818708+00', ''),
	('00000000-0000-0000-0000-000000000000', '11b919e9-505f-4f8d-9db8-0279773d568e', '{"action":"login","actor_id":"027b0648-8e84-4292-8cba-53da18d5a937","actor_name":"Men Vo","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-08-17 02:13:34.784706+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bee973f8-fea9-43fd-8e0e-96382ad5ca8e', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"paulmspessoa@gmail.com","user_id":"027b0648-8e84-4292-8cba-53da18d5a937","user_phone":""}}', '2025-08-17 02:16:27.584159+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd0af36b8-9c35-4ad3-8431-74c7c9cdb1f1', '{"action":"user_confirmation_requested","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Papa Pepe","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-17 02:32:23.298507+00', ''),
	('00000000-0000-0000-0000-000000000000', 'df3ab49a-4d56-4c90-9acc-41879c308e9b', '{"action":"user_signedup","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Papa Pepe","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-17 02:32:36.260931+00', ''),
	('00000000-0000-0000-0000-000000000000', '7a84b22f-709e-4bb6-86e9-7c46236e15bc', '{"action":"login","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-08-17 02:56:59.679989+00', ''),
	('00000000-0000-0000-0000-000000000000', '45709933-2015-42b4-88de-f8c9a384d35f', '{"action":"login","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-08-17 02:57:00.803794+00', ''),
	('00000000-0000-0000-0000-000000000000', '00caa854-f9ba-425d-9bd4-3a68281c2b42', '{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"contatoismaela@gmail.com","user_id":"b43816ad-7d50-4e7b-bbe1-b9cbab6e350a"}}', '2025-08-17 02:59:57.835758+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c734108c-9f5c-44cd-a8f8-c6f55f127544', '{"action":"user_confirmation_requested","actor_id":"15a8adc6-4f26-4008-bbe0-7dae63eb8cdd","actor_name":"Men Tor","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-17 03:00:37.823319+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a89c7391-46cd-4204-b75b-9e402511795e', '{"action":"user_signedup","actor_id":"15a8adc6-4f26-4008-bbe0-7dae63eb8cdd","actor_name":"Men Tor","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-17 03:00:47.712452+00', ''),
	('00000000-0000-0000-0000-000000000000', '0f5c3f11-4652-4f5b-97c6-3998d6bd5eab', '{"action":"login","actor_id":"15a8adc6-4f26-4008-bbe0-7dae63eb8cdd","actor_name":"Men Tor","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 03:01:19.189332+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fced1f2d-7aa3-4980-83e3-ca42d8a2dafa', '{"action":"login","actor_id":"15a8adc6-4f26-4008-bbe0-7dae63eb8cdd","actor_name":"Men Tor","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 03:03:51.12487+00', ''),
	('00000000-0000-0000-0000-000000000000', '453e0bec-25ca-4a23-b036-e921b9dd8e3c', '{"action":"login","actor_id":"15a8adc6-4f26-4008-bbe0-7dae63eb8cdd","actor_name":"Men Tor","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 03:19:16.916501+00', ''),
	('00000000-0000-0000-0000-000000000000', '8f75d19c-6214-411f-b159-8d7648981153', '{"action":"login","actor_id":"15a8adc6-4f26-4008-bbe0-7dae63eb8cdd","actor_name":"Men Tor","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 03:35:23.361685+00', ''),
	('00000000-0000-0000-0000-000000000000', '507fecac-9f3a-44dc-a125-9fc45004bea8', '{"action":"login","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-08-17 03:37:40.59967+00', ''),
	('00000000-0000-0000-0000-000000000000', '6793d44b-e20c-4715-b9b4-ff2c09274a07', '{"action":"login","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-08-17 03:37:41.79486+00', ''),
	('00000000-0000-0000-0000-000000000000', '73f0b7f1-bcac-4e1f-88bd-bc9fab6041e9', '{"action":"login","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"linkedin_oidc"}}', '2025-08-17 03:40:02.437979+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fa2f07fb-7093-428c-80f0-ca3e06040711', '{"action":"login","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"linkedin_oidc"}}', '2025-08-17 03:40:03.337063+00', ''),
	('00000000-0000-0000-0000-000000000000', '149ebbab-8d6b-415a-be07-977a5a536b0c', '{"action":"login","actor_id":"15a8adc6-4f26-4008-bbe0-7dae63eb8cdd","actor_name":"Men Tor","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 03:44:50.544245+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ad77f69e-553b-4471-b895-01b806ccd45f', '{"action":"login","actor_id":"15a8adc6-4f26-4008-bbe0-7dae63eb8cdd","actor_name":"Men Tor","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 03:59:19.022705+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a63bb9e4-ddbd-4058-b56e-0e7c1f6b4f2f', '{"action":"login","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 04:01:28.496485+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a54fb559-07c4-4ef9-b946-3cf37509042d', '{"action":"login","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 04:03:36.799951+00', ''),
	('00000000-0000-0000-0000-000000000000', 'eea240db-f58d-4701-9512-49cfdad8ba7a', '{"action":"login","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 04:12:48.747646+00', ''),
	('00000000-0000-0000-0000-000000000000', '1a3141f8-4fa7-4be2-829b-2d842a1691d4', '{"action":"login","actor_id":"15a8adc6-4f26-4008-bbe0-7dae63eb8cdd","actor_name":"Men Tor","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 04:33:19.354428+00', ''),
	('00000000-0000-0000-0000-000000000000', '0712abf0-2b71-47d5-ac3f-975c803df656', '{"action":"login","actor_id":"15a8adc6-4f26-4008-bbe0-7dae63eb8cdd","actor_name":"Men Tor","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 13:19:59.058615+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd56745f0-12fc-4b6a-941d-4e0d8bf6bc0e', '{"action":"user_confirmation_requested","actor_id":"f9e202c4-9c00-443b-ad1e-51993aa87f72","actor_name":"Joao da Silva","actor_username":"a@a.me","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-17 13:32:40.151843+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a3a9558a-52bc-440f-ab77-1098f2087844', '{"action":"user_signedup","actor_id":"b43816ad-7d50-4e7b-bbe1-b9cbab6e350a","actor_name":"Ismaela Silva","actor_username":"contatoismaela@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2025-08-17 15:30:42.616159+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cf20a8bf-ae5a-484f-bb56-2eaf3190b0ec', '{"action":"login","actor_id":"b43816ad-7d50-4e7b-bbe1-b9cbab6e350a","actor_name":"Ismaela Silva","actor_username":"contatoismaela@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-08-17 15:30:43.558554+00', ''),
	('00000000-0000-0000-0000-000000000000', '568287c9-d79e-4745-918f-3cdf5b9f27a2', '{"action":"token_refreshed","actor_id":"15a8adc6-4f26-4008-bbe0-7dae63eb8cdd","actor_name":"Men Tor","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-17 17:00:53.671057+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fc5af13c-d5e1-474d-9c7a-f388261fa9f5', '{"action":"token_revoked","actor_id":"15a8adc6-4f26-4008-bbe0-7dae63eb8cdd","actor_name":"Men Tor","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-17 17:00:53.676177+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bd604eb7-3a4d-43ca-bf0b-ad214d5364b8', '{"action":"login","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 17:37:50.652582+00', ''),
	('00000000-0000-0000-0000-000000000000', '5ee09f98-4776-4b2a-908e-9b2503bc633b', '{"action":"token_refreshed","actor_id":"15a8adc6-4f26-4008-bbe0-7dae63eb8cdd","actor_name":"Men Tor","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-17 18:04:47.740118+00', ''),
	('00000000-0000-0000-0000-000000000000', '1fdbfe94-b720-49ed-8d16-2eb8f8872305', '{"action":"token_revoked","actor_id":"15a8adc6-4f26-4008-bbe0-7dae63eb8cdd","actor_name":"Men Tor","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-17 18:04:47.744277+00', ''),
	('00000000-0000-0000-0000-000000000000', '967b0e55-a600-4bac-909b-edda39e72382', '{"action":"login","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 18:12:00.893929+00', ''),
	('00000000-0000-0000-0000-000000000000', '21584a92-7586-44ed-9b5b-bbee61e23147', '{"action":"token_refreshed","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-17 20:55:35.539974+00', ''),
	('00000000-0000-0000-0000-000000000000', '8f91e02b-6e0d-4919-9043-369f11932e1e', '{"action":"token_revoked","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-17 20:55:35.542469+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dd31dce6-73fb-41cd-9207-f761e78b2d27', '{"action":"token_refreshed","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-17 20:55:36.360639+00', ''),
	('00000000-0000-0000-0000-000000000000', '7ff5176a-7f3e-42b0-ae3f-3a2e70650950', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"greg@brou.com","user_id":"eb936bcc-9753-4efd-a18d-d952197b2adf","user_phone":""}}', '2025-08-17 20:58:31.548235+00', ''),
	('00000000-0000-0000-0000-000000000000', 'da0d7a69-14a0-4fda-9853-aef55ffb7252', '{"action":"login","actor_id":"eb936bcc-9753-4efd-a18d-d952197b2adf","actor_username":"greg@brou.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 20:59:05.360523+00', ''),
	('00000000-0000-0000-0000-000000000000', '75ab861b-c295-4fd2-beb1-d0b37d45bd6e', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"demo@menvo.com.br","user_id":"24a3583f-e150-4269-a31e-e3ac8c29d108","user_phone":""}}', '2025-08-17 21:06:07.692755+00', ''),
	('00000000-0000-0000-0000-000000000000', '9700d8ce-7bde-4a42-8ce5-b129565d5615', '{"action":"login","actor_id":"24a3583f-e150-4269-a31e-e3ac8c29d108","actor_username":"demo@menvo.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 21:16:33.401572+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ab496212-1df2-4618-93c2-aaf98fab3c1a', '{"action":"login","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 21:36:41.599122+00', ''),
	('00000000-0000-0000-0000-000000000000', '3a9e8e8d-fb70-4101-a6b2-4820e6fb2044', '{"action":"logout","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-08-17 21:38:39.295244+00', ''),
	('00000000-0000-0000-0000-000000000000', '55690785-8e59-4965-966c-7b02599ddca6', '{"action":"login","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 21:41:03.715962+00', ''),
	('00000000-0000-0000-0000-000000000000', '89faf76e-7bf9-4aa7-b259-e5949fee15ba', '{"action":"logout","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-08-17 21:42:41.424878+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ffd45ca8-2fe8-45b6-b0cd-81e686a22cdf', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"mccartney.shalom@gmail.com","user_id":"15a8adc6-4f26-4008-bbe0-7dae63eb8cdd","user_phone":""}}', '2025-08-17 22:33:39.479422+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bd134fa6-8005-4b28-822f-fdfc6c90486f', '{"action":"user_confirmation_requested","actor_id":"5622067d-1ab2-4f6c-a246-517cf5ea2f19","actor_name":"Mama Mia","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-17 22:34:11.204698+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ef5b1cde-f86a-4384-b5e7-29cf1684dac6', '{"action":"user_signedup","actor_id":"5622067d-1ab2-4f6c-a246-517cf5ea2f19","actor_name":"Mama Mia","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-17 22:34:38.397399+00', ''),
	('00000000-0000-0000-0000-000000000000', '9ed063da-b9f7-4f35-8c81-802384de7734', '{"action":"login","actor_id":"5622067d-1ab2-4f6c-a246-517cf5ea2f19","actor_name":"Mama Mia","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 22:48:00.986483+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b8fb5ad5-f073-4615-a661-3faa4f1625b8', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"seila@seila.com","user_id":"55f205ad-932f-457d-b02d-546dcad7ffb0","user_phone":""}}', '2025-08-17 22:52:56.027133+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bca321a5-0058-49b3-ad82-e607aec8f372', '{"action":"login","actor_id":"55f205ad-932f-457d-b02d-546dcad7ffb0","actor_username":"seila@seila.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 22:55:03.694648+00', ''),
	('00000000-0000-0000-0000-000000000000', '13f64373-df58-4afc-972f-21bea3709668', '{"action":"login","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 23:08:40.179999+00', ''),
	('00000000-0000-0000-0000-000000000000', '28bc1e2e-e6a6-4f27-8b4c-a2f3f12bf60a', '{"action":"logout","actor_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-08-17 23:09:42.2916+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e7952a23-5b9d-4f47-850f-74dfaa4072a1', '{"action":"login","actor_id":"5622067d-1ab2-4f6c-a246-517cf5ea2f19","actor_name":"Mama Mia","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 23:12:26.581955+00', ''),
	('00000000-0000-0000-0000-000000000000', '9ad9973d-46e1-4aa6-98c8-77703e671354', '{"action":"logout","actor_id":"5622067d-1ab2-4f6c-a246-517cf5ea2f19","actor_name":"Mama Mia","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-08-17 23:17:26.839222+00', ''),
	('00000000-0000-0000-0000-000000000000', '5a2231c5-6aab-4bfa-b244-f0e446888ed0', '{"action":"user_recovery_requested","actor_id":"5622067d-1ab2-4f6c-a246-517cf5ea2f19","actor_name":"Mama Mia","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"user"}', '2025-08-17 23:23:09.27583+00', ''),
	('00000000-0000-0000-0000-000000000000', '54adbcdc-9418-44e5-97ab-003db607dfc6', '{"action":"login","actor_id":"5622067d-1ab2-4f6c-a246-517cf5ea2f19","actor_name":"Mama Mia","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-08-17 23:23:24.524967+00', ''),
	('00000000-0000-0000-0000-000000000000', '6e1e03d1-ed70-48b6-a96b-e1ea20ccf081', '{"action":"login","actor_id":"5622067d-1ab2-4f6c-a246-517cf5ea2f19","actor_name":"Mama Mia","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"recovery"}}', '2025-08-17 23:23:46.490825+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a14d5a4f-ba6e-40de-b30e-616bca98001f', '{"action":"logout","actor_id":"5622067d-1ab2-4f6c-a246-517cf5ea2f19","actor_name":"Mama Mia","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-08-17 23:24:55.319289+00', ''),
	('00000000-0000-0000-0000-000000000000', '879f2ade-e2c3-4065-8b26-8349c8e20af9', '{"action":"login","actor_id":"5622067d-1ab2-4f6c-a246-517cf5ea2f19","actor_name":"Mama Mia","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 23:25:59.798347+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ad9ae610-9406-48a3-a268-77aa39d83b05', '{"action":"logout","actor_id":"5622067d-1ab2-4f6c-a246-517cf5ea2f19","actor_name":"Mama Mia","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-08-17 23:26:05.419409+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e16e98c8-ed19-4758-aa16-d0feea5a037f', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"a@a.me","user_id":"f9e202c4-9c00-443b-ad1e-51993aa87f72","user_phone":""}}', '2025-08-17 23:28:43.021863+00', ''),
	('00000000-0000-0000-0000-000000000000', '4e4a9548-e771-4f75-9bad-eebef084aea3', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"mccartney.shalom@gmail.com","user_id":"5622067d-1ab2-4f6c-a246-517cf5ea2f19","user_phone":""}}', '2025-08-17 23:28:43.041433+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b32f6ffe-734e-4a02-a8d5-3632aad71e0a', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"demo@menvo.com.br","user_id":"24a3583f-e150-4269-a31e-e3ac8c29d108","user_phone":""}}', '2025-08-17 23:28:43.047522+00', ''),
	('00000000-0000-0000-0000-000000000000', '9c397854-14dc-4677-be7a-64b8b9451a04', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"seila@seila.com","user_id":"55f205ad-932f-457d-b02d-546dcad7ffb0","user_phone":""}}', '2025-08-17 23:28:43.056372+00', ''),
	('00000000-0000-0000-0000-000000000000', '6262b008-8688-4656-ab9a-9406b78cac11', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"greg@brou.com","user_id":"eb936bcc-9753-4efd-a18d-d952197b2adf","user_phone":""}}', '2025-08-17 23:28:43.06952+00', ''),
	('00000000-0000-0000-0000-000000000000', 'de2d8865-736f-461e-86c3-5b75d76410cc', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"a@a.com","user_id":"c8bb5c75-d77e-440e-bcf4-00a8a79887fa","user_phone":""}}', '2025-08-17 23:29:34.653548+00', ''),
	('00000000-0000-0000-0000-000000000000', '2bfd83a2-65a3-462f-91fc-bee9a45ca8b9', '{"action":"login","actor_id":"c8bb5c75-d77e-440e-bcf4-00a8a79887fa","actor_username":"a@a.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 23:29:42.448529+00', ''),
	('00000000-0000-0000-0000-000000000000', '3ff7089b-cf38-442a-bcb0-dc4584682a33', '{"action":"logout","actor_id":"c8bb5c75-d77e-440e-bcf4-00a8a79887fa","actor_username":"a@a.com","actor_via_sso":false,"log_type":"account"}', '2025-08-17 23:35:41.009999+00', ''),
	('00000000-0000-0000-0000-000000000000', '1da87bd9-46d2-40a3-b44a-d934cc316207', '{"action":"user_confirmation_requested","actor_id":"f6e1c5ae-d732-4baa-83a0-6dde90a6b2e2","actor_name":"Spider Man","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-17 23:36:29.694094+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b3bb81fc-6838-41b4-a8ab-906f9565cebe', '{"action":"user_signedup","actor_id":"f6e1c5ae-d732-4baa-83a0-6dde90a6b2e2","actor_name":"Spider Man","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-17 23:37:33.235443+00', ''),
	('00000000-0000-0000-0000-000000000000', '461446d0-1720-4401-b542-2d8bbfc7026d', '{"action":"login","actor_id":"f6e1c5ae-d732-4baa-83a0-6dde90a6b2e2","actor_name":"Spider Man","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-17 23:42:11.311511+00', ''),
	('00000000-0000-0000-0000-000000000000', '4efbcc0b-45c4-4754-ad9f-56d30cb86429', '{"action":"logout","actor_id":"f6e1c5ae-d732-4baa-83a0-6dde90a6b2e2","actor_name":"Spider Man","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-08-17 23:42:21.334449+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ba701cc8-9144-44d0-955f-904344bb32a7', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"paulmspessoa@gmail.com","user_id":"62fddacd-c59e-41f4-a055-7cedf8ce13fb","user_phone":""}}', '2025-08-18 00:53:25.998144+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cf3c16ab-24d4-4a7f-9dd5-9a92398fc044', '{"action":"user_confirmation_requested","actor_id":"caf3cdf5-f730-4832-88be-31701d7a489e","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-18 00:53:47.6585+00', ''),
	('00000000-0000-0000-0000-000000000000', '8fa0b8b7-faae-48ef-9771-06b8c2187139', '{"action":"user_signedup","actor_id":"caf3cdf5-f730-4832-88be-31701d7a489e","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-18 00:54:00.622368+00', ''),
	('00000000-0000-0000-0000-000000000000', '3bc2df0d-d9c0-488f-8fc1-6802b2c39eba', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"mccartney.shalom@gmail.com","user_id":"f6e1c5ae-d732-4baa-83a0-6dde90a6b2e2","user_phone":""}}', '2025-08-18 00:59:56.318559+00', ''),
	('00000000-0000-0000-0000-000000000000', '9ca2ad9d-f056-4ac2-9a37-833926b9e453', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"a@a.com","user_id":"c8bb5c75-d77e-440e-bcf4-00a8a79887fa","user_phone":""}}', '2025-08-18 01:00:01.903935+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f630d88a-1f42-471e-82ba-d51595b4cf86', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"paulmspessoa@gmail.com","user_id":"caf3cdf5-f730-4832-88be-31701d7a489e","user_phone":""}}', '2025-08-18 01:00:05.858357+00', ''),
	('00000000-0000-0000-0000-000000000000', '1ef40586-aff5-44c6-adb6-270d01093178', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"ba@ba.com","user_id":"cbc6c8b4-ccda-47b3-b34c-698ac54b4ab5","user_phone":""}}', '2025-08-18 01:11:55.106152+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a3977466-a83c-4f50-b24e-40fe07490862', '{"action":"login","actor_id":"cbc6c8b4-ccda-47b3-b34c-698ac54b4ab5","actor_username":"ba@ba.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-18 01:12:01.940542+00', ''),
	('00000000-0000-0000-0000-000000000000', '4fb3f803-766a-496d-bd0c-0f6301c96e9d', '{"action":"user_signedup","actor_id":"258933f2-5ce3-4088-ac50-2228f658ad52","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"linkedin_oidc"}}', '2025-08-18 01:16:52.182845+00', ''),
	('00000000-0000-0000-0000-000000000000', '76b5516f-70e5-4576-a766-4d80627dd328', '{"action":"login","actor_id":"258933f2-5ce3-4088-ac50-2228f658ad52","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"linkedin_oidc"}}', '2025-08-18 01:16:54.073216+00', ''),
	('00000000-0000-0000-0000-000000000000', '84fd22cd-e0ff-4b1e-8c00-7d797c9a0147', '{"action":"user_confirmation_requested","actor_id":"3b78a6ed-f49c-4dbd-894d-d5c9a95eea2f","actor_name":"Paul Pessoa","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-18 01:20:13.745496+00', ''),
	('00000000-0000-0000-0000-000000000000', '2590b9ae-f0f5-4a28-819f-e5b63aca17cb', '{"action":"user_signedup","actor_id":"3b78a6ed-f49c-4dbd-894d-d5c9a95eea2f","actor_name":"Paul Pessoa","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-18 01:20:41.135778+00', ''),
	('00000000-0000-0000-0000-000000000000', '858ee9a1-8526-4ab2-991c-7c57d68fdffc', '{"action":"login","actor_id":"3b78a6ed-f49c-4dbd-894d-d5c9a95eea2f","actor_name":"Paul Pessoa","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-18 01:27:54.608991+00', ''),
	('00000000-0000-0000-0000-000000000000', 'eb489dfe-b49c-4380-8d37-d389edf503be', '{"action":"logout","actor_id":"3b78a6ed-f49c-4dbd-894d-d5c9a95eea2f","actor_name":"Paul Pessoa","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-08-18 01:28:18.383584+00', ''),
	('00000000-0000-0000-0000-000000000000', '4222b781-fd3d-4775-a020-e19bf030219a', '{"action":"login","actor_id":"3b78a6ed-f49c-4dbd-894d-d5c9a95eea2f","actor_name":"Paul Pessoa","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-08-18 01:28:45.489357+00', ''),
	('00000000-0000-0000-0000-000000000000', '9d8d08a4-3752-4b4a-9ce9-e29afc8c1584', '{"action":"login","actor_id":"3b78a6ed-f49c-4dbd-894d-d5c9a95eea2f","actor_name":"Paul Pessoa","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-08-18 01:28:46.830998+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c13aae25-971c-42ab-ad74-376029c156d6', '{"action":"logout","actor_id":"3b78a6ed-f49c-4dbd-894d-d5c9a95eea2f","actor_name":"Paul Pessoa","actor_username":"mccartney.shalom@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-08-18 01:39:27.521597+00', ''),
	('00000000-0000-0000-0000-000000000000', '9e98e7c6-64cc-43fc-8941-c1cd2ffd6d4b', '{"action":"login","actor_id":"258933f2-5ce3-4088-ac50-2228f658ad52","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-08-18 01:57:17.517782+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c87dba7b-d67f-40fb-825b-a6847feb0aa4', '{"action":"login","actor_id":"258933f2-5ce3-4088-ac50-2228f658ad52","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-08-18 01:57:19.429695+00', ''),
	('00000000-0000-0000-0000-000000000000', '911230f2-2e60-4aa4-a085-c96b15820e4e', '{"action":"user_signedup","actor_id":"06753fe4-05bc-4386-9350-29ba965cc68a","actor_name":"Giulia Sawaki","actor_username":"giuliasawaki8@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2025-08-18 16:44:20.529968+00', ''),
	('00000000-0000-0000-0000-000000000000', '04c97bb0-1aa2-45d0-a4de-a68f06e9cf80', '{"action":"login","actor_id":"06753fe4-05bc-4386-9350-29ba965cc68a","actor_name":"Giulia Sawaki","actor_username":"giuliasawaki8@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-08-18 16:44:23.338546+00', ''),
	('00000000-0000-0000-0000-000000000000', '5ae37ebe-0a53-4131-abd8-0c6413d0200c', '{"action":"user_signedup","actor_id":"cc09c6c6-0692-42de-ad47-bf92e1cfc2ba","actor_name":"Matheus Almeida","actor_username":"matheusjosesantosalmeida@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2025-08-18 22:45:42.941345+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c9156089-5a41-4207-96d8-3fd3132270ee', '{"action":"login","actor_id":"cc09c6c6-0692-42de-ad47-bf92e1cfc2ba","actor_name":"Matheus Almeida","actor_username":"matheusjosesantosalmeida@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-08-18 22:45:45.181307+00', ''),
	('00000000-0000-0000-0000-000000000000', '3a93aca2-8321-47ae-91ec-7143141aaea8', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"paulmspessoa@gmail.com","user_id":"258933f2-5ce3-4088-ac50-2228f658ad52","user_phone":""}}', '2025-08-20 03:38:54.179601+00', ''),
	('00000000-0000-0000-0000-000000000000', '5ad82f3e-2336-4b56-8d5f-22ccd0abd307', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"ba@ba.com","user_id":"cbc6c8b4-ccda-47b3-b34c-698ac54b4ab5","user_phone":""}}', '2025-08-20 03:38:55.120183+00', ''),
	('00000000-0000-0000-0000-000000000000', '6d78b97e-9aee-41f7-95e8-fe08fa2c73d5', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"mccartney.shalom@gmail.com","user_id":"3b78a6ed-f49c-4dbd-894d-d5c9a95eea2f","user_phone":""}}', '2025-08-20 03:38:55.243878+00', ''),
	('00000000-0000-0000-0000-000000000000', '8f0fdc8c-dc78-4125-9b25-a5992b723795', '{"action":"user_confirmation_requested","actor_id":"286e5d0e-57bf-4487-9275-b4b23deb50f1","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-20 03:42:08.165127+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e04e359b-7db6-4694-8db1-5d313d25c1a6', '{"action":"user_signedup","actor_id":"286e5d0e-57bf-4487-9275-b4b23deb50f1","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-20 03:42:28.87939+00', ''),
	('00000000-0000-0000-0000-000000000000', '04d3affd-60c1-4872-a7e2-1b58ba4d17aa', '{"action":"user_signedup","actor_id":"3eb7fa5c-4ee0-40ce-9cf3-93cc66108491","actor_name":"Guilherme Moretti","actor_username":"guilherme.morettti@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"linkedin_oidc"}}', '2025-08-22 21:23:30.613445+00', ''),
	('00000000-0000-0000-0000-000000000000', '69b74642-0797-41ec-9472-8c54957004d5', '{"action":"login","actor_id":"3eb7fa5c-4ee0-40ce-9cf3-93cc66108491","actor_name":"Guilherme Moretti","actor_username":"guilherme.morettti@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"linkedin_oidc"}}', '2025-08-22 21:23:31.881565+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c5744dc0-78cd-4e85-b11f-90afb5df79bb', '{"action":"logout","actor_id":"3eb7fa5c-4ee0-40ce-9cf3-93cc66108491","actor_name":"Guilherme Moretti","actor_username":"guilherme.morettti@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-08-22 21:24:04.297336+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e7f9d33b-d08b-47f6-b45c-81f6f0264b18', '{"action":"login","actor_id":"3eb7fa5c-4ee0-40ce-9cf3-93cc66108491","actor_name":"Guilherme Moretti","actor_username":"guilherme.morettti@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"linkedin_oidc"}}', '2025-08-22 21:24:17.709563+00', ''),
	('00000000-0000-0000-0000-000000000000', '57349034-ee6a-4509-85a0-fc46981f5e44', '{"action":"login","actor_id":"3eb7fa5c-4ee0-40ce-9cf3-93cc66108491","actor_name":"Guilherme Moretti","actor_username":"guilherme.morettti@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"linkedin_oidc"}}', '2025-08-22 21:24:18.362815+00', ''),
	('00000000-0000-0000-0000-000000000000', 'eff384af-51b2-4774-81fd-7c8217b5d8c3', '{"action":"login","actor_id":"286e5d0e-57bf-4487-9275-b4b23deb50f1","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-08-26 00:27:02.404634+00', ''),
	('00000000-0000-0000-0000-000000000000', '19751265-d7d5-4621-82a7-5ea2a42968db', '{"action":"login","actor_id":"286e5d0e-57bf-4487-9275-b4b23deb50f1","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-08-26 00:27:05.802485+00', ''),
	('00000000-0000-0000-0000-000000000000', '45bc34c8-45e6-4217-a0b6-4d30b2caa94a', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"paulmspessoa@gmail.com","user_id":"286e5d0e-57bf-4487-9275-b4b23deb50f1","user_phone":""}}', '2025-08-26 00:34:27.066864+00', ''),
	('00000000-0000-0000-0000-000000000000', '94e8f9be-a11d-4e9a-95af-e8980ad16697', '{"action":"user_signedup","actor_id":"9dde9504-2e44-492e-808e-db4279c4f7f2","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2025-08-26 00:34:38.492218+00', ''),
	('00000000-0000-0000-0000-000000000000', '9f3e7f8f-dfd3-4897-8bd1-be54c83bace1', '{"action":"login","actor_id":"9dde9504-2e44-492e-808e-db4279c4f7f2","actor_name":"Paul Pessoa","actor_username":"paulmspessoa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-08-26 00:34:41.350908+00', ''),
	('00000000-0000-0000-0000-000000000000', '1a4b30e9-9370-4ac3-ac95-8673daf548da', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"jeandepaula294@gmail.com","user_id":"d3c35c68-cdb3-42a4-ae65-f02196af2c2b","user_phone":""}}', '2025-08-26 00:50:42.734368+00', ''),
	('00000000-0000-0000-0000-000000000000', '865ca1f1-740b-4d96-a343-93ca0c0eda61', '{"action":"user_confirmation_requested","actor_id":"d3c35c68-cdb3-42a4-ae65-f02196af2c2b","actor_name":"jeandepaula294@gmail.com User","actor_username":"jeandepaula294@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-26 00:51:20.391067+00', ''),
	('00000000-0000-0000-0000-000000000000', '051b0080-9340-451a-a02e-c4590b64a7f7', '{"action":"user_recovery_requested","actor_id":"d3c35c68-cdb3-42a4-ae65-f02196af2c2b","actor_name":"jeandepaula294@gmail.com User","actor_username":"jeandepaula294@gmail.com","actor_via_sso":false,"log_type":"user"}', '2025-08-26 00:51:24.100431+00', ''),
	('00000000-0000-0000-0000-000000000000', '2758405a-52a5-485f-9b3b-b3862b9e6b45', '{"action":"user_signedup","actor_id":"d3c35c68-cdb3-42a4-ae65-f02196af2c2b","actor_name":"jeandepaula294@gmail.com User","actor_username":"jeandepaula294@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-26 00:51:42.341858+00', ''),
	('00000000-0000-0000-0000-000000000000', '8716e14e-dee4-41dc-9647-5aa79b6a3f8a', '{"action":"token_refreshed","actor_id":"3eb7fa5c-4ee0-40ce-9cf3-93cc66108491","actor_name":"Guilherme Moretti","actor_username":"guilherme.morettti@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-26 13:43:13.577283+00', ''),
	('00000000-0000-0000-0000-000000000000', '14688f57-7f59-4921-8747-621627b1ab6f', '{"action":"token_revoked","actor_id":"3eb7fa5c-4ee0-40ce-9cf3-93cc66108491","actor_name":"Guilherme Moretti","actor_username":"guilherme.morettti@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-26 13:43:13.600104+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ad1b787a-008b-44fe-84b3-8c41028bdd59', '{"action":"user_signedup","actor_id":"7a94b7de-4a3b-4224-aec2-60690b8f5d3b","actor_name":"Amanda Hollanda","actor_username":"amandahollanda@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2025-08-27 00:01:23.784248+00', ''),
	('00000000-0000-0000-0000-000000000000', '05e55c68-5bca-4767-91be-3e4c53170f86', '{"action":"login","actor_id":"7a94b7de-4a3b-4224-aec2-60690b8f5d3b","actor_name":"Amanda Hollanda","actor_username":"amandahollanda@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-08-27 00:01:25.167735+00', ''),
	('00000000-0000-0000-0000-000000000000', '9a6d7a0d-9702-49f3-9dfe-d3b86fb28d96', '{"action":"user_confirmation_requested","actor_id":"d1a05660-ce11-4097-b90c-bb11f39a2234","actor_name":"Kleber Castro","actor_username":"klebercastro22@hotmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-30 02:00:10.834982+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bdc3085d-b29a-426e-ae59-8c5f12fe2b70', '{"action":"user_signedup","actor_id":"d1a05660-ce11-4097-b90c-bb11f39a2234","actor_name":"Kleber Castro","actor_username":"klebercastro22@hotmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-30 02:00:35.942729+00', ''),
	('00000000-0000-0000-0000-000000000000', '3e7deb4f-c24c-412f-9585-46f436869b65', '{"action":"login","actor_id":"d1a05660-ce11-4097-b90c-bb11f39a2234","actor_name":"Kleber Castro","actor_username":"klebercastro22@hotmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-30 02:00:40.062067+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at") VALUES
	('0d01c45e-44eb-4d05-ab0a-3d3fbec8d68d', NULL, 'd1c99bb5-296d-40fc-983e-0d679ebd6d12', 's256', 'BCiA6ZYEhy8YCQnqSq9gN2Pl7vr1IuIlHKfH9jzZurU', 'google', '', '', '2025-08-17 03:39:41.764338+00', '2025-08-17 03:39:41.764338+00', 'oauth', NULL),
	('52c87738-75fb-4625-943f-1fd81c0ba450', NULL, '827aa6d7-101a-4a27-81b1-63451add598f', 's256', 'y-t_epWfw59L6UppfiYdYHWwSqgixe8Glu_qZpE2n0w', 'google', '', '', '2025-08-30 02:01:14.167449+00', '2025-08-30 02:01:14.167449+00', 'oauth', NULL),
	('05f5d43e-b600-4177-8936-67c8f843710f', NULL, 'd0af5fbe-9c72-4dad-97d4-4b0769c68224', 's256', '9bdTuUefDJIJnM0mgYRkLkL6xbpOPWB-oVFKX6GUl14', 'linkedin_oidc', '', '', '2025-08-30 02:01:14.293499+00', '2025-08-30 02:01:14.293499+00', 'oauth', NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'b43816ad-7d50-4e7b-bbe1-b9cbab6e350a', 'authenticated', 'authenticated', 'contatoismaela@gmail.com', NULL, '2025-08-17 15:30:42.61763+00', '2025-08-17 02:59:57.837128+00', '', '2025-08-17 02:59:57.837128+00', '', NULL, '', '', NULL, '2025-08-17 15:30:43.559078+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "103765424769510975071", "name": "Ismaela Silva", "role": "mentor", "email": "contatoismaela@gmail.com", "status": "active", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLY7Wdc58hXzYp1ok5iYdnWIV2R37Ajud2qkK51H237soBYa6EM=s96-c", "full_name": "Ismaela Silva", "last_name": "Silva", "avatar_url": null, "first_name": "Ismaela", "updated_at": "2025-08-20 03:41:03.88209+00", "provider_id": "103765424769510975071", "email_verified": true, "phone_verified": false, "verification_status": "active"}', NULL, '2025-08-17 02:59:57.819715+00', '2025-08-17 15:30:43.566043+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'd1a05660-ce11-4097-b90c-bb11f39a2234', 'authenticated', 'authenticated', 'klebercastro22@hotmail.com', '$2a$10$6BxycDOmE7QQ5iG6qEI6kezYmZw5UFBGuvOlsLjP.OKz0V9Xw79/u', '2025-08-30 02:00:35.94476+00', NULL, '', '2025-08-30 02:00:10.854668+00', '', NULL, '', '', NULL, '2025-08-30 02:00:40.062684+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "d1a05660-ce11-4097-b90c-bb11f39a2234", "role": "mentee", "email": "klebercastro22@hotmail.com", "status": "pending", "full_name": "Kleber Castro", "last_name": "Castro", "user_type": "mentee", "first_name": "Kleber", "updated_at": "2025-08-30 02:00:10.67754+00", "email_verified": true, "phone_verified": false, "verification_status": "active"}', NULL, '2025-08-30 02:00:10.679904+00', '2025-08-30 02:00:40.065188+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '06753fe4-05bc-4386-9350-29ba965cc68a', 'authenticated', 'authenticated', 'giuliasawaki8@gmail.com', NULL, '2025-08-18 16:44:20.540515+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-08-18 16:44:23.342137+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "100292341162828464509", "name": "Giulia Sawaki", "role": "pending", "email": "giuliasawaki8@gmail.com", "status": "pending", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJgcUJ-v0Sn7KsDL3gN_D2DSjsjDVMl2xIY9sRBuNAyzgRYK5_U=s96-c", "full_name": "Giulia Sawaki", "last_name": "Sawaki", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJgcUJ-v0Sn7KsDL3gN_D2DSjsjDVMl2xIY9sRBuNAyzgRYK5_U=s96-c", "first_name": "Giulia", "updated_at": "2025-08-18 16:44:20.35556+00", "provider_id": "100292341162828464509", "email_verified": true, "phone_verified": false, "verification_status": "pending"}', NULL, '2025-08-18 16:44:20.421476+00', '2025-08-18 16:44:23.378306+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'd3c35c68-cdb3-42a4-ae65-f02196af2c2b', 'authenticated', 'authenticated', 'jeandepaula294@gmail.com', '$2a$10$XsdLah8DDEXctSOudJt3SuzakaT63ecqVKkGAF6mrtkKkuM5OXjTW', '2025-08-26 00:51:42.343136+00', NULL, '', '2025-08-26 00:51:20.39619+00', '', '2025-08-26 00:51:24.101097+00', '', '', NULL, '2025-08-26 00:51:42.346953+00', '{"provider": "email", "providers": ["email"]}', '{"role": "pending", "status": "pending", "full_name": "jeandepaula294@gmail.com User", "last_name": "User", "avatar_url": null, "first_name": "jeandepaula294@gmail.com", "updated_at": "2025-08-26 00:50:42.688235+00", "email_verified": true, "verification_status": "pending"}', NULL, '2025-08-26 00:50:42.690655+00', '2025-08-26 00:51:42.363356+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'cc09c6c6-0692-42de-ad47-bf92e1cfc2ba', 'authenticated', 'authenticated', 'matheusjosesantosalmeida@gmail.com', NULL, '2025-08-18 22:45:42.947171+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-08-18 22:45:45.182581+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "110859321284139129471", "name": "Matheus Almeida", "role": "pending", "email": "matheusjosesantosalmeida@gmail.com", "status": "pending", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKwLJIoS64-WDQAutEI5gArSXEmsOq2gZOTpakkjus_rFQIFdc=s96-c", "full_name": "Matheus Almeida", "last_name": "Almeida", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKwLJIoS64-WDQAutEI5gArSXEmsOq2gZOTpakkjus_rFQIFdc=s96-c", "first_name": "Matheus", "updated_at": "2025-08-18 22:45:42.78057+00", "provider_id": "110859321284139129471", "email_verified": true, "phone_verified": false, "verification_status": "pending"}', NULL, '2025-08-18 22:45:42.842741+00', '2025-08-18 22:45:45.212022+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '9dde9504-2e44-492e-808e-db4279c4f7f2', 'authenticated', 'authenticated', 'paulmspessoa@gmail.com', NULL, '2025-08-26 00:34:38.493098+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-08-26 00:34:41.352969+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "101146163160526728632", "name": "Paul Pessoa", "role": "pending", "email": "paulmspessoa@gmail.com", "status": "pending", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKUbSFOHoH_vWIpz67wQQ6lizkaLh_jxoL5aDNrUUyBY2Cg8KRt=s96-c", "full_name": "Paul Pessoa", "last_name": "Pessoa", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKUbSFOHoH_vWIpz67wQQ6lizkaLh_jxoL5aDNrUUyBY2Cg8KRt=s96-c", "first_name": "Paul", "updated_at": "2025-08-26 00:34:38.438872+00", "provider_id": "101146163160526728632", "email_verified": true, "phone_verified": false, "verification_status": "pending"}', NULL, '2025-08-26 00:34:38.445751+00', '2025-08-26 00:34:41.372542+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '3eb7fa5c-4ee0-40ce-9cf3-93cc66108491', 'authenticated', 'authenticated', 'guilherme.morettti@gmail.com', NULL, '2025-08-22 21:23:30.624628+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-08-22 21:24:18.363659+00', '{"provider": "linkedin_oidc", "providers": ["linkedin_oidc"]}', '{"iss": "https://www.linkedin.com/oauth", "sub": "WPtQw9-ydF", "name": "Guilherme Moretti", "role": "pending", "email": "guilherme.morettti@gmail.com", "locale": "pt_BR", "status": "pending", "picture": "https://media.licdn.com/dms/image/v2/D4D03AQFWzzCY5nG1GQ/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1718814445670?e=1758758400&v=beta&t=SJXCtzlQP5G-ZOknE883z0Q0Syox4DKDg_yGpUfwyJw", "full_name": "Guilherme Moretti", "last_name": "Moretti", "first_name": "Guilherme", "given_name": "Guilherme", "updated_at": "2025-08-22 21:23:30.431685+00", "family_name": "Moretti", "provider_id": "WPtQw9-ydF", "email_verified": true, "phone_verified": false, "verification_status": "pending"}', NULL, '2025-08-22 21:23:30.491611+00', '2025-08-26 13:43:13.635649+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '7a94b7de-4a3b-4224-aec2-60690b8f5d3b', 'authenticated', 'authenticated', 'amandahollanda@gmail.com', NULL, '2025-08-27 00:01:23.795663+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-08-27 00:01:25.168664+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "115515254856508172130", "name": "Amanda Hollanda", "role": "pending", "email": "amandahollanda@gmail.com", "status": "pending", "picture": "https://lh3.googleusercontent.com/a/ACg8ocL5uQWPLqhGlDHAMIIS40k4UiojWHgJ6KKbc6ANNewXYsyy39a5bQ=s96-c", "full_name": "Amanda Hollanda", "last_name": "Hollanda", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocL5uQWPLqhGlDHAMIIS40k4UiojWHgJ6KKbc6ANNewXYsyy39a5bQ=s96-c", "first_name": "Amanda", "updated_at": "2025-08-27 00:01:23.606374+00", "provider_id": "115515254856508172130", "email_verified": true, "phone_verified": false, "verification_status": "pending"}', NULL, '2025-08-27 00:01:23.663107+00', '2025-08-27 00:01:25.196955+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('100292341162828464509', '06753fe4-05bc-4386-9350-29ba965cc68a', '{"iss": "https://accounts.google.com", "sub": "100292341162828464509", "name": "Giulia Sawaki", "role": "pending", "email": "giuliasawaki8@gmail.com", "status": "pending", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJgcUJ-v0Sn7KsDL3gN_D2DSjsjDVMl2xIY9sRBuNAyzgRYK5_U=s96-c", "full_name": "Giulia Sawaki", "last_name": "Sawaki", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJgcUJ-v0Sn7KsDL3gN_D2DSjsjDVMl2xIY9sRBuNAyzgRYK5_U=s96-c", "first_name": "Giulia", "updated_at": "2025-08-18 16:44:20.35556+00", "provider_id": "100292341162828464509", "email_verified": true, "phone_verified": false, "verification_status": "pending"}', 'google', '2025-08-18 16:44:20.515409+00', '2025-08-18 16:44:20.515476+00', '2025-08-18 16:44:20.515476+00', '9a0ebab6-fabc-43be-ab36-0ba3c08b9eab'),
	('103765424769510975071', 'b43816ad-7d50-4e7b-bbe1-b9cbab6e350a', '{"iss": "https://accounts.google.com", "sub": "103765424769510975071", "name": "Ismaela Silva", "email": "contatoismaela@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLY7Wdc58hXzYp1ok5iYdnWIV2R37Ajud2qkK51H237soBYa6EM=s96-c", "full_name": "Ismaela Silva", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLY7Wdc58hXzYp1ok5iYdnWIV2R37Ajud2qkK51H237soBYa6EM=s96-c", "provider_id": "103765424769510975071", "email_verified": true, "phone_verified": false}', 'google', '2025-08-17 15:30:42.606991+00', '2025-08-17 15:30:42.607053+00', '2025-08-17 15:30:42.607053+00', '5c4fe911-2f94-42d9-9887-61677b98f8c2'),
	('110859321284139129471', 'cc09c6c6-0692-42de-ad47-bf92e1cfc2ba', '{"iss": "https://accounts.google.com", "sub": "110859321284139129471", "name": "Matheus Almeida", "role": "pending", "email": "matheusjosesantosalmeida@gmail.com", "status": "pending", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKwLJIoS64-WDQAutEI5gArSXEmsOq2gZOTpakkjus_rFQIFdc=s96-c", "full_name": "Matheus Almeida", "last_name": "Almeida", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKwLJIoS64-WDQAutEI5gArSXEmsOq2gZOTpakkjus_rFQIFdc=s96-c", "first_name": "Matheus", "updated_at": "2025-08-18 22:45:42.78057+00", "provider_id": "110859321284139129471", "email_verified": true, "phone_verified": false, "verification_status": "pending"}', 'google', '2025-08-18 22:45:42.930152+00', '2025-08-18 22:45:42.930209+00', '2025-08-18 22:45:42.930209+00', '52e6b976-07c0-4e14-a072-d886633d2f4b'),
	('d1a05660-ce11-4097-b90c-bb11f39a2234', 'd1a05660-ce11-4097-b90c-bb11f39a2234', '{"sub": "d1a05660-ce11-4097-b90c-bb11f39a2234", "role": "mentee", "email": "klebercastro22@hotmail.com", "status": "pending", "full_name": "Kleber Castro", "last_name": "Castro", "user_type": "mentee", "avatar_url": null, "first_name": "Kleber", "updated_at": "2025-08-30 02:00:10.67754+00", "email_verified": true, "phone_verified": false, "verification_status": "active"}', 'email', '2025-08-30 02:00:10.812879+00', '2025-08-30 02:00:10.814725+00', '2025-08-30 02:00:10.814725+00', 'b8bc096c-08d9-4993-839d-28c109f1ed87'),
	('WPtQw9-ydF', '3eb7fa5c-4ee0-40ce-9cf3-93cc66108491', '{"iss": "https://www.linkedin.com/oauth", "sub": "WPtQw9-ydF", "name": "Guilherme Moretti", "email": "guilherme.morettti@gmail.com", "locale": "pt_BR", "picture": "https://media.licdn.com/dms/image/v2/D4D03AQFWzzCY5nG1GQ/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1718814445670?e=1758758400&v=beta&t=SJXCtzlQP5G-ZOknE883z0Q0Syox4DKDg_yGpUfwyJw", "given_name": "Guilherme", "family_name": "Moretti", "provider_id": "WPtQw9-ydF", "email_verified": true, "phone_verified": false}', 'linkedin_oidc', '2025-08-22 21:23:30.592244+00', '2025-08-22 21:23:30.592883+00', '2025-08-22 21:24:17.707589+00', '7dbc6e19-bae3-4bdc-8d30-13ce99bfae33'),
	('101146163160526728632', '9dde9504-2e44-492e-808e-db4279c4f7f2', '{"iss": "https://accounts.google.com", "sub": "101146163160526728632", "name": "Paul Pessoa", "role": "pending", "email": "paulmspessoa@gmail.com", "status": "pending", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKUbSFOHoH_vWIpz67wQQ6lizkaLh_jxoL5aDNrUUyBY2Cg8KRt=s96-c", "full_name": "Paul Pessoa", "last_name": "Pessoa", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKUbSFOHoH_vWIpz67wQQ6lizkaLh_jxoL5aDNrUUyBY2Cg8KRt=s96-c", "first_name": "Paul", "updated_at": "2025-08-26 00:34:38.438872+00", "provider_id": "101146163160526728632", "email_verified": true, "phone_verified": false, "verification_status": "pending"}', 'google', '2025-08-26 00:34:38.48707+00', '2025-08-26 00:34:38.487122+00', '2025-08-26 00:34:38.487122+00', '59a6edff-ff13-4f6d-a3f6-bd36858fe8e0'),
	('d3c35c68-cdb3-42a4-ae65-f02196af2c2b', 'd3c35c68-cdb3-42a4-ae65-f02196af2c2b', '{"sub": "d3c35c68-cdb3-42a4-ae65-f02196af2c2b", "email": "jeandepaula294@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2025-08-26 00:50:42.727493+00', '2025-08-26 00:50:42.727559+00', '2025-08-26 00:50:42.727559+00', '20c1f751-8350-40d5-ba00-06864739045d'),
	('115515254856508172130', '7a94b7de-4a3b-4224-aec2-60690b8f5d3b', '{"iss": "https://accounts.google.com", "sub": "115515254856508172130", "name": "Amanda Hollanda", "role": "pending", "email": "amandahollanda@gmail.com", "status": "pending", "picture": "https://lh3.googleusercontent.com/a/ACg8ocL5uQWPLqhGlDHAMIIS40k4UiojWHgJ6KKbc6ANNewXYsyy39a5bQ=s96-c", "full_name": "Amanda Hollanda", "last_name": "Hollanda", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocL5uQWPLqhGlDHAMIIS40k4UiojWHgJ6KKbc6ANNewXYsyy39a5bQ=s96-c", "first_name": "Amanda", "updated_at": "2025-08-27 00:01:23.606374+00", "provider_id": "115515254856508172130", "email_verified": true, "phone_verified": false, "verification_status": "pending"}', 'google', '2025-08-27 00:01:23.767235+00', '2025-08-27 00:01:23.7673+00', '2025-08-27 00:01:23.7673+00', '128dc0ab-c0f4-4c79-ab39-3e1e6ada920d');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('2871ba96-c3b0-4c45-b312-8933dc3b2671', '9dde9504-2e44-492e-808e-db4279c4f7f2', '2025-08-26 00:34:41.353059+00', '2025-08-26 00:34:41.353059+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36', '177.190.211.87', NULL),
	('0f481061-5b67-4122-b3ed-3a089e53e17d', 'd3c35c68-cdb3-42a4-ae65-f02196af2c2b', '2025-08-26 00:51:42.347035+00', '2025-08-26 00:51:42.347035+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '187.94.156.231', NULL),
	('70def95e-5aa0-476c-b554-78719e3f7a35', '3eb7fa5c-4ee0-40ce-9cf3-93cc66108491', '2025-08-22 21:24:18.363737+00', '2025-08-26 13:43:13.742635+00', NULL, 'aal1', NULL, '2025-08-26 13:43:13.740175', 'Vercel Edge Functions', '56.124.15.114', NULL),
	('57214b57-d3e9-4eff-8916-ac75fbca8680', '7a94b7de-4a3b-4224-aec2-60690b8f5d3b', '2025-08-27 00:01:25.169874+00', '2025-08-27 00:01:25.169874+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36', '187.180.191.54', NULL),
	('304d4121-0012-4f15-9242-ea9e3f1f18a5', 'd1a05660-ce11-4097-b90c-bb11f39a2234', '2025-08-30 02:00:35.95516+00', '2025-08-30 02:00:35.95516+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '187.116.75.32', NULL),
	('3fb9161d-25b2-46f5-830c-6c2232f9b26e', 'd1a05660-ce11-4097-b90c-bb11f39a2234', '2025-08-30 02:00:40.063397+00', '2025-08-30 02:00:40.063397+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '187.116.75.32', NULL),
	('42350414-a69f-416b-ada7-f428de176376', 'b43816ad-7d50-4e7b-bbe1-b9cbab6e350a', '2025-08-17 15:30:43.559145+00', '2025-08-17 15:30:43.559145+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '177.190.211.87', NULL),
	('54cb9e09-bf50-4a7d-8c72-023ddbfc93c3', '06753fe4-05bc-4386-9350-29ba965cc68a', '2025-08-18 16:44:23.342324+00', '2025-08-18 16:44:23.342324+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0', '200.158.97.176', NULL),
	('11c068d9-415e-4bd6-8e7f-cdb2fdd67fc5', 'cc09c6c6-0692-42de-ad47-bf92e1cfc2ba', '2025-08-18 22:45:45.182717+00', '2025-08-18 22:45:45.182717+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '191.6.11.172', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('2871ba96-c3b0-4c45-b312-8933dc3b2671', '2025-08-26 00:34:41.373104+00', '2025-08-26 00:34:41.373104+00', 'oauth', 'f893b9fa-9e96-47f2-a3b5-2df6600ca0f8'),
	('0f481061-5b67-4122-b3ed-3a089e53e17d', '2025-08-26 00:51:42.363874+00', '2025-08-26 00:51:42.363874+00', 'otp', 'fe72bca3-7bf0-4688-9611-89c3fb8ec957'),
	('57214b57-d3e9-4eff-8916-ac75fbca8680', '2025-08-27 00:01:25.197451+00', '2025-08-27 00:01:25.197451+00', 'oauth', '1db56119-30c1-439f-b363-edd8a41f4625'),
	('304d4121-0012-4f15-9242-ea9e3f1f18a5', '2025-08-30 02:00:36.02241+00', '2025-08-30 02:00:36.02241+00', 'otp', 'fec81972-8351-4dec-89ca-2fbcfcaa48f5'),
	('3fb9161d-25b2-46f5-830c-6c2232f9b26e', '2025-08-30 02:00:40.065552+00', '2025-08-30 02:00:40.065552+00', 'password', '3d4cef11-36a5-4f86-a8be-27b94a59884c'),
	('42350414-a69f-416b-ada7-f428de176376', '2025-08-17 15:30:43.566602+00', '2025-08-17 15:30:43.566602+00', 'oauth', '133bbb0c-afa4-4231-a944-104ffb0cd86b'),
	('54cb9e09-bf50-4a7d-8c72-023ddbfc93c3', '2025-08-18 16:44:23.378862+00', '2025-08-18 16:44:23.378862+00', 'oauth', '4f2db302-8cde-43ae-a5de-6bc6cc5a228e'),
	('11c068d9-415e-4bd6-8e7f-cdb2fdd67fc5', '2025-08-18 22:45:45.213298+00', '2025-08-18 22:45:45.213298+00', 'oauth', '5d8ee05a-2376-4942-a88f-3d6f68af6d22'),
	('70def95e-5aa0-476c-b554-78719e3f7a35', '2025-08-22 21:24:18.365827+00', '2025-08-22 21:24:18.365827+00', 'oauth', 'e0015614-ed79-4151-90d5-2abc561d942c');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 338, 'aizjcr4qlzhv', '06753fe4-05bc-4386-9350-29ba965cc68a', false, '2025-08-18 16:44:23.356253+00', '2025-08-18 16:44:23.356253+00', NULL, '54cb9e09-bf50-4a7d-8c72-023ddbfc93c3'),
	('00000000-0000-0000-0000-000000000000', 339, 'hafnqq2x7lh2', 'cc09c6c6-0692-42de-ad47-bf92e1cfc2ba', false, '2025-08-18 22:45:45.188264+00', '2025-08-18 22:45:45.188264+00', NULL, '11c068d9-415e-4bd6-8e7f-cdb2fdd67fc5'),
	('00000000-0000-0000-0000-000000000000', 344, '263dxxoobf26', '9dde9504-2e44-492e-808e-db4279c4f7f2', false, '2025-08-26 00:34:41.357211+00', '2025-08-26 00:34:41.357211+00', NULL, '2871ba96-c3b0-4c45-b312-8933dc3b2671'),
	('00000000-0000-0000-0000-000000000000', 345, 'rs57uw5mfytg', 'd3c35c68-cdb3-42a4-ae65-f02196af2c2b', false, '2025-08-26 00:51:42.353779+00', '2025-08-26 00:51:42.353779+00', NULL, '0f481061-5b67-4122-b3ed-3a089e53e17d'),
	('00000000-0000-0000-0000-000000000000', 342, 'baqbvcmxxlg4', '3eb7fa5c-4ee0-40ce-9cf3-93cc66108491', true, '2025-08-22 21:24:18.364497+00', '2025-08-26 13:43:13.601478+00', NULL, '70def95e-5aa0-476c-b554-78719e3f7a35'),
	('00000000-0000-0000-0000-000000000000', 346, 'xgz6e7glwvom', '3eb7fa5c-4ee0-40ce-9cf3-93cc66108491', false, '2025-08-26 13:43:13.619992+00', '2025-08-26 13:43:13.619992+00', 'baqbvcmxxlg4', '70def95e-5aa0-476c-b554-78719e3f7a35'),
	('00000000-0000-0000-0000-000000000000', 347, 'spcl5jkfuuic', '7a94b7de-4a3b-4224-aec2-60690b8f5d3b', false, '2025-08-27 00:01:25.178861+00', '2025-08-27 00:01:25.178861+00', NULL, '57214b57-d3e9-4eff-8916-ac75fbca8680'),
	('00000000-0000-0000-0000-000000000000', 348, 'uyby25j2xcez', 'd1a05660-ce11-4097-b90c-bb11f39a2234', false, '2025-08-30 02:00:35.976545+00', '2025-08-30 02:00:35.976545+00', NULL, '304d4121-0012-4f15-9242-ea9e3f1f18a5'),
	('00000000-0000-0000-0000-000000000000', 349, 'q7u37mve373x', 'd1a05660-ce11-4097-b90c-bb11f39a2234', false, '2025-08-30 02:00:40.064259+00', '2025-08-30 02:00:40.064259+00', NULL, '3fb9161d-25b2-46f5-830c-6c2232f9b26e'),
	('00000000-0000-0000-0000-000000000000', 311, 'fawzq6biyefy', 'b43816ad-7d50-4e7b-bbe1-b9cbab6e350a', false, '2025-08-17 15:30:43.561041+00', '2025-08-17 15:30:43.561041+00', NULL, '42350414-a69f-416b-ada7-f428de176376');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."permissions" ("id", "name", "description", "resource", "action", "created_at") VALUES
	('7475b7bf-abb6-4870-8835-f541f7d6ea3a', 'view_mentors', 'View mentor profiles', 'profiles', 'read', '2025-08-16 22:33:51.459556+00'),
	('0b6b6685-aeee-4a0a-a90e-7f718860fd3c', 'view_profiles', 'View user profiles', 'profiles', 'read', '2025-08-16 22:33:51.459556+00'),
	('973852bb-7636-4013-8e59-284a196b8e11', 'update_own_profile', 'Update own profile', 'profiles', 'update', '2025-08-16 22:33:51.459556+00'),
	('357bf7b8-c74a-4fcb-a077-1da704fad94c', 'book_sessions', 'Book mentorship sessions', 'mentorship', 'create', '2025-08-16 22:33:51.459556+00'),
	('277a18ca-62e8-4e79-b6e0-5c10cbf36a53', 'provide_mentorship', 'Provide mentorship services', 'mentorship', 'create', '2025-08-16 22:33:51.459556+00'),
	('95dd0bdd-9e6a-44e7-959a-7cee80f4d988', 'manage_availability', 'Manage mentor availability', 'mentorship', 'update', '2025-08-16 22:33:51.459556+00'),
	('df8d6a36-8743-47a0-962f-bb32f9ae9eb8', 'admin_users', 'Administer user accounts', 'admin', 'users', '2025-08-16 22:33:51.459556+00'),
	('aede2071-35c0-4019-8e58-606d6080a61f', 'admin_verifications', 'Handle profile verifications', 'admin', 'verifications', '2025-08-16 22:33:51.459556+00'),
	('1b95bfa5-8629-4795-aaac-1d896bc4a434', 'admin_system', 'Full system administration', 'admin', 'system', '2025-08-16 22:33:51.459556+00'),
	('99487c7a-5778-46b3-9f67-149f555d4670', 'manage_roles', 'Manage user roles and permissions', 'admin', 'roles', '2025-08-16 22:33:51.459556+00'),
	('322473db-b4b5-493c-9853-545074743f19', 'validate_activities', 'Validate volunteer activities', 'volunteer', 'validate', '2025-08-16 22:33:51.459556+00'),
	('020a8050-7dcd-43d4-a737-51f707cedaa3', 'moderate_content', 'Moderate platform content', 'moderation', 'content', '2025-08-16 22:33:51.459556+00'),
	('f793bf97-5830-4827-b524-b8ba21530db3', 'moderate_verifications', 'Moderate verification requests', 'moderation', 'verifications', '2025-08-16 22:33:51.459556+00');


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "email", "first_name", "last_name", "full_name", "slug", "avatar_url", "bio", "location", "role", "status", "verification_status", "expertise_areas", "linkedin_url", "github_url", "website_url", "is_available", "timezone", "verified_at", "verification_notes", "created_at", "updated_at", "display_name") VALUES
	('06753fe4-05bc-4386-9350-29ba965cc68a', 'giuliasawaki8@gmail.com', 'Giulia', 'Sawaki', 'Giulia Sawaki', 'giulia-sawaki', 'https://lh3.googleusercontent.com/a/ACg8ocJgcUJ-v0Sn7KsDL3gN_D2DSjsjDVMl2xIY9sRBuNAyzgRYK5_U=s96-c', NULL, NULL, 'pending', 'pending', 'pending', NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, '2025-08-18 16:44:20.35556+00', '2025-08-18 16:44:20.35556+00', NULL),
	('cc09c6c6-0692-42de-ad47-bf92e1cfc2ba', 'matheusjosesantosalmeida@gmail.com', 'Matheus', 'Almeida', 'Matheus Almeida', 'matheus-almeida', 'https://lh3.googleusercontent.com/a/ACg8ocKwLJIoS64-WDQAutEI5gArSXEmsOq2gZOTpakkjus_rFQIFdc=s96-c', NULL, NULL, 'pending', 'pending', 'pending', NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, '2025-08-18 22:45:42.78057+00', '2025-08-18 22:45:42.78057+00', NULL),
	('b43816ad-7d50-4e7b-bbe1-b9cbab6e350a', 'contatoismaela@gmail.com', 'Ismaela', 'Silva', 'Ismaela Silva', 'ismaela-silva', NULL, NULL, NULL, 'mentor', 'active', 'active', NULL, 'https://www.linkedin.com/in/ismaela-silva/', NULL, NULL, true, NULL, NULL, NULL, '2025-08-17 02:59:57.819444+00', '2025-08-20 03:41:03.88209+00', NULL),
	('3eb7fa5c-4ee0-40ce-9cf3-93cc66108491', 'guilherme.morettti@gmail.com', 'Guilherme', 'Moretti', 'Guilherme Moretti', 'guilherme-moretti', NULL, NULL, NULL, 'pending', 'pending', 'pending', NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, '2025-08-22 21:23:30.431685+00', '2025-08-22 21:23:30.431685+00', NULL),
	('9dde9504-2e44-492e-808e-db4279c4f7f2', 'paulmspessoa@gmail.com', 'Paul', 'Pessoa', 'Paul Pessoa', 'paul-pessoa', 'https://lh3.googleusercontent.com/a/ACg8ocKUbSFOHoH_vWIpz67wQQ6lizkaLh_jxoL5aDNrUUyBY2Cg8KRt=s96-c', NULL, NULL, 'pending', 'pending', 'pending', NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, '2025-08-26 00:34:38.438872+00', '2025-08-26 00:34:38.438872+00', NULL),
	('d3c35c68-cdb3-42a4-ae65-f02196af2c2b', 'jeandepaula294@gmail.com', 'jeandepaula294@gmail.com', 'User', 'jeandepaula294@gmail.com User', 'jeandepaula294-gmail-com-user', NULL, NULL, NULL, 'pending', 'pending', 'pending', NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, '2025-08-26 00:50:42.688235+00', '2025-08-26 00:50:42.688235+00', NULL),
	('7a94b7de-4a3b-4224-aec2-60690b8f5d3b', 'amandahollanda@gmail.com', 'Amanda', 'Hollanda', 'Amanda Hollanda', 'amanda-hollanda', 'https://lh3.googleusercontent.com/a/ACg8ocL5uQWPLqhGlDHAMIIS40k4UiojWHgJ6KKbc6ANNewXYsyy39a5bQ=s96-c', NULL, NULL, 'pending', 'pending', 'pending', NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, '2025-08-27 00:01:23.606374+00', '2025-08-27 00:01:23.606374+00', NULL),
	('d1a05660-ce11-4097-b90c-bb11f39a2234', 'klebercastro22@hotmail.com', 'Kleber', 'Castro', 'Kleber Castro', 'kleber-castro', NULL, NULL, NULL, 'mentee', 'pending', 'active', NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, '2025-08-30 02:00:10.67754+00', '2025-08-30 02:00:10.67754+00', NULL);


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."roles" ("id", "name", "description", "is_system_role", "created_at", "updated_at") VALUES
	('acc9d0dc-ba7b-46a7-b07f-437a6e6cdab1', 'pending', 'User with incomplete registration', true, '2025-08-16 22:33:51.459556+00', '2025-08-16 22:33:51.459556+00'),
	('484cd9ab-14af-44c6-b3fa-349f2ab1c9d0', 'mentee', 'User seeking mentorship', true, '2025-08-16 22:33:51.459556+00', '2025-08-16 22:33:51.459556+00'),
	('1d39ff1e-f32c-4860-b305-7c700dc3c6d9', 'mentor', 'User providing mentorship', true, '2025-08-16 22:33:51.459556+00', '2025-08-16 22:33:51.459556+00'),
	('06e4e9f9-8b64-409e-8dea-7fe2381dc83f', 'admin', 'System administrator with full access', true, '2025-08-16 22:33:51.459556+00', '2025-08-16 22:33:51.459556+00'),
	('0319255b-65bb-4e6c-af9a-39ad0ae31286', 'volunteer', 'Platform volunteer', true, '2025-08-16 22:33:51.459556+00', '2025-08-16 22:33:51.459556+00'),
	('58784a31-0fc0-4841-850c-c1b2d5def17c', 'moderator', 'Content and verification moderator', true, '2025-08-16 22:33:51.459556+00', '2025-08-16 22:33:51.459556+00');


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."role_permissions" ("id", "role_id", "permission_id", "created_at") VALUES
	('98deb7d1-1fbe-46e5-ba6d-9a3c7d8ef8a8', '06e4e9f9-8b64-409e-8dea-7fe2381dc83f', '7475b7bf-abb6-4870-8835-f541f7d6ea3a', '2025-08-16 22:33:51.459556+00'),
	('7078b722-ba40-4809-a896-a8c0bd92f097', '06e4e9f9-8b64-409e-8dea-7fe2381dc83f', '0b6b6685-aeee-4a0a-a90e-7f718860fd3c', '2025-08-16 22:33:51.459556+00'),
	('191cd614-d856-48c4-9754-b563b3952638', '06e4e9f9-8b64-409e-8dea-7fe2381dc83f', '973852bb-7636-4013-8e59-284a196b8e11', '2025-08-16 22:33:51.459556+00'),
	('94c4fcde-e5c8-418d-ac47-f709a108eb6f', '06e4e9f9-8b64-409e-8dea-7fe2381dc83f', '357bf7b8-c74a-4fcb-a077-1da704fad94c', '2025-08-16 22:33:51.459556+00'),
	('5f00832d-4c87-49ab-97e1-edaa06bdc954', '06e4e9f9-8b64-409e-8dea-7fe2381dc83f', '277a18ca-62e8-4e79-b6e0-5c10cbf36a53', '2025-08-16 22:33:51.459556+00'),
	('a0be7efb-6393-4ad7-8374-26af53ef3a38', '06e4e9f9-8b64-409e-8dea-7fe2381dc83f', '95dd0bdd-9e6a-44e7-959a-7cee80f4d988', '2025-08-16 22:33:51.459556+00'),
	('b79ce1b5-85a4-4503-8926-97f44790618b', '06e4e9f9-8b64-409e-8dea-7fe2381dc83f', 'df8d6a36-8743-47a0-962f-bb32f9ae9eb8', '2025-08-16 22:33:51.459556+00'),
	('c7d49deb-54ba-4b9e-8344-54a373104423', '06e4e9f9-8b64-409e-8dea-7fe2381dc83f', 'aede2071-35c0-4019-8e58-606d6080a61f', '2025-08-16 22:33:51.459556+00'),
	('0b3fc77e-0f55-4285-be9f-66649db901d6', '06e4e9f9-8b64-409e-8dea-7fe2381dc83f', '1b95bfa5-8629-4795-aaac-1d896bc4a434', '2025-08-16 22:33:51.459556+00'),
	('bfd3e74c-41ee-4811-b3d1-3580a1d29326', '06e4e9f9-8b64-409e-8dea-7fe2381dc83f', '99487c7a-5778-46b3-9f67-149f555d4670', '2025-08-16 22:33:51.459556+00'),
	('3958d64e-52df-4ad6-9fee-92ad63ff907e', '06e4e9f9-8b64-409e-8dea-7fe2381dc83f', '322473db-b4b5-493c-9853-545074743f19', '2025-08-16 22:33:51.459556+00'),
	('4bd84171-a37e-4d78-a59b-ceb2d4ad8f1b', '06e4e9f9-8b64-409e-8dea-7fe2381dc83f', '020a8050-7dcd-43d4-a737-51f707cedaa3', '2025-08-16 22:33:51.459556+00'),
	('fb5eaea2-54cd-4b77-a341-7785bccf4359', '06e4e9f9-8b64-409e-8dea-7fe2381dc83f', 'f793bf97-5830-4827-b524-b8ba21530db3', '2025-08-16 22:33:51.459556+00'),
	('96ffcecc-d1d4-468c-a1c9-27d50670aec7', '1d39ff1e-f32c-4860-b305-7c700dc3c6d9', '7475b7bf-abb6-4870-8835-f541f7d6ea3a', '2025-08-16 22:33:51.459556+00'),
	('17bf88a9-166d-43ba-9dc3-2a297467320c', '1d39ff1e-f32c-4860-b305-7c700dc3c6d9', '0b6b6685-aeee-4a0a-a90e-7f718860fd3c', '2025-08-16 22:33:51.459556+00'),
	('5f1626a5-8538-4f1b-9fae-3fa4c5171cd1', '1d39ff1e-f32c-4860-b305-7c700dc3c6d9', '973852bb-7636-4013-8e59-284a196b8e11', '2025-08-16 22:33:51.459556+00'),
	('cf45ac38-aebd-434a-9df1-382cd3fc948d', '1d39ff1e-f32c-4860-b305-7c700dc3c6d9', '277a18ca-62e8-4e79-b6e0-5c10cbf36a53', '2025-08-16 22:33:51.459556+00'),
	('98ee32a3-bdcf-4fb7-ad46-352751a2db58', '1d39ff1e-f32c-4860-b305-7c700dc3c6d9', '95dd0bdd-9e6a-44e7-959a-7cee80f4d988', '2025-08-16 22:33:51.459556+00'),
	('8508ffb5-37ec-418d-a07a-89b037fcbbe6', '484cd9ab-14af-44c6-b3fa-349f2ab1c9d0', '7475b7bf-abb6-4870-8835-f541f7d6ea3a', '2025-08-16 22:33:51.459556+00'),
	('c1c97e29-fec9-49ec-b5e8-768ffc293626', '484cd9ab-14af-44c6-b3fa-349f2ab1c9d0', '0b6b6685-aeee-4a0a-a90e-7f718860fd3c', '2025-08-16 22:33:51.459556+00'),
	('7f1ae4b0-2714-49d9-aa34-2ff1f4aaaedf', '484cd9ab-14af-44c6-b3fa-349f2ab1c9d0', '973852bb-7636-4013-8e59-284a196b8e11', '2025-08-16 22:33:51.459556+00'),
	('dfad351d-8997-4a69-9300-666f39209e8f', '484cd9ab-14af-44c6-b3fa-349f2ab1c9d0', '357bf7b8-c74a-4fcb-a077-1da704fad94c', '2025-08-16 22:33:51.459556+00'),
	('da89d5d8-259b-4b8c-9664-cd0aba86640c', '58784a31-0fc0-4841-850c-c1b2d5def17c', '7475b7bf-abb6-4870-8835-f541f7d6ea3a', '2025-08-16 22:33:51.459556+00'),
	('16502098-b5f9-437a-a43d-5e5a1dd932f6', '58784a31-0fc0-4841-850c-c1b2d5def17c', '0b6b6685-aeee-4a0a-a90e-7f718860fd3c', '2025-08-16 22:33:51.459556+00'),
	('b6c96f6d-60a2-4be7-9416-8c67ad61cdfe', '58784a31-0fc0-4841-850c-c1b2d5def17c', 'aede2071-35c0-4019-8e58-606d6080a61f', '2025-08-16 22:33:51.459556+00'),
	('9d51ec15-fc67-4cb3-abf0-501ca877589a', '58784a31-0fc0-4841-850c-c1b2d5def17c', '020a8050-7dcd-43d4-a737-51f707cedaa3', '2025-08-16 22:33:51.459556+00'),
	('b0873d05-4e4d-408a-aba4-97c7a9861f43', '58784a31-0fc0-4841-850c-c1b2d5def17c', 'f793bf97-5830-4827-b524-b8ba21530db3', '2025-08-16 22:33:51.459556+00'),
	('9c028bd2-1da6-45aa-9917-cf0922495828', '0319255b-65bb-4e6c-af9a-39ad0ae31286', '7475b7bf-abb6-4870-8835-f541f7d6ea3a', '2025-08-16 22:33:51.459556+00'),
	('1d375a0f-f8d6-4f88-ace1-474fc48ae5fe', '0319255b-65bb-4e6c-af9a-39ad0ae31286', '0b6b6685-aeee-4a0a-a90e-7f718860fd3c', '2025-08-16 22:33:51.459556+00'),
	('f1ec057b-555e-48ee-b96b-d915f420b4d2', '0319255b-65bb-4e6c-af9a-39ad0ae31286', '322473db-b4b5-493c-9853-545074743f19', '2025-08-16 22:33:51.459556+00');


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_roles" ("id", "user_id", "role_id", "is_primary", "assigned_by", "assigned_at", "expires_at") VALUES
	('c257dffe-65aa-44d3-8946-54901e4f752a', 'b43816ad-7d50-4e7b-bbe1-b9cbab6e350a', 'acc9d0dc-ba7b-46a7-b07f-437a6e6cdab1', true, NULL, '2025-08-17 02:59:57.819444+00', NULL),
	('27566f7b-3f17-42a5-b265-4fdaa23b2473', '06753fe4-05bc-4386-9350-29ba965cc68a', 'acc9d0dc-ba7b-46a7-b07f-437a6e6cdab1', true, NULL, '2025-08-18 16:44:20.35556+00', NULL),
	('af7c6e81-4fdd-4c66-bd3a-dfa8927e95d4', 'cc09c6c6-0692-42de-ad47-bf92e1cfc2ba', 'acc9d0dc-ba7b-46a7-b07f-437a6e6cdab1', true, NULL, '2025-08-18 22:45:42.78057+00', NULL),
	('906fa825-664b-44bb-9a76-e34600b5a5df', '3eb7fa5c-4ee0-40ce-9cf3-93cc66108491', 'acc9d0dc-ba7b-46a7-b07f-437a6e6cdab1', true, NULL, '2025-08-22 21:23:30.431685+00', NULL),
	('ea00b847-0731-4db2-9092-0eb004fcd391', '9dde9504-2e44-492e-808e-db4279c4f7f2', 'acc9d0dc-ba7b-46a7-b07f-437a6e6cdab1', true, NULL, '2025-08-26 00:34:38.438872+00', NULL),
	('6b7f1f01-5924-4efb-b750-70011afdac14', 'd3c35c68-cdb3-42a4-ae65-f02196af2c2b', 'acc9d0dc-ba7b-46a7-b07f-437a6e6cdab1', true, NULL, '2025-08-26 00:50:42.688235+00', NULL),
	('0f5e7c85-f65e-444a-9841-2fff7ceaf3d5', '7a94b7de-4a3b-4224-aec2-60690b8f5d3b', 'acc9d0dc-ba7b-46a7-b07f-437a6e6cdab1', true, NULL, '2025-08-27 00:01:23.606374+00', NULL),
	('90e6c42e-378b-4d02-9f74-f6575b2c0c30', 'd1a05660-ce11-4097-b90c-bb11f39a2234', '484cd9ab-14af-44c6-b3fa-349f2ab1c9d0', true, NULL, '2025-08-30 02:00:10.67754+00', NULL);


--
-- Data for Name: validation_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: waiting_list; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('profiles', 'profiles', NULL, '2025-07-11 16:14:42.63345+00', '2025-07-11 16:14:42.63345+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('profile-photos', 'profile-photos', NULL, '2025-07-11 17:33:55.270245+00', '2025-07-11 17:33:55.270245+00', true, false, 5242880, '{image/jpeg,image/png,image/webp,image/gif}', NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata", "level") VALUES
	('8b8e6511-988b-4456-8981-b2cce9bf268a', 'profiles', 'PNG TRANSPARENTE BRANCO.png', NULL, '2025-08-12 21:58:49.10613+00', '2025-08-12 21:58:49.10613+00', '2025-08-12 21:58:49.10613+00', '{"eTag": "\"95e47a508c3d7bd75af795c4a6fe4afc-1\"", "size": 27390, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-08-12T21:58:49.000Z", "contentLength": 27390, "httpStatusCode": 200}', 'e80b43c3-f3b7-45aa-9297-4bf2189122dc', NULL, NULL, 1);


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 349, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
