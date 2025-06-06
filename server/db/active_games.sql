--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4
-- Dumped by pg_dump version 15.4

-- Started on 2025-05-20 21:31:27

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
-- TOC entry 219 (class 1259 OID 16443)
-- Name: active_games; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.active_games (
    id integer NOT NULL,
    user_id integer,
    game_state jsonb NOT NULL,
    game_type character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.active_games OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16442)
-- Name: active_games_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.active_games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.active_games_id_seq OWNER TO postgres;

--
-- TOC entry 3350 (class 0 OID 0)
-- Dependencies: 218
-- Name: active_games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.active_games_id_seq OWNED BY public.active_games.id;


--
-- TOC entry 3192 (class 2604 OID 16446)
-- Name: active_games id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_games ALTER COLUMN id SET DEFAULT nextval('public.active_games_id_seq'::regclass);


--
-- TOC entry 3344 (class 0 OID 16443)
-- Dependencies: 219
-- Data for Name: active_games; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 3351 (class 0 OID 0)
-- Dependencies: 218
-- Name: active_games_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.active_games_id_seq', 67, true);


--
-- TOC entry 3196 (class 2606 OID 16452)
-- Name: active_games active_games_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_games
    ADD CONSTRAINT active_games_pkey PRIMARY KEY (id);


--
-- TOC entry 3198 (class 2606 OID 16454)
-- Name: active_games active_games_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_games
    ADD CONSTRAINT active_games_user_id_key UNIQUE (user_id);


--
-- TOC entry 3199 (class 1259 OID 16460)
-- Name: idx_active_games_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_active_games_user_id ON public.active_games USING btree (user_id);


--
-- TOC entry 3200 (class 2606 OID 16455)
-- Name: active_games active_games_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_games
    ADD CONSTRAINT active_games_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2025-05-20 21:31:27

--
-- PostgreSQL database dump complete
--

