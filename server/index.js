const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const bcrypt = require('bcrypt');

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/api/scores', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM games ORDER BY played_at DESC');
  res.json(rows);
});

app.post('/api/scores', async (req, res) => {
  const { team1, team2, score1, score2 } = req.body;
  const result = await pool.query(
    'INSERT INTO games (team1, team2, score1, score2) VALUES ($1, $2, $3, $4) RETURNING *',
    [team1, team2, score1, score2]
  );
  res.json(result.rows[0]);
});

app.post('/api/signup', async (req, res) => {
  const { username, password, code } = req.body;

  if (code.length < 6) {
    return res.status(403).json({ error: 'Password should contain at least 6 characters' });
  }

  if (username.length > 20) {
    return res.status(403).json({ error: 'Username too long' });
  }


  if (code !== process.env.SIGNUP_SECRET) {
    return res.status(403).json({ error: 'Invalid signup code' });
  }

  try {
    const existing = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));