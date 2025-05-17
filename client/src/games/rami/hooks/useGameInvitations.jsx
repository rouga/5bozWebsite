// client/src/games/rami/hooks/useGameInvitations.js

import { useState, useEffect } from 'react';
import useSocket from '../../../hooks/useSocket';

/**
 * Custom hook to manage game invitations
 */
export default function useGameInvitations(setStatus, currentUser) {
  const socket = useSocket();
  const [playerAcceptanceStatus, setPlayerAcceptanceStatus] = useState({});
  const [currentGameId, setCurrentGameId] = useState(null);
  const [allInvitationsAccepted, setAllInvitationsAccepted] = useState(false);
  
  // Set up socket event listeners for invitation responses
  useEffect(() => {
    if (!socket || !currentGameId) return;

    const handleInvitationResponse = (data) => {
      const { gameId, playerName, teamSlot, response } = data;
      
      if (gameId === currentGameId) {
        setPlayerAcceptanceStatus(prev => ({
          ...prev,
          [teamSlot]: response === 'accepted'
        }));
        
        setStatus({
          type: response === 'accepted' ? 'success' : 'info',
          message: `${playerName} has ${response} the game invitation`
        });
        
        checkAllInvitationsAccepted(gameId);
      }
    };

    socket.on('invitation_response', handleInvitationResponse);

    return () => {
      socket.off('invitation_response', handleInvitationResponse);
    };
  }, [socket, currentGameId, setStatus]);

  /**
   * Send invitations to players for a game
   * @param {string} gameType - Type of game ('chkan' or 's7ab')
   * @param {Array} selectedPlayers - Array of player objects with username property
   * @param {Array} registeredUsers - Array of registered user objects
   * @returns {string|null} - Game ID if successful, null otherwise
   */
  const sendGameInvitations = async (gameType, selectedPlayers, registeredUsers = []) => {
    if (!currentUser) {
      setStatus({ 
        type: 'error', 
        message: 'You must be logged in to send invitations' 
      });
      return null;
    }
    
    const gameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCurrentGameId(gameId);
    
    // Determine which players are registered
    const playersWithRegistrationStatus = selectedPlayers.map((player, index) => {
      const isRegistered = registeredUsers.some(u => 
        u.username.toLowerCase() === player.username.toLowerCase()
      );
      
      let teamSlot;
      
      if (gameType === 'chkan') {
        teamSlot = `player-${index}`;
      } else {
        const teamIndex = Math.floor(index / 2);
        const playerIndex = index % 2;
        teamSlot = `team${teamIndex + 1}-player${playerIndex + 1}`;
      }
      
      return {
        ...player,
        isRegistered,
        teamSlot
      };
    });
    
    try {
      const response = await fetch('http://192.168.0.12:5000/api/game-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          gameType,
          players: playersWithRegistrationStatus,
          gameId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Initialize acceptance status for registered players
        const initialStatus = {};
        playersWithRegistrationStatus.forEach(player => {
          if (player.isRegistered && player.username !== currentUser?.username) {
            initialStatus[player.teamSlot] = false;
          } else if (!player.isRegistered || player.username === currentUser?.username) {
            // Non-registered players and self are automatically "accepted"
            initialStatus[player.teamSlot] = true;
          }
        });
        
        setPlayerAcceptanceStatus(initialStatus);
        
        if (data.invitationsSent > 0) {
          setStatus({
            type: 'info',
            message: `Invitations sent to ${data.invitationsSent} player(s). Waiting for responses...`
          });
        } else {
          // No invitations needed, can start immediately
          setAllInvitationsAccepted(true);
        }
        
        return gameId;
      } else {
        const errorData = await response.json();
        setStatus({
          type: 'error',
          message: errorData.error || 'Failed to send invitations'
        });
        return null;
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      setStatus({
        type: 'error',
        message: 'Failed to send game invitations'
      });
      return null;
    }
  };

  /**
   * Check if all invitations for a game have been accepted
   * @param {string} gameId - Game ID to check
   */
  const checkAllInvitationsAccepted = async (gameId) => {
    try {
      const response = await fetch(`http://192.168.0.12:5000/api/game-invitations/${gameId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const invitations = await response.json();
        const allAccepted = invitations.every(inv => inv.status === 'accepted');
        setAllInvitationsAccepted(allAccepted);
      }
    } catch (error) {
      console.error('Error checking invitation status:', error);
    }
  };

  return {
    playerAcceptanceStatus,
    setPlayerAcceptanceStatus,
    currentGameId,
    setCurrentGameId,
    allInvitationsAccepted,
    setAllInvitationsAccepted,
    sendGameInvitations,
    checkAllInvitationsAccepted
  };
}