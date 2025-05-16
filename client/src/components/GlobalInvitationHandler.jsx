// Fixed GlobalInvitationHandler.jsx
import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import GameInvitationModal from './GameInvitationModal';

const GlobalInvitationHandler = () => {
  const [user] = useAuth();
  const socket = useSocket();
  const [currentInvitation, setCurrentInvitation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processedInvitations, setProcessedInvitations] = useState(new Set());
  const [isResponding, setIsResponding] = useState(false);

  // Fetch and show any pending invitations when component mounts
  useEffect(() => {
    if (user) {
      fetchAndShowPendingInvitation();
    }
  }, [user]);

  useEffect(() => {
    if (!user || !socket) {
      console.log('GlobalInvitationHandler: No user or socket', { user: !!user, socket: !!socket });
      return;
    }

    console.log('GlobalInvitationHandler: Setting up invitation listener for user:', user.username);

    // Listen for new game invitations
    const handleGameInvitation = (invitation) => {
      console.log('GlobalInvitationHandler: Received new game invitation:', invitation);
      
      // Check if we've already processed this invitation
      if (processedInvitations.has(invitation.invitationId)) {
        console.log('Invitation already processed, skipping');
        return;
      }

      // Check if we're already responding to an invitation
      if (isResponding) {
        console.log('Already responding to an invitation, skipping');
        return;
      }

      // Show the modal immediately
      setCurrentInvitation(invitation);
      setShowModal(true);
      console.log('GlobalInvitationHandler: Modal should be visible now');
      
      // Optional: Play a sound notification
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.play().catch(e => console.log('Could not play notification sound:', e));
      } catch (error) {
        console.log('Audio not supported');
      }
      
      // Optional: Show browser notification as backup
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

    // Listen for response confirmation
    const handleInvitationResponseSent = (data) => {
      console.log('GlobalInvitationHandler: Received response confirmation:', data);
      setIsResponding(false);
      
      if (data.success) {
        // Close modal immediately on successful response
        setShowModal(false);
        setCurrentInvitation(null);
        
        // Check for more pending invitations after a short delay
        setTimeout(() => {
          fetchAndShowPendingInvitation();
        }, 1000);
      }
    };

    socket.on('game_invitation', handleGameInvitation);
    socket.on('invitation_response_sent', handleInvitationResponseSent);

    return () => {
      console.log('GlobalInvitationHandler: Cleaning up socket listeners');
      socket.off('game_invitation', handleGameInvitation);
      socket.off('invitation_response_sent', handleInvitationResponseSent);
    };
  }, [user, socket, processedInvitations, isResponding]);

  // Function to fetch and show pending invitations
  const fetchAndShowPendingInvitation = async () => {
    if (isResponding) {
      console.log('Already responding to an invitation, skipping fetch');
      return;
    }

    try {
      console.log('Fetching pending invitations...');
      const response = await fetch('http://192.168.0.12:5000/api/my-invitations', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const invitations = await response.json();
        console.log('Found pending invitations:', invitations);
        
        if (invitations.length > 0) {
          // Show the first pending invitation that hasn't been processed
          const pendingInvitation = invitations.find(inv => 
            !processedInvitations.has(inv.id)
          );
          
          if (pendingInvitation) {
            // Convert the API format to socket format
            const formattedInvitation = {
              invitationId: pendingInvitation.id,
              gameType: pendingInvitation.game_type,
              invitedBy: pendingInvitation.invited_by_username,
              teamSlot: pendingInvitation.team_slot,
              expiresAt: pendingInvitation.expires_at
            };
            
            setCurrentInvitation(formattedInvitation);
            setShowModal(true);
            console.log('Showing pending invitation:', formattedInvitation);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  const handleInvitationResponse = async (invitationId, response) => {
    console.log('GlobalInvitationHandler: Responding to invitation:', { invitationId, response });
    
    if (!socket) {
      console.error('No socket available for response');
      return;
    }
    
    if (isResponding) {
      console.log('Already responding to an invitation');
      return;
    }
    
    setIsResponding(true);
    
    // Mark this invitation as processed so we don't show it again
    setProcessedInvitations(prev => new Set(prev).add(invitationId));
    
    // Send response via socket
    socket.emit('respond_to_invitation', { invitationId, response });
    
    console.log('GlobalInvitationHandler: Response sent, waiting for confirmation');
  };

  const handleCloseModal = () => {
    console.log('GlobalInvitationHandler: Modal close requested');
    // Only allow closing if not responding and invitation has expired
    if (!isResponding && currentInvitation) {
      const now = new Date();
      const expiresAt = new Date(currentInvitation.expiresAt);
      
      if (now >= expiresAt) {
        console.log('Invitation expired, closing modal');
        setShowModal(false);
        setCurrentInvitation(null);
        setProcessedInvitations(prev => new Set(prev).add(currentInvitation.invitationId));
        
        // Check for more pending invitations
        setTimeout(() => {
          fetchAndShowPendingInvitation();
        }, 1000);
      } else {
        console.log('Cannot close modal - invitation still active');
      }
    }
  };

  // Add some debug info to the render
  console.log('GlobalInvitationHandler render:', { 
    hasUser: !!user, 
    hasSocket: !!socket, 
    hasInvitation: !!currentInvitation, 
    showModal,
    isResponding
  });

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