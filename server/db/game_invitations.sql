--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4
-- Dumped by pg_dump version 15.4

-- Started on 2025-05-20 21:33:08

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
-- TOC entry 221 (class 1259 OID 16462)
-- Name: game_invitations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.game_invitations (
    id integer NOT NULL,
    game_id character varying(255) NOT NULL,
    invited_by integer NOT NULL,
    invited_user integer NOT NULL,
    game_type character varying(20) NOT NULL,
    team_slot character varying(50),
    status character varying(20) DEFAULT 'pending'::character varying,
    expires_at timestamp without time zone DEFAULT (now() + '00:05:00'::interval),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    session_data jsonb,
    CONSTRAINT game_invitations_game_type_check CHECK (((game_type)::text = ANY (ARRAY[('chkan'::character varying)::text, ('s7ab'::character varying)::text, ('jaki'::character varying)::text]))),
    CONSTRAINT game_invitations_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying, 'expired'::character varying])::text[])))
);


ALTER TABLE public.game_invitations OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16461)
-- Name: game_invitations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.game_invitations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.game_invitations_id_seq OWNER TO postgres;

--
-- TOC entry 3357 (class 0 OID 0)
-- Dependencies: 220
-- Name: game_invitations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.game_invitations_id_seq OWNED BY public.game_invitations.id;


--
-- TOC entry 3192 (class 2604 OID 16465)
-- Name: game_invitations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game_invitations ALTER COLUMN id SET DEFAULT nextval('public.game_invitations_id_seq'::regclass);


--
-- TOC entry 3351 (class 0 OID 16462)
-- Dependencies: 221
-- Data for Name: game_invitations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.game_invitations (id, game_id, invited_by, invited_user, game_type, team_slot, status, expires_at, created_at, updated_at, session_data) VALUES (76, 'jaki-game-1747778901039-mgbrhrmsw', 13, 11, 'jaki', 'player1', 'accepted', '2025-05-20 18:13:21.068', '2025-05-20 18:08:21.069176', '2025-05-20 18:08:29.20415', '[{"teamSlot": "player1", "username": "aa", "isRegistered": true}, {"teamSlot": "player2", "username": "abdou", "isRegistered": true}]');
INSERT INTO public.game_invitations (id, game_id, invited_by, invited_user, game_type, team_slot, status, expires_at, created_at, updated_at, session_data) VALUES (77, 'jaki-game-1747779437958-te6dd1tut', 13, 11, 'jaki', 'player1', 'accepted', '2025-05-20 18:22:17.963', '2025-05-20 18:17:17.963605', '2025-05-20 18:17:36.476788', '[{"teamSlot": "player1", "username": "aa", "isRegistered": true}, {"teamSlot": "player2", "username": "abdou", "isRegistered": true}]');
INSERT INTO public.game_invitations (id, game_id, invited_by, invited_user, game_type, team_slot, status, expires_at, created_at, updated_at, session_data) VALUES (49, 'game-1747625465493-rnxu3ubfg', 13, 11, 's7ab', 'team1-player2', 'accepted', '2025-05-18 23:36:05.524', '2025-05-18 23:31:05.524869', '2025-05-18 23:31:44.343461', '[{"teamSlot": "team1-player1", "username": "ds", "isRegistered": false}, {"teamSlot": "team1-player2", "username": "aa", "isRegistered": true}, {"teamSlot": "team2-player1", "username": "as", "isRegistered": false}, {"teamSlot": "team2-player2", "username": "abdou", "isRegistered": true}]');
INSERT INTO public.game_invitations (id, game_id, invited_by, invited_user, game_type, team_slot, status, expires_at, created_at, updated_at, session_data) VALUES (67, 'game-1747777611332-krwkkfmot', 13, 11, 's7ab', 'team1-player2', 'pending', '2025-05-20 17:51:51.337', '2025-05-20 17:46:51.337869', '2025-05-20 17:46:51.337869', '[{"teamSlot": "team1-player1", "username": "as", "isRegistered": false}, {"teamSlot": "team1-player2", "username": "aa", "isRegistered": true}, {"teamSlot": "team2-player1", "username": "abdou", "isRegistered": true}, {"teamSlot": "team2-player2", "username": "ds", "isRegistered": false}]');
INSERT INTO public.game_invitations (id, game_id, invited_by, invited_user, game_type, team_slot, status, expires_at, created_at, updated_at, session_data) VALUES (74, 'jaki-1747778728710-vntgef1nd', 13, 12, 'chkan', 'player1', 'pending', '2025-05-20 18:10:28.741', '2025-05-20 18:05:28.742202', '2025-05-20 18:05:28.742202', '[{"teamSlot": "player1", "username": "aaa", "isRegistered": true}, {"teamSlot": "player2", "username": "abdou", "isRegistered": true}]');
INSERT INTO public.game_invitations (id, game_id, invited_by, invited_user, game_type, team_slot, status, expires_at, created_at, updated_at, session_data) VALUES (75, 'jaki-1747778747571-sswpkqzzg', 13, 11, 'chkan', 'player1', 'accepted', '2025-05-20 18:10:47.602', '2025-05-20 18:05:47.602824', '2025-05-20 18:06:35.936602', '[{"teamSlot": "player1", "username": "aa", "isRegistered": true}, {"teamSlot": "player2", "username": "abdou", "isRegistered": true}]');


--
-- TOC entry 3358 (class 0 OID 0)
-- Dependencies: 220
-- Name: game_invitations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.game_invitations_id_seq', 77, true);


--
-- TOC entry 3200 (class 2606 OID 16473)
-- Name: game_invitations game_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game_invitations
    ADD CONSTRAINT game_invitations_pkey PRIMARY KEY (id);


--
-- TOC entry 3201 (class 1259 OID 16490)
-- Name: idx_game_invitations_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_game_invitations_expires_at ON public.game_invitations USING btree (expires_at) WHERE ((status)::text = 'pending'::text);


--
-- TOC entry 3202 (class 1259 OID 16484)
-- Name: idx_game_invitations_game_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_game_invitations_game_id ON public.game_invitations USING btree (game_id);


--
-- TOC entry 3203 (class 1259 OID 16485)
-- Name: idx_game_invitations_invited_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_game_invitations_invited_user ON public.game_invitations USING btree (invited_user);


--
-- TOC entry 3204 (class 1259 OID 16489)
-- Name: idx_game_invitations_invited_user_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_game_invitations_invited_user_status ON public.game_invitations USING btree (invited_user, status);


--
-- TOC entry 3205 (class 1259 OID 16486)
-- Name: idx_game_invitations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_game_invitations_status ON public.game_invitations USING btree (status);


--
-- TOC entry 3206 (class 2606 OID 16474)
-- Name: game_invitations game_invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game_invitations
    ADD CONSTRAINT game_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id);


--
-- TOC entry 3207 (class 2606 OID 16479)
-- Name: game_invitations game_invitations_invited_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game_invitations
    ADD CONSTRAINT game_invitations_invited_user_fkey FOREIGN KEY (invited_user) REFERENCES public.users(id);


-- Completed on 2025-05-20 21:33:08

--
-- PostgreSQL database dump complete
--

