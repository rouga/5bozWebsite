-- Table: public.active_games

-- DROP TABLE IF EXISTS public.active_games;

CREATE TABLE IF NOT EXISTS public.active_games
(
    id integer NOT NULL DEFAULT nextval('active_games_id_seq'::regclass),
    user_id integer,
    game_state jsonb NOT NULL,
    game_type character varying(20) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT active_games_pkey PRIMARY KEY (id),
    CONSTRAINT active_games_user_id_key UNIQUE (user_id),
    CONSTRAINT active_games_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.active_games
    OWNER to postgres;
-- Index: idx_active_games_user_id

-- DROP INDEX IF EXISTS public.idx_active_games_user_id;

CREATE INDEX IF NOT EXISTS idx_active_games_user_id
    ON public.active_games USING btree
    (user_id ASC NULLS LAST)
    TABLESPACE pg_default;




CREATE TABLE IF NOT EXISTS public.active_jaki_games
(
    id integer NOT NULL DEFAULT nextval('active_jaki_games_id_seq'::regclass),
    user_id integer NOT NULL,
    game_state jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT active_jaki_games_pkey PRIMARY KEY (id),
    CONSTRAINT active_jaki_games_user_id_key UNIQUE (user_id),
    CONSTRAINT active_jaki_games_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.active_jaki_games
    OWNER to postgres;


CREATE TABLE IF NOT EXISTS public.game_invitations
(
    id integer NOT NULL DEFAULT nextval('game_invitations_id_seq'::regclass),
    game_id character varying(255) COLLATE pg_catalog."default" NOT NULL,
    invited_by integer NOT NULL,
    invited_user integer NOT NULL,
    game_type character varying(20) COLLATE pg_catalog."default" NOT NULL,
    team_slot character varying(50) COLLATE pg_catalog."default",
    status character varying(20) COLLATE pg_catalog."default" DEFAULT 'pending'::character varying,
    expires_at timestamp without time zone DEFAULT (now() + '00:05:00'::interval),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    session_data jsonb,
    CONSTRAINT game_invitations_pkey PRIMARY KEY (id),
    CONSTRAINT game_invitations_invited_by_fkey FOREIGN KEY (invited_by)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT game_invitations_invited_user_fkey FOREIGN KEY (invited_user)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT game_invitations_game_type_check CHECK (game_type::text = ANY (ARRAY['chkan'::character varying, 's7ab'::character varying]::text[])),
    CONSTRAINT game_invitations_status_check CHECK (status::text = ANY (ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying, 'expired'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.game_invitations
    OWNER to postgres;
-- Index: idx_game_invitations_expires_at

-- DROP INDEX IF EXISTS public.idx_game_invitations_expires_at;

CREATE INDEX IF NOT EXISTS idx_game_invitations_expires_at
    ON public.game_invitations USING btree
    (expires_at ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE status::text = 'pending'::text;
-- Index: idx_game_invitations_game_id

-- DROP INDEX IF EXISTS public.idx_game_invitations_game_id;

CREATE INDEX IF NOT EXISTS idx_game_invitations_game_id
    ON public.game_invitations USING btree
    (game_id COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_game_invitations_invited_user

-- DROP INDEX IF EXISTS public.idx_game_invitations_invited_user;

CREATE INDEX IF NOT EXISTS idx_game_invitations_invited_user
    ON public.game_invitations USING btree
    (invited_user ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_game_invitations_invited_user_status

-- DROP INDEX IF EXISTS public.idx_game_invitations_invited_user_status;

CREATE INDEX IF NOT EXISTS idx_game_invitations_invited_user_status
    ON public.game_invitations USING btree
    (invited_user ASC NULLS LAST, status COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_game_invitations_status

-- DROP INDEX IF EXISTS public.idx_game_invitations_status;

CREATE INDEX IF NOT EXISTS idx_game_invitations_status
    ON public.game_invitations USING btree
    (status COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;


CREATE TABLE IF NOT EXISTS public.games
(
    id integer NOT NULL DEFAULT nextval('games_id_seq'::regclass),
    team1 text COLLATE pg_catalog."default",
    team2 text COLLATE pg_catalog."default",
    score1 integer,
    score2 integer,
    played_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    type character varying(50) COLLATE pg_catalog."default" DEFAULT 's7ab'::character varying,
    winners text COLLATE pg_catalog."default",
    losers text COLLATE pg_catalog."default",
    player_scores text COLLATE pg_catalog."default",
    game_data jsonb,
    created_at timestamp without time zone,
    CONSTRAINT games_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.games
    OWNER to postgres;
-- Index: idx_games_played_at

-- DROP INDEX IF EXISTS public.idx_games_played_at;

CREATE INDEX IF NOT EXISTS idx_games_played_at
    ON public.games USING btree
    (played_at ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_games_type

-- DROP INDEX IF EXISTS public.idx_games_type;

CREATE INDEX IF NOT EXISTS idx_games_type
    ON public.games USING btree
    (type COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;



CREATE TABLE IF NOT EXISTS public.users
(
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    username text COLLATE pg_catalog."default" NOT NULL,
    password text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_username_key UNIQUE (username)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;



CREATE TABLE IF NOT EXISTS jaki_games (
  id SERIAL PRIMARY KEY,
  player1 VARCHAR(100) NOT NULL,
  player2 VARCHAR(100) NOT NULL,
  score1 INTEGER NOT NULL,
  score2 INTEGER NOT NULL,
  winner VARCHAR(100) NOT NULL,
  winning_score INTEGER NOT NULL,
  total_rounds INTEGER NOT NULL,
  created_by_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL,
  played_at TIMESTAMPTZ NOT NULL,
  game_data JSONB
);