--
-- PostgreSQL database dump
--

\restrict WtnP02BruvqSQgCacU8tIwZMfS3dnRibaj4o5F1bPgjeEyJcYnBAZgvfmc1hhLC

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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
-- Data for Name: content; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.content (id, title, type, description, order_number) VALUES (1, 'X-Men', 'movie', 'En un mundo idéntico al nuestro, el siguiente paso de la selección natural no llega de forma gradual, sino como un estallido genético: el Factor-X. Personas comunes descubren de la noche a la mañana que poseen habilidades extraordinarias y aterradoras. No son héroes por elección; son anomalías biológicas en un planeta que odia lo que no comprende.', 1);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users (id, name) VALUES (1, 'Manuel');
INSERT INTO public.users (id, name) VALUES (2, 'Jovan');


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.reviews (id, user_id, content_id, watched, rating, review, watched_at) VALUES (1, 1, 1, true, 8, 'una reinterpretación bastante buena de los personajes, que si se siente algo oscura, para su epoca se sienten bastante novedosos y ha envejecido bastante bien, me hubiera gustado verla en cines', '2026-09-30 00:11:57.043347');


--
-- Name: content_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.content_id_seq', 1, true);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- PostgreSQL database dump complete
--

\unrestrict WtnP02BruvqSQgCacU8tIwZMfS3dnRibaj4o5F1bPgjeEyJcYnBAZgvfmc1hhLC

