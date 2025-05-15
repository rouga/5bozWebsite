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

// Signup request
app.post('/api/signup', async (req, res) => {
  const { username, password, code } = req.body;

  // Check for password length
  if (password.length < 6) {
    return res.status(403).json({ error: 'Password should contain at least 6 characters' });
  }

  // Check username length
  if (username.length > 20) {
    return res.status(403).json({ error: 'Username too long' });
  }

  // Check if username starts with a number
  if (/^[0-9]/.test(username)) {
    return res.status(403).json({ error: 'Username cannot start with a number' });
  }

  // Check signup code
  if (code !== process.env.SIGNUP_SECRET) {
    return res.status(403).json({ error: 'Invalid signup code' });
  }

  try {
    // Check for existing username (case insensitive)
    const existing = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
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
    res.json({ message: 'Login successful' /*, token */ });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed. Try again later.' });
  }
});

// Change password endpoint
app.post('/api/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ error: 'You must be logged in to change your password' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password should contain at least 6 characters' });
  }

  try {
    // Get current user
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Failed to update password. Please try again later.' });
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
    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: false, // true in production over HTTPS
    });
    console.log("Logout successful");
    res.json({ message: 'Logout successful' });
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));