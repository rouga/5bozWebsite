--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4
-- Dumped by pg_dump version 15.4

-- Started on 2025-05-20 21:32:05

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 225 (class 1259 OID 16506)
-- Name: active_jaki_games; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.active_jaki_games (
    id integer NOT NULL,
    user_id integer NOT NULL,
    game_state jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.active_jaki_games OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16505)
-- Name: active_jaki_games_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.active_jaki_games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.active_jaki_games_id_seq OWNER TO postgres;

--
-- TOC entry 3349 (class 0 OID 0)
-- Dependencies: 224
-- Name: active_jaki_games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.active_jaki_games_id_seq OWNED BY public.active_jaki_games.id;


--
-- TOC entry 3192 (class 2604 OID 16509)
-- Name: active_jaki_games id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_jaki_games ALTER COLUMN id SET DEFAULT nextval('public.active_jaki_games_id_seq'::regclass);


--
-- TOC entry 3343 (class 0 OID 16506)
-- Dependencies: 225
-- Data for Name: active_jaki_games; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 3350 (class 0 OID 0)
-- Dependencies: 224
-- Name: active_jaki_games_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.active_jaki_games_id_seq', 8, true);


--
-- TOC entry 3196 (class 2606 OID 16515)
-- Name: active_jaki_games active_jaki_games_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_jaki_games
    ADD CONSTRAINT active_jaki_games_pkey PRIMARY KEY (id);


--
-- TOC entry 3198 (class 2606 OID 16517)
-- Name: active_jaki_games active_jaki_games_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_jaki_games
    ADD CONSTRAINT active_jaki_games_user_id_key UNIQUE (user_id);


--
-- TOC entry 3199 (class 2606 OID 16518)
-- Name: active_jaki_games active_jaki_games_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_jaki_games
    ADD CONSTRAINT active_jaki_games_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


-- Completed on 2025-05-20 21:32:05

--
-- PostgreSQL database dump complete
--

