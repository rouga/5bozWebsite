const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({credentials: true, origin: "http://192.168.0.12:5173"}));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: false, // true if using HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 12 // 12 hours
  }
}));

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

// Singup request
app.post('/api/signup', async (req, res) => {
  const { username, password, code } = req.body;

  if (password.length < 6) {
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

// Login request
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid username or password' });

    req.session.userId = user.id;
    console.log(req.session.userId);
    res.json({ message: 'Login successful' /*, token */ });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed. Try again later.' });
  }
});

app.get('/api/me', async (req, res) => {
  console.log(req.session.userId);
  if (!req.session.userId) return res.json({ loggedIn: false });

  const user = await pool.query('SELECT username FROM users WHERE id = $1', [req.session.userId]);
  res.json({ loggedIn: true, userId: req.session.userId, username: user.rows[0].username });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Failed to destroy session:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // Important to clear the session cookie
    res.json({ message: 'Logout successful' });
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));