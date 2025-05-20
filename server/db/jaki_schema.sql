-- Create jaki_games table
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

-- Create active_jaki_games table
CREATE TABLE IF NOT EXISTS active_jaki_games (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) UNIQUE NOT NULL,
  game_state JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on player names and winner
CREATE INDEX IF NOT EXISTS idx_jaki_games_player1 ON jaki_games(player1);
CREATE INDEX IF NOT EXISTS idx_jaki_games_player2 ON jaki_games(player2);
CREATE INDEX IF NOT EXISTS idx_jaki_games_winner ON jaki_games(winner);

-- Create index on creation and play dates
CREATE INDEX IF NOT EXISTS idx_jaki_games_created_at ON jaki_games(created_at);
CREATE INDEX IF NOT EXISTS idx_jaki_games_played_at ON jaki_games(played_at);