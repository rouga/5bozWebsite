--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4
-- Dumped by pg_dump version 15.4

-- Started on 2025-05-20 21:25:20

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
-- TOC entry 215 (class 1259 OID 16419)
-- Name: games; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.games (
    id integer NOT NULL,
    team1 text,
    team2 text,
    score1 integer,
    score2 integer,
    played_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    type character varying(50) DEFAULT 's7ab'::character varying,
    winners text,
    losers text,
    player_scores text,
    game_data jsonb,
    created_at timestamp without time zone
);


ALTER TABLE public.games OWNER TO postgres;

--
-- TOC entry 214 (class 1259 OID 16418)
-- Name: games_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.games_id_seq OWNER TO postgres;

--
-- TOC entry 3348 (class 0 OID 0)
-- Dependencies: 214
-- Name: games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.games_id_seq OWNED BY public.games.id;


--
-- TOC entry 3192 (class 2604 OID 16422)
-- Name: games id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games ALTER COLUMN id SET DEFAULT nextval('public.games_id_seq'::regclass);


--
-- TOC entry 3342 (class 0 OID 16419)
-- Dependencies: 215
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.games VALUES (90, NULL, NULL, NULL, NULL, '2025-05-19 03:08:51.085', 'chkan', 'abdou, as, ds', 'None', 'as: 130, abdou: 110, ds: 130', '{"type": "chkan", "losers": [], "players": [{"name": "as", "scores": [12, 32, 43, 43], "totalScore": 130, "isAuthenticated": false}, {"name": "abdou", "scores": [12, 32, 43, 23], "totalScore": 110, "isAuthenticated": true}, {"name": "ds", "scores": [12, 43, 43, 32], "totalScore": 130, "isAuthenticated": false}], "winners": ["abdou", "as", "ds"], "currentRound": 5, "roundWinners": [null, null, "as", "abdou"], "initialDealer": 0, "authenticatedPlayers": ["abdou"]}', '2025-05-19 03:06:48.046');
INSERT INTO public.games VALUES (91, 'Équipe 1', 'Équipe 2', 24, 2, '2025-05-19 03:26:18.588', 's7ab', NULL, NULL, NULL, '{"type": "s7ab", "teams": [{"name": "Équipe 1", "scores": [24, 0], "players": ["as", "ds"], "playerData": [{"name": "as", "totalScore": 12, "isAuthenticated": false}, {"name": "ds", "totalScore": 12, "isAuthenticated": false}], "totalScore": 24, "playerScores": [[12, 12], [0, 0]], "authenticatedPlayers": []}, {"name": "Équipe 2", "scores": [2, 0], "players": ["fs", "abdou"], "playerData": [{"name": "fs", "totalScore": 1, "isAuthenticated": false}, {"name": "abdou", "totalScore": 1, "isAuthenticated": true}], "totalScore": 2, "playerScores": [[1, 1], [0, 0]], "authenticatedPlayers": ["abdou"]}], "winner": "Équipe 2", "currentRound": 3, "roundWinners": ["as", null], "team1Players": ["as", "ds"], "team2Players": ["fs", "abdou"], "initialDealer": 0, "authenticatedPlayers": ["abdou"]}', '2025-05-19 03:24:34.349');
INSERT INTO public.games VALUES (92, 'Équipe 1', 'Équipe 2', 0, 0, '2025-05-19 03:33:03.344', 's7ab', NULL, NULL, NULL, '{"type": "s7ab", "teams": [{"name": "Équipe 1", "scores": [], "players": ["ds", "aa"], "playerData": [], "totalScore": 0, "authenticatedPlayers": []}, {"name": "Équipe 2", "scores": [], "players": ["as", "abdou"], "playerData": [], "totalScore": 0, "authenticatedPlayers": []}], "winner": "Équipe 1", "currentRound": 1, "team1Players": ["ds", "aa"], "team2Players": ["as", "abdou"], "initialDealer": 0, "authenticatedPlayers": []}', '2025-05-19 03:31:46.789');
INSERT INTO public.games VALUES (93, 'Équipe 1', 'Équipe 2', 1827, 2650, '2025-05-19 04:15:37.912', 's7ab', NULL, NULL, NULL, '{"type": "s7ab", "teams": [{"name": "Équipe 1", "scores": [0, 0, 2, 1, 824, 200, 200, 200, 400], "players": ["DSA", "DSAD"], "playerData": [{"name": "DSA", "totalScore": 1115, "isAuthenticated": false}, {"name": "DSAD", "totalScore": 712, "isAuthenticated": false}], "totalScore": 1827, "playerScores": [[0, 0], [0, 0], [2, 0], [1, 0], [412, 412], [100, 100], [100, 100], [100, 100], [400, 0]], "authenticatedPlayers": []}, {"name": "Équipe 2", "scores": [246, 64, 536, 8, 421, 421, 421, 433, 100], "players": ["DAS", "abdou"], "playerData": [{"name": "DAS", "totalScore": 2355, "isAuthenticated": false}, {"name": "abdou", "totalScore": 295, "isAuthenticated": true}], "totalScore": 2650, "playerScores": [[123, 123], [32, 32], [412, 124], [4, 4], [421, 0], [421, 0], [421, 0], [421, 12], [100, 0]], "authenticatedPlayers": ["abdou"]}], "winner": "Équipe 1", "currentRound": 10, "roundWinners": ["DSA", "DSA", "DSAD", "DSA", "abdou", "abdou", null, null, "abdou"], "team1Players": ["DSA", "DSAD"], "team2Players": ["DAS", "abdou"], "initialDealer": 0, "authenticatedPlayers": ["abdou"]}', '2025-05-19 04:01:06.407');
INSERT INTO public.games VALUES (94, NULL, NULL, NULL, NULL, '2025-05-19 04:21:18.331', 'chkan', 'as, fs, ds, abdou', 'None', 'as: 0, fs: 0, ds: 0, abdou: 0', '{"type": "chkan", "losers": [], "players": [{"name": "as", "scores": [], "totalScore": 0, "isAuthenticated": false}, {"name": "fs", "scores": [], "totalScore": 0, "isAuthenticated": false}, {"name": "ds", "scores": [], "totalScore": 0, "isAuthenticated": false}, {"name": "abdou", "scores": [], "totalScore": 0, "isAuthenticated": true}], "winners": ["as", "fs", "ds", "abdou"], "currentRound": 1, "initialDealer": 0, "authenticatedPlayers": ["abdou"]}', '2025-05-19 04:20:17.879');
INSERT INTO public.games VALUES (95, 'Équipe 1', 'Équipe 2', 26, 2, '2025-05-20 03:32:33.273', 's7ab', NULL, NULL, NULL, '{"type": "s7ab", "teams": [{"name": "Équipe 1", "scores": [0, 4, 22], "players": ["as", "ds"], "playerData": [{"name": "as", "totalScore": 13, "isAuthenticated": false}, {"name": "ds", "totalScore": 13, "isAuthenticated": false}], "totalScore": 26, "playerScores": [[0, 0], [2, 2], [11, 11]], "authenticatedPlayers": []}, {"name": "Équipe 2", "scores": [2, 0, 0], "players": ["abdou", "fs"], "playerData": [{"name": "abdou", "totalScore": 1, "isAuthenticated": true}, {"name": "fs", "totalScore": 1, "isAuthenticated": false}], "totalScore": 2, "playerScores": [[1, 1], [0, 0], [0, 0]], "authenticatedPlayers": ["abdou"]}], "winner": "Équipe 2", "currentRound": 4, "roundWinners": ["as", "fs", "abdou"], "team1Players": ["as", "ds"], "team2Players": ["abdou", "fs"], "initialDealer": 0, "authenticatedPlayers": ["abdou"]}', '2025-05-20 03:32:00.942');
INSERT INTO public.games VALUES (96, NULL, NULL, NULL, NULL, '2025-05-20 03:38:15.054', 'chkan', 'as, abdou, fs, ds', 'None', 'as: -40, abdou: 110, fs: 200, ds: 200', '{"type": "chkan", "losers": [], "players": [{"name": "as", "scores": [-30, -10], "totalScore": -40, "isAuthenticated": false}, {"name": "abdou", "scores": [100, 10], "totalScore": 110, "isAuthenticated": true}, {"name": "fs", "scores": [100, 100], "totalScore": 200, "isAuthenticated": false}, {"name": "ds", "scores": [100, 100], "totalScore": 200, "isAuthenticated": false}], "winners": ["as", "abdou", "fs", "ds"], "currentRound": 3, "roundWinners": ["as", "as"], "initialDealer": 0, "authenticatedPlayers": ["abdou"]}', '2025-05-20 03:36:00.469');
INSERT INTO public.games VALUES (97, NULL, NULL, NULL, NULL, '2025-05-20 22:37:32.774', 'chkan', 'fs, abdou', 'ds, as', 'fs: 190, abdou: 520, ds: 720, as: 720', '{"type": "chkan", "losers": ["ds", "as"], "players": [{"name": "fs", "scores": [200, -30, 20], "totalScore": 190, "isAuthenticated": false}, {"name": "abdou", "scores": [400, 100, 20], "totalScore": 520, "isAuthenticated": true}, {"name": "ds", "scores": [600, 100, 20], "totalScore": 720, "isAuthenticated": false}, {"name": "as", "scores": [800, -200, 100, 20], "isMgagi": true, "totalScore": 720, "isAuthenticated": false}], "winners": ["fs", "abdou"], "currentRound": 5, "roundWinners": [null, "fs", null], "initialDealer": 0, "authenticatedPlayers": ["abdou"]}', '2025-05-20 22:28:30.391');
INSERT INTO public.games VALUES (98, 'Équipe 1', 'Équipe 2', 700, 3600, '2025-05-20 22:38:26.919', 's7ab', NULL, NULL, NULL, '{"type": "s7ab", "teams": [{"name": "Équipe 1", "scores": [700, 0], "players": ["as", "fs"], "playerData": [{"name": "as", "totalScore": 700, "isAuthenticated": false}, {"name": "fs", "totalScore": 0, "isAuthenticated": false}], "totalScore": 700, "playerScores": [[700, 0], [0, 0]], "authenticatedPlayers": []}, {"name": "Équipe 2", "scores": [1800, 1800], "players": ["ds", "abdou"], "playerData": [{"name": "ds", "totalScore": 1800, "isAuthenticated": false}, {"name": "abdou", "totalScore": 1800, "isAuthenticated": true}], "totalScore": 3600, "playerScores": [[900, 900], [900, 900]], "authenticatedPlayers": ["abdou"]}], "winner": "Équipe 1", "currentRound": 3, "roundWinners": ["as", "as"], "team1Players": ["as", "fs"], "team2Players": ["ds", "abdou"], "initialDealer": 0, "authenticatedPlayers": ["abdou"]}', '2025-05-20 22:38:02.556');
INSERT INTO public.games VALUES (99, NULL, NULL, NULL, NULL, '2025-05-20 22:45:46.636', 'chkan', 'as, abdou, ds', 'fs', 'as: -20, fs: 799, ds: 649, abdou: 550', '{"type": "chkan", "losers": ["fs"], "players": [{"name": "as", "scores": [-10, -10], "totalScore": -20, "isAuthenticated": false}, {"name": "fs", "scores": [800, -201, 200], "isMgagi": true, "totalScore": 799, "isAuthenticated": false}, {"name": "ds", "scores": [599, 50], "totalScore": 649, "isAuthenticated": false}, {"name": "abdou", "scores": [500, 50], "totalScore": 550, "isAuthenticated": true}], "winners": ["as", "abdou", "ds"], "currentRound": 4, "roundWinners": ["as", "as"], "initialDealer": 0, "authenticatedPlayers": ["abdou"]}', '2025-05-20 22:45:03.406');


--
-- TOC entry 3349 (class 0 OID 0)
-- Dependencies: 214
-- Name: games_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.games_id_seq', 99, true);


--
-- TOC entry 3196 (class 2606 OID 16427)
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- TOC entry 3197 (class 1259 OID 16441)
-- Name: idx_games_played_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_games_played_at ON public.games USING btree (played_at);


--
-- TOC entry 3198 (class 1259 OID 16440)
-- Name: idx_games_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_games_type ON public.games USING btree (type);


-- Completed on 2025-05-20 21:25:21

--
-- PostgreSQL database dump complete
--

