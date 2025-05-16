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
  name: 'gameSession', // Custom session name
  cookie: {
    secure: false, // Set to true only in production with HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 12, // 12 hours
    sameSite: 'lax' // Important for cross-origin requests
  },
  // Add session store if using Redis or MongoDB in production
  // For now, using in-memory store (not recommended for production)
}));

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const http = require('http');
const initializeSocket = require('./socket');

// Replace app.listen with this:
const server = http.createServer(app);
const { io, userSockets } = initializeSocket(server);

// Make io and userSockets available to routes
app.locals.io = io;
app.locals.userSockets = userSockets;

// Game invitation endpoints

// Also update your existing endpoint with better debugging
app.post('/api/game-invitations', async (req, res) => {
  const userId = req.session.userId;
  const { gameType, players, gameId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Must be logged in to send invitations' });
  }

  try {
    const invitations = [];
    
    for (const player of players) {
      if (player.isRegistered) {
        // Get user ID from username
        const userResult = await pool.query(
          'SELECT id FROM users WHERE username = $1',
          [player.username]
        );

        if (userResult.rows.length > 0) {
          const invitedUserId = userResult.rows[0].id;
          
          // Skip if inviting yourself
          if (invitedUserId === userId) {
            continue;
          }

          // Create invitation
          const inviteResult = await pool.query(`
            INSERT INTO game_invitations (game_id, invited_by, invited_user, game_type, team_slot, session_data)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
          `, [
            gameId,
            userId,
            invitedUserId,
            gameType,
            player.teamSlot,
            JSON.stringify(players)
          ]);

          const invitation = inviteResult.rows[0];
          invitations.push(invitation);

          // Send real-time notification to the invited user
          const invitedSocketId = userSockets.get(invitedUserId);
          if (invitedSocketId) {
            // Get inviter username
            const inviterResult = await pool.query(
              'SELECT username FROM users WHERE id = $1',
              [userId]
            );
            
            io.to(invitedSocketId).emit('game_invitation', {
              invitationId: invitation.id,
              gameType,
              invitedBy: inviterResult.rows[0].username,
              teamSlot: player.teamSlot,
              expiresAt: invitation.expires_at
            });
          }
        }
      }
    }

    res.json({
      success: true,
      invitationsSent: invitations.length,
      invitations
    });

  } catch (error) {
    console.error('Error sending game invitations:', error);
    res.status(500).json({ error: 'Failed to send invitations' });
  }
});

// Add a session check endpoint
app.get('/api/session-check', (req, res) => {
  res.json({
    sessionId: req.sessionID,
    session: req.session,
    userId: req.session.userId,
    cookies: req.headers.cookie
  });
});

// Send game invitations with detailed logging
app.post('/api/game-invitations', async (req, res) => {
  const userId = req.session.userId;
  const { gameType, players, gameId } = req.body;

  console.log('=== INVITATION DEBUG START ===');
  console.log('User ID:', userId);
  console.log('Game Type:', gameType);
  console.log('Players:', JSON.stringify(players, null, 2));
  console.log('Game ID:', gameId);

  if (!userId) {
    console.log('ERROR: User not logged in');
    return res.status(401).json({ error: 'Must be logged in to send invitations' });
  }

  try {
    const invitations = [];
    console.log('Processing players for invitations...');
    
    for (const [index, player] of players.entries()) {
      console.log(`\nProcessing player ${index + 1}:`, player);
      
      if (player.isRegistered) {
        // Get user ID from username
        const userResult = await pool.query(
          'SELECT id FROM users WHERE username = $1',
          [player.username]
        );

        if (userResult.rows.length > 0) {
          const invitedUserId = userResult.rows[0].id;
          console.log(`Found user ID ${invitedUserId} for username ${player.username}`);
          
          // Skip if inviting yourself
          if (invitedUserId === userId) {
            console.log(`Skipping self-invitation for user ${invitedUserId}`);
            continue;
          }

          // Create invitation
          const inviteResult = await pool.query(`
            INSERT INTO game_invitations (game_id, invited_by, invited_user, game_type, team_slot, session_data)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
          `, [
            gameId,
            userId,
            invitedUserId,
            gameType,
            player.teamSlot,
            JSON.stringify(players)
          ]);

          const invitation = inviteResult.rows[0];
          invitations.push(invitation);
          console.log(`Created invitation with ID ${invitation.id}`);

          // Check if user is connected via socket
          const invitedSocketId = userSockets.get(invitedUserId);
          console.log(`Socket lookup for user ${invitedUserId}:`, invitedSocketId || 'NOT CONNECTED');
          
          if (invitedSocketId) {
            // Get inviter username
            const inviterResult = await pool.query(
              'SELECT username FROM users WHERE id = $1',
              [userId]
            );
            
            const invitationData = {
              invitationId: invitation.id,
              gameType,
              invitedBy: inviterResult.rows[0].username,
              teamSlot: player.teamSlot,
              expiresAt: invitation.expires_at
            };
            
            console.log(`Sending socket event to ${invitedSocketId}:`, invitationData);
            
            // Send real-time notification to the invited user
            io.to(invitedSocketId).emit('game_invitation', invitationData);
            console.log(`✅ Socket event sent to user ${invitedUserId}`);
          } else {
            console.log(`❌ User ${invitedUserId} not connected via socket`);
          }
        } else {
          console.log(`❌ User not found for username: ${player.username}`);
        }
      } else {
        console.log(`Skipping non-registered player: ${player.username}`);
      }
    }

    console.log(`\nTotal invitations created: ${invitations.length}`);
    console.log('Current connected users:', Array.from(userSockets.keys()));
    console.log('=== INVITATION DEBUG END ===\n');

    res.json({
      success: true,
      invitationsSent: invitations.length,
      invitations,
      debug: {
        totalPlayers: players.length,
        registeredPlayers: players.filter(p => p.isRegistered).length,
        connectedUsers: Array.from(userSockets.keys()),
        socketMappings: Object.fromEntries(userSockets)
      }
    });

  } catch (error) {
    console.error('Error sending game invitations:', error);
    console.log('=== INVITATION DEBUG END (ERROR) ===\n');
    res.status(500).json({ error: 'Failed to send invitations' });
  }
});

// Add debugging endpoint to check socket connections
app.get('/api/debug/connections', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Must be logged in' });
  }

  const connectionsInfo = {
    totalConnections: userSockets.size,
    connectedUsers: Array.from(userSockets.entries()).map(([userId, socketId]) => ({
      userId,
      socketId
    })),
    currentUser: {
      id: req.session.userId,
      socketId: userSockets.get(req.session.userId) || null,
      connected: userSockets.has(req.session.userId)
    }
  };

  res.json(connectionsInfo);
});

// Get pending invitations for a user
app.get('/api/my-invitations', async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Must be logged in' });
  }

  try {
    const result = await pool.query(`
      SELECT gi.*, u.username as invited_by_username
      FROM game_invitations gi
      JOIN users u ON gi.invited_by = u.id
      WHERE gi.invited_user = $1 AND gi.status = 'pending' AND gi.expires_at > NOW()
      ORDER BY gi.created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

// Get invitation status for a game
app.get('/api/game-invitations/:gameId', async (req, res) => {
  const { gameId } = req.params;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Must be logged in' });
  }

  try {
    const result = await pool.query(`
      SELECT gi.*, u.username as invited_username
      FROM game_invitations gi
      JOIN users u ON gi.invited_user = u.id
      WHERE gi.game_id = $1 AND gi.invited_by = $2
      ORDER BY gi.created_at DESC
    `, [gameId, userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching game invitations:', error);
    res.status(500).json({ error: 'Failed to fetch game invitations' });
  }
});

// Expire old invitations (run periodically)
app.post('/api/cleanup-invitations', async (req, res) => {
  try {
    await pool.query(`
      UPDATE game_invitations 
      SET status = 'expired' 
      WHERE status = 'pending' AND expires_at < NOW()
    `);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error cleaning up invitations:', error);
    res.status(500).json({ error: 'Failed to cleanup invitations' });
  }
});


// Save or update active game state
app.post('/api/active-game', async (req, res) => {
  const userId = req.session.userId;
  const { gameState, gameType } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Must be logged in to save game state' });
  }

  if (!gameState || !gameType) {
    return res.status(400).json({ error: 'Game state and type are required' });
  }

  try {
    // Check if user already has an active game
    const existingGame = await pool.query(
      'SELECT id FROM active_games WHERE user_id = $1',
      [userId]
    );

    if (existingGame.rows.length > 0) {
      // Update existing game
      const result = await pool.query(
        'UPDATE active_games SET game_state = $1, game_type = $2, updated_at = NOW() WHERE user_id = $3 RETURNING *',
        [JSON.stringify(gameState), gameType, userId]
      );
      res.json({ message: 'Game state updated', game: result.rows[0] });
    } else {
      // Create new active game
      const result = await pool.query(
        'INSERT INTO active_games (user_id, game_state, game_type) VALUES ($1, $2, $3) RETURNING *',
        [userId, JSON.stringify(gameState), gameType]
      );
      res.json({ message: 'Game state saved', game: result.rows[0] });
    }
  } catch (err) {
    console.error('Error saving active game:', err);
    res.status(500).json({ error: 'Failed to save game state' });
  }
});

// Add this to server/index.js
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username FROM users ORDER BY username');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get active game state
app.get('/api/active-game', async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Must be logged in to get game state' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM active_games WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ hasActiveGame: false });
    }

    const game = result.rows[0];
    res.json({
      hasActiveGame: true,
      gameState: game.game_state,
      gameType: game.game_type,
      createdAt: game.created_at,
      updatedAt: game.updated_at
    });
  } catch (err) {
    console.error('Error getting active game:', err);
    res.status(500).json({ error: 'Failed to get game state' });
  }
});

// Delete active game state (when game is completed or cancelled)
app.delete('/api/active-game', async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Must be logged in to delete game state' });
  }

  try {
    await pool.query('DELETE FROM active_games WHERE user_id = $1', [userId]);
    res.json({ message: 'Active game state deleted' });
  } catch (err) {
    console.error('Error deleting active game:', err);
    res.status(500).json({ error: 'Failed to delete game state' });
  }
});

// Get scores with pagination
app.get('/api/scores', async (req, res) => {
  // Get pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  try {
    let query = 'SELECT * FROM games ORDER BY played_at DESC';
    let params = [];
    
    // If limit is provided, add pagination
    if (req.query.limit) {
      query += ' LIMIT $1 OFFSET $2';
      params = [limit, offset];
    }
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching scores:', err);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

// Get total count of scores
app.get('/api/scores/count', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM games');
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    console.error('Error counting scores:', err);
    res.status(500).json({ error: 'Failed to count scores' });
  }
});

app.post('/api/scores', async (req, res) => {
  const gameData = req.body;
  
  try {
    console.log('Received game data:', JSON.stringify(gameData, null, 2)); // Debug log
    
    if (gameData.type === 'chkan') {
      // Handle Chkan game - don't use team1/team2/score1/score2 columns
      const { winners, losers, player_scores, game_data, created_at } = gameData;
      
      // Ensure all required fields are present
      if (!winners || !player_scores || !game_data) {
        console.error('Missing required fields for Chkan game:', { winners, player_scores, game_data });
        return res.status(400).json({ error: 'Missing required fields for Chkan game' });
      }
      
      // Convert created_at to UTC if provided, otherwise use current UTC time
      let gameCreatedAt;
      if (created_at) {
        // Ensure created_at is properly converted to UTC
        gameCreatedAt = new Date(created_at).toISOString();
      } else {
        gameCreatedAt = new Date().toISOString();
      }
      
      // Use current UTC time for played_at to match created_at format
      const playedAt = new Date().toISOString();
      
      console.log('Using created_at:', gameCreatedAt);
      console.log('Using played_at:', playedAt);
      
      const result = await pool.query(
        `INSERT INTO games (type, winners, losers, player_scores, game_data, created_at, played_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        ['chkan', winners, losers || '', player_scores, JSON.stringify(game_data), gameCreatedAt, playedAt]
      );
      
      console.log('Chkan game saved successfully:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      // Handle S7ab game (use existing team1/team2/score1/score2 columns for backward compatibility)
      const { team1, team2, score1, score2, game_data, created_at } = gameData;
      
      // Ensure all required fields are present
      if (!team1 || !team2 || score1 === undefined || score2 === undefined) {
        console.error('Missing required fields for S7ab game:', { team1, team2, score1, score2 });
        return res.status(400).json({ error: 'Missing required fields for S7ab game' });
      }
      
      // Convert created_at to UTC if provided, otherwise use current UTC time
      let gameCreatedAt;
      if (created_at) {
        // Ensure created_at is properly converted to UTC
        gameCreatedAt = new Date(created_at).toISOString();
      } else {
        gameCreatedAt = new Date().toISOString();
      }
      
      // Use current UTC time for played_at to match created_at format
      const playedAt = new Date().toISOString();
      
      console.log('Using created_at:', gameCreatedAt);
      console.log('Using played_at:', playedAt);
      
      const result = await pool.query(
        `INSERT INTO games (type, team1, team2, score1, score2, game_data, created_at, played_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        ['s7ab', team1, team2, score1, score2, JSON.stringify(game_data), gameCreatedAt, playedAt]
      );
      
      console.log('S7ab game saved successfully:', result.rows[0]);
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error('Error saving game:', err);
    res.status(500).json({ error: 'Failed to save game: ' + err.message });
  }
});


app.get('/api/active-games', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ag.id,
        ag.game_state,
        ag.game_type,
        ag.created_at,
        ag.updated_at,
        u.username
      FROM active_games ag
      JOIN users u ON ag.user_id = u.id
      ORDER BY ag.updated_at DESC
    `);

    const activeGames = result.rows.map(row => ({
      id: row.id,
      gameState: row.game_state,
      gameType: row.game_type,
      username: row.username,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json(activeGames);
  } catch (err) {
    console.error('Error fetching active games:', err);
    res.status(500).json({ error: 'Failed to fetch active games' });
  }
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