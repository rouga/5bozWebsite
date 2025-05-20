const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Must be logged in' });
  }
  next();
};

// Get Jaki games with pagination
router.get('/games', async (req, res) => {
  // Get pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  try {
    let query = 'SELECT * FROM jaki_games ORDER BY played_at DESC';
    let params = [];
    
    // If limit is provided, add pagination
    if (req.query.limit) {
      query += ' LIMIT $1 OFFSET $2';
      params = [limit, offset];
    }
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching Jaki games:', err);
    res.status(500).json({ error: 'Failed to fetch Jaki games' });
  }
});

// Get total count of Jaki games
router.get('/games/count', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM jaki_games');
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    console.error('Error counting Jaki games:', err);
    res.status(500).json({ error: 'Failed to count Jaki games' });
  }
});

// Save a completed Jaki game
router.post('/games', isAuthenticated, async (req, res) => {
  const gameData = req.body;
  const userId = req.session.userId;
  
  try {
    console.log('Received Jaki game data:', JSON.stringify(gameData, null, 2)); // Debug log
    
    // Ensure all required fields are present
    if (!gameData.player1 || !gameData.player2 || 
        gameData.score1 === undefined || gameData.score2 === undefined || 
        !gameData.winner || !gameData.winning_score || 
        gameData.total_rounds === undefined || !gameData.game_data) {
      console.error('Missing required fields for Jaki game:', gameData);
      return res.status(400).json({ error: 'Missing required fields for Jaki game' });
    }
    
    // Convert created_at to UTC if provided, otherwise use current UTC time
    let gameCreatedAt;
    if (gameData.created_at) {
      // Ensure created_at is properly converted to UTC
      gameCreatedAt = new Date(gameData.created_at).toISOString();
    } else {
      gameCreatedAt = new Date().toISOString();
    }
    
    // Use current UTC time for played_at to match created_at format
    const playedAt = new Date().toISOString();
    
    console.log('Using created_at:', gameCreatedAt);
    console.log('Using played_at:', playedAt);
    
    const result = await pool.query(
      `INSERT INTO jaki_games (
        player1, player2, score1, score2, winner, winning_score, 
        total_rounds, created_by_user_id, created_at, played_at, game_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        gameData.player1, 
        gameData.player2, 
        gameData.score1, 
        gameData.score2, 
        gameData.winner, 
        gameData.winning_score, 
        gameData.total_rounds, 
        userId, 
        gameCreatedAt, 
        playedAt, 
        JSON.stringify(gameData.game_data)
      ]
    );
    
    console.log('Jaki game saved successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error saving Jaki game:', err);
    res.status(500).json({ error: 'Failed to save game: ' + err.message });
  }
});

// Get active Jaki game
router.get('/active-game', isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  try {
    const result = await pool.query(
      'SELECT * FROM active_jaki_games WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ hasActiveGame: false });
    }

    const game = result.rows[0];
    res.json({
      hasActiveGame: true,
      gameState: game.game_state,
      createdAt: game.created_at,
      updatedAt: game.updated_at
    });
  } catch (err) {
    console.error('Error getting active Jaki game:', err);
    res.status(500).json({ error: 'Failed to get game state' });
  }
});

// Save or update active Jaki game state
router.post('/active-game', isAuthenticated, async (req, res) => {
  const userId = req.session.userId;
  const { gameState } = req.body;

  if (!gameState) {
    return res.status(400).json({ error: 'Game state is required' });
  }

  try {
    // Check if user already has an active game
    const existingGame = await pool.query(
      'SELECT id FROM active_jaki_games WHERE user_id = $1',
      [userId]
    );

    if (existingGame.rows.length > 0) {
      // Update existing game
      const result = await pool.query(
        'UPDATE active_jaki_games SET game_state = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
        [JSON.stringify(gameState), userId]
      );
      res.json({ message: 'Game state updated', game: result.rows[0] });
    } else {
      // Create new active game
      const result = await pool.query(
        'INSERT INTO active_jaki_games (user_id, game_state) VALUES ($1, $2) RETURNING *',
        [userId, JSON.stringify(gameState)]
      );
      res.json({ message: 'Game state saved', game: result.rows[0] });
    }
  } catch (err) {
    console.error('Error saving active Jaki game:', err);
    res.status(500).json({ error: 'Failed to save game state' });
  }
});

// Delete active Jaki game state (when game is completed or cancelled)
router.delete('/active-game', isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  try {
    await pool.query('DELETE FROM active_jaki_games WHERE user_id = $1', [userId]);
    res.json({ message: 'Active Jaki game state deleted' });
  } catch (err) {
    console.error('Error deleting active Jaki game:', err);
    res.status(500).json({ error: 'Failed to delete game state' });
  }
});

// Get active Jaki games (for live scores)
router.get('/active-games', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ag.id,
        ag.game_state,
        ag.created_at,
        ag.updated_at,
        u.username
      FROM active_jaki_games ag
      JOIN users u ON ag.user_id = u.id
      ORDER BY ag.updated_at DESC
    `);

    const activeGames = result.rows.map(row => ({
      id: row.id,
      gameState: row.game_state,
      username: row.username,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json(activeGames);
  } catch (err) {
    console.error('Error fetching active Jaki games:', err);
    res.status(500).json({ error: 'Failed to fetch active Jaki games' });
  }
});

module.exports = router;