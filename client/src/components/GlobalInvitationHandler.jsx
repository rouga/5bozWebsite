import React, { useState, useEffect, useCallback, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import GameInvitationModal from './GameInvitationModal';

const GlobalInvitationHandler = () => {
  const [user] = useAuth();
  const socket = useSocket();
  const [currentInvitation, setCurrentInvitation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const processedInvitationsRef = useRef(new Set());
  const [isResponding, setIsResponding] = useState(false);
  const fetchTimeoutRef = useRef(null);

  // Memoize fetch function to avoid recreation on each render
  const fetchAndShowPendingInvitation = useCallback(async () => {
    if (!user || isResponding || !socket) return;

    try {
      console.log('Fetching pending invitations...');
      const response = await fetch('http://192.168.0.12:5000/api/my-invitations', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const invitations = await response.json();
        
        if (invitations.length > 0) {
          // Show the first pending invitation that hasn't been processed
          const pendingInvitation = invitations.find(inv => 
            !processedInvitationsRef.current.has(inv.id)
          );
          
          if (pendingInvitation) {
            const formattedInvitation = {
              invitationId: pendingInvitation.id,
              gameType: pendingInvitation.game_type,
              invitedBy: pendingInvitation.invited_by_username,
              teamSlot: pendingInvitation.team_slot,
              expiresAt: pendingInvitation.expires_at
            };
            
            setCurrentInvitation(formattedInvitation);
            setShowModal(true);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    }
  }, [user, isResponding, socket]);

  // Initial fetch on mount or when user changes
  useEffect(() => {
    if (user) {
      fetchAndShowPendingInvitation();
    }
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [user, fetchAndShowPendingInvitation]);

  // Socket event handlers
  useEffect(() => {
    if (!user || !socket) return;

    // Handle new invitations
    const handleGameInvitation = (invitation) => {
      if (processedInvitationsRef.current.has(invitation.invitationId) || isResponding) {
        return;
      }

      setCurrentInvitation(invitation);
      setShowModal(true);
      
      // Optional: Notification sound
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.play().catch(e => console.log('Could not play notification sound:', e));
      } catch (error) {
        console.log('Audio not supported');
      }
      
      // Browser notification as backup
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('Game Invitation', {
          body: `${invitation.invitedBy} invited you to play ${invitation.gameType}`,
          icon: '/favIcon.svg',
          tag: 'game-invitation',
          requireInteraction: true
        });
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    };

    // Handle response confirmations
    const handleInvitationResponseSent = (data) => {
      setIsResponding(false);
      
      if (data.success) {
        setShowModal(false);
        setCurrentInvitation(null);
        
        // Check for more pending invitations after a short delay
        fetchTimeoutRef.current = setTimeout(() => {
          fetchAndShowPendingInvitation();
        }, 1000);
      }
    };

    socket.on('game_invitation', handleGameInvitation);
    socket.on('invitation_response_sent', handleInvitationResponseSent);

    return () => {
      socket.off('game_invitation', handleGameInvitation);
      socket.off('invitation_response_sent', handleInvitationResponseSent);
    };
  }, [user, socket, isResponding, fetchAndShowPendingInvitation]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleInvitationResponse = async (invitationId, response) => {
    if (!socket || isResponding) return;
    
    setIsResponding(true);
    
    // Mark this invitation as processed
    processedInvitationsRef.current.add(invitationId);
    
    // Send response via socket
    socket.emit('respond_to_invitation', { invitationId, response });
  };

  const handleCloseModal = () => {
    // Only allow closing if not responding and invitation has expired
    if (!isResponding && currentInvitation) {
      const now = new Date();
      const expiresAt = new Date(currentInvitation.expiresAt);
      
      if (now >= expiresAt) {
        setShowModal(false);
        setCurrentInvitation(null);
        processedInvitationsRef.current.add(currentInvitation.invitationId);
        
        // Check for more pending invitations
        fetchTimeoutRef.current = setTimeout(() => {
          fetchAndShowPendingInvitation();
        }, 1000);
      }
    }
  };

  return (
    <>
      <GameInvitationModal
        invitation={currentInvitation}
        show={showModal}
        onRespond={handleInvitationResponse}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default GlobalInvitationHandler;