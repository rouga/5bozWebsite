--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4
-- Dumped by pg_dump version 15.4

-- Started on 2025-05-20 21:33:55

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
-- TOC entry 223 (class 1259 OID 16492)
-- Name: jaki_games; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jaki_games (
    id integer NOT NULL,
    player1 character varying(100) NOT NULL,
    player2 character varying(100) NOT NULL,
    score1 integer NOT NULL,
    score2 integer NOT NULL,
    winner character varying(100) NOT NULL,
    winning_score integer NOT NULL,
    total_rounds integer NOT NULL,
    created_by_user_id integer,
    created_at timestamp with time zone NOT NULL,
    played_at timestamp with time zone NOT NULL,
    game_data jsonb
);


ALTER TABLE public.jaki_games OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16491)
-- Name: jaki_games_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jaki_games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.jaki_games_id_seq OWNER TO postgres;

--
-- TOC entry 3350 (class 0 OID 0)
-- Dependencies: 222
-- Name: jaki_games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jaki_games_id_seq OWNED BY public.jaki_games.id;


--
-- TOC entry 3192 (class 2604 OID 16495)
-- Name: jaki_games id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jaki_games ALTER COLUMN id SET DEFAULT nextval('public.jaki_games_id_seq'::regclass);


--
-- TOC entry 3344 (class 0 OID 16492)
-- Dependencies: 223
-- Data for Name: jaki_games; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.jaki_games (id, player1, player2, score1, score2, winner, winning_score, total_rounds, created_by_user_id, created_at, played_at, game_data) VALUES (1, 'as', 'abdou', 1, 7, 'abdou', 7, 5, 13, '2025-05-20 12:57:40.936-04', '2025-05-20 12:58:45.536-04', '{"type": "jaki", "rounds": [{"points": 2, "winner": "abdou", "isMrass": true, "roundNumber": 1}, {"points": 1, "winner": "as", "isMrass": false, "roundNumber": 2}, {"points": 1, "winner": "abdou", "isMrass": false, "roundNumber": 3}, {"points": 2, "winner": "abdou", "isMrass": true, "roundNumber": 4}, {"points": 2, "winner": "abdou", "isMrass": true, "roundNumber": 5}], "winner": "abdou", "players": [{"name": "as", "score": 1, "rounds": [{"points": 1, "isMrass": false, "roundNumber": 2}]}, {"name": "abdou", "score": 7, "rounds": [{"points": 2, "isMrass": true, "roundNumber": 1}, {"points": 1, "isMrass": false, "roundNumber": 3}, {"points": 2, "isMrass": true, "roundNumber": 4}, {"points": 2, "isMrass": true, "roundNumber": 5}]}], "completed": true, "currentRound": 6, "winningScore": 7}');
INSERT INTO public.jaki_games (id, player1, player2, score1, score2, winner, winning_score, total_rounds, created_by_user_id, created_at, played_at, game_data) VALUES (2, 'as', 'abdou', 1, 7, 'abdou', 7, 5, 13, '2025-05-20 12:58:45.663-04', '2025-05-20 13:00:22.929-04', '{"type": "jaki", "rounds": [{"points": 2, "winner": "abdou", "isMrass": true, "roundNumber": 1}, {"points": 1, "winner": "as", "isMrass": false, "roundNumber": 2}, {"points": 1, "winner": "abdou", "isMrass": false, "roundNumber": 3}, {"points": 2, "winner": "abdou", "isMrass": true, "roundNumber": 4}, {"points": 2, "winner": "abdou", "isMrass": true, "roundNumber": 5}], "winner": "abdou", "players": [{"name": "as", "score": 1, "rounds": [{"points": 1, "isMrass": false, "roundNumber": 2}]}, {"name": "abdou", "score": 7, "rounds": [{"points": 2, "isMrass": true, "roundNumber": 1}, {"points": 1, "isMrass": false, "roundNumber": 3}, {"points": 2, "isMrass": true, "roundNumber": 4}, {"points": 2, "isMrass": true, "roundNumber": 5}]}], "completed": true, "currentRound": 6, "winningScore": 7}');
INSERT INTO public.jaki_games (id, player1, player2, score1, score2, winner, winning_score, total_rounds, created_by_user_id, created_at, played_at, game_data) VALUES (3, 'as', 'abdou', 0, 2, 'abdou', 2, 1, 13, '2025-05-20 13:00:44.476-04', '2025-05-20 13:00:48.097-04', '{"type": "jaki", "rounds": [{"points": 2, "winner": "abdou", "isMrass": true, "roundNumber": 1}], "winner": "abdou", "players": [{"name": "as", "score": 0, "rounds": []}, {"name": "abdou", "score": 2, "rounds": [{"points": 2, "isMrass": true, "roundNumber": 1}]}], "completed": true, "currentRound": 2, "winningScore": 2}');
INSERT INTO public.jaki_games (id, player1, player2, score1, score2, winner, winning_score, total_rounds, created_by_user_id, created_at, played_at, game_data) VALUES (4, 'ds', 'abdou', 3, 8, 'abdou', 7, 6, 13, '2025-05-20 13:01:07.682-04', '2025-05-20 13:01:17.908-04', '{"type": "jaki", "rounds": [{"points": 2, "winner": "abdou", "isMrass": true, "roundNumber": 1}, {"points": 2, "winner": "ds", "isMrass": true, "roundNumber": 2}, {"points": 2, "winner": "abdou", "isMrass": true, "roundNumber": 3}, {"points": 2, "winner": "abdou", "isMrass": true, "roundNumber": 4}, {"points": 1, "winner": "ds", "isMrass": false, "roundNumber": 5}, {"points": 2, "winner": "abdou", "isMrass": true, "roundNumber": 6}], "winner": "abdou", "players": [{"name": "ds", "score": 3, "rounds": [{"points": 2, "isMrass": true, "roundNumber": 2}, {"points": 1, "isMrass": false, "roundNumber": 5}]}, {"name": "abdou", "score": 8, "rounds": [{"points": 2, "isMrass": true, "roundNumber": 1}, {"points": 2, "isMrass": true, "roundNumber": 3}, {"points": 2, "isMrass": true, "roundNumber": 4}, {"points": 2, "isMrass": true, "roundNumber": 6}]}], "completed": true, "currentRound": 7, "winningScore": 7}');
INSERT INTO public.jaki_games (id, player1, player2, score1, score2, winner, winning_score, total_rounds, created_by_user_id, created_at, played_at, game_data) VALUES (5, 'ds', 'abdou', 7, 0, 'ds', 7, 4, 13, '2025-05-20 13:01:36.689-04', '2025-05-20 13:01:43.381-04', '{"type": "jaki", "rounds": [{"points": 2, "winner": "ds", "isMrass": true, "roundNumber": 1}, {"points": 2, "winner": "ds", "isMrass": true, "roundNumber": 2}, {"points": 1, "winner": "ds", "isMrass": false, "roundNumber": 3}, {"points": 2, "winner": "ds", "isMrass": true, "roundNumber": 4}], "winner": "ds", "players": [{"name": "ds", "score": 7, "rounds": [{"points": 2, "isMrass": true, "roundNumber": 1}, {"points": 2, "isMrass": true, "roundNumber": 2}, {"points": 1, "isMrass": false, "roundNumber": 3}, {"points": 2, "isMrass": true, "roundNumber": 4}]}, {"name": "abdou", "score": 0, "rounds": []}], "completed": true, "currentRound": 5, "winningScore": 7}');
INSERT INTO public.jaki_games (id, player1, player2, score1, score2, winner, winning_score, total_rounds, created_by_user_id, created_at, played_at, game_data) VALUES (6, 'aa', 'abdou', 8, 0, 'aa', 7, 4, 13, '2025-05-20 18:10:16.696-04', '2025-05-20 18:10:28.106-04', '{"type": "jaki", "rounds": [{"points": 2, "winner": "aa", "isMrass": true, "roundNumber": 1}, {"points": 2, "winner": "aa", "isMrass": true, "roundNumber": 2}, {"points": 2, "winner": "aa", "isMrass": true, "roundNumber": 3}, {"points": 2, "winner": "aa", "isMrass": true, "roundNumber": 4}], "winner": "aa", "players": [{"name": "aa", "score": 8, "rounds": [{"points": 2, "isMrass": true, "roundNumber": 1}, {"points": 2, "isMrass": true, "roundNumber": 2}, {"points": 2, "isMrass": true, "roundNumber": 3}, {"points": 2, "isMrass": true, "roundNumber": 4}]}, {"name": "abdou", "score": 0, "rounds": []}], "completed": true, "currentRound": 5, "winningScore": 7}');
INSERT INTO public.jaki_games (id, player1, player2, score1, score2, winner, winning_score, total_rounds, created_by_user_id, created_at, played_at, game_data) VALUES (7, 'fs', 'abdou', 0, 8, 'abdou', 7, 4, 13, '2025-05-20 18:15:24.834-04', '2025-05-20 18:15:32.189-04', '{"type": "jaki", "rounds": [{"points": 2, "winner": "abdou", "isMrass": true, "roundNumber": 1}, {"points": 2, "winner": "abdou", "isMrass": true, "roundNumber": 2}, {"points": 2, "winner": "abdou", "isMrass": true, "roundNumber": 3}, {"points": 2, "winner": "abdou", "isMrass": true, "roundNumber": 4}], "winner": "abdou", "players": [{"name": "fs", "score": 0, "rounds": []}, {"name": "abdou", "score": 8, "rounds": [{"points": 2, "isMrass": true, "roundNumber": 1}, {"points": 2, "isMrass": true, "roundNumber": 2}, {"points": 2, "isMrass": true, "roundNumber": 3}, {"points": 2, "isMrass": true, "roundNumber": 4}]}], "completed": true, "currentRound": 5, "winningScore": 7, "authenticatedPlayers": ["abdou"]}');
INSERT INTO public.jaki_games (id, player1, player2, score1, score2, winner, winning_score, total_rounds, created_by_user_id, created_at, played_at, game_data) VALUES (8, 'aa', 'abdou', 0, 2, 'abdou', 2, 1, 13, '2025-05-20 18:17:38.629-04', '2025-05-20 18:17:42.535-04', '{"type": "jaki", "rounds": [{"points": 2, "winner": "abdou", "isMrass": true, "roundNumber": 1}], "winner": "abdou", "players": [{"name": "aa", "score": 0, "rounds": []}, {"name": "abdou", "score": 2, "rounds": [{"points": 2, "isMrass": true, "roundNumber": 1}]}], "completed": true, "currentRound": 2, "winningScore": 2, "authenticatedPlayers": ["aa", "abdou"]}');


--
-- TOC entry 3351 (class 0 OID 0)
-- Dependencies: 222
-- Name: jaki_games_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jaki_games_id_seq', 8, true);


--
-- TOC entry 3199 (class 2606 OID 16499)
-- Name: jaki_games jaki_games_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jaki_games
    ADD CONSTRAINT jaki_games_pkey PRIMARY KEY (id);


--
-- TOC entry 3193 (class 1259 OID 16526)
-- Name: idx_jaki_games_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jaki_games_created_at ON public.jaki_games USING btree (created_at);


--
-- TOC entry 3194 (class 1259 OID 16527)
-- Name: idx_jaki_games_played_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jaki_games_played_at ON public.jaki_games USING btree (played_at);


--
-- TOC entry 3195 (class 1259 OID 16523)
-- Name: idx_jaki_games_player1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jaki_games_player1 ON public.jaki_games USING btree (player1);


--
-- TOC entry 3196 (class 1259 OID 16524)
-- Name: idx_jaki_games_player2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jaki_games_player2 ON public.jaki_games USING btree (player2);


--
-- TOC entry 3197 (class 1259 OID 16525)
-- Name: idx_jaki_games_winner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jaki_games_winner ON public.jaki_games USING btree (winner);


--
-- TOC entry 3200 (class 2606 OID 16500)
-- Name: jaki_games jaki_games_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jaki_games
    ADD CONSTRAINT jaki_games_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


-- Completed on 2025-05-20 21:33:55

--
-- PostgreSQL database dump complete
--

