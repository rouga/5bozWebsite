const { Server } = require('socket.io');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://192.168.0.12:5173",
      credentials: true
    }
  });

  // Store socket connections by user ID
  const userSockets = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // When user logs in, associate socket with user ID
    socket.on('user_login', (userId) => {
      console.log(`User ${userId} attempting to associate with socket ${socket.id}`);
      
      // Remove any existing socket for this user
      const existingSocketId = userSockets.get(userId);
      if (existingSocketId && existingSocketId !== socket.id) {
        console.log(`Replacing existing socket ${existingSocketId} for user ${userId}`);
      }
      
      userSockets.set(userId, socket.id);
      socket.userId = userId;
      
      console.log(`User ${userId} successfully connected with socket ${socket.id}`);
      console.log(`Total connected users: ${userSockets.size}`);
      
      // Confirm the login to the client
      socket.emit('user_login_confirmed', { 
        success: true, 
        userId,
        socketId: socket.id 
      });
    });

    // Handle game invitation acceptance/decline
    socket.on('respond_to_invitation', async (data) => {
      const { invitationId, response } = data; // response: 'accepted' or 'declined'
      
      try {
        // Update invitation status
        await pool.query(
          'UPDATE game_invitations SET status = $1, updated_at = NOW() WHERE id = $2',
          [response, invitationId]
        );

        // Get invitation details
        const inviteResult = await pool.query(`
          SELECT gi.*, u1.username as invited_by_username, u2.username as invited_username
          FROM game_invitations gi
          JOIN users u1 ON gi.invited_by = u1.id
          JOIN users u2 ON gi.invited_user = u2.id
          WHERE gi.id = $1
        `, [invitationId]);

        const invitation = inviteResult.rows[0];

        if (!invitation) {
          socket.emit('invitation_response_sent', {
            success: false,
            message: 'Invitation not found'
          });
          return;
        }

        console.log(`User ${invitation.invited_username} ${response} invitation for game ${invitation.game_id}`);

        // Notify the game creator about the response
        const creatorSocketId = userSockets.get(invitation.invited_by);
        console.log(`Looking for creator socket: user ${invitation.invited_by}, socket ${creatorSocketId}`);
        
        if (creatorSocketId) {
          console.log(`Sending response to creator at socket ${creatorSocketId}`);
          io.to(creatorSocketId).emit('invitation_response', {
            invitationId,
            response,
            gameId: invitation.game_id,
            playerName: invitation.invited_username,
            teamSlot: invitation.team_slot
          });
        } else {
          console.log(`Creator not found online for user ${invitation.invited_by}`);
        }

        // Send confirmation to the player who responded
        socket.emit('invitation_response_sent', {
          success: true,
          message: `You have ${response} the game invitation`
        });

      } catch (error) {
        console.error('Error responding to invitation:', error);
        socket.emit('invitation_response_sent', {
          success: false,
          message: 'Failed to respond to invitation'
        });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
      
      // Remove user from socket map
      if (socket.userId) {
        console.log(`Removing user ${socket.userId} from socket map`);
        userSockets.delete(socket.userId);
      }
      
      console.log(`Total connected users: ${userSockets.size}`);
    });
  });

  return { io, userSockets };
}

module.exports = initializeSocket;