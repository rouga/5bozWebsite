// Enhanced GlobalInvitationHandler that shows pending invitations on load
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

    socket.on('game_invitation', handleGameInvitation);

    return () => {
      console.log('GlobalInvitationHandler: Cleaning up socket listeners');
      socket.off('game_invitation', handleGameInvitation);
    };
  }, [user, socket, processedInvitations]);

  // Function to fetch and show pending invitations
  const fetchAndShowPendingInvitation = async () => {
    try {
      console.log('Fetching pending invitations...');
      const response = await fetch('http://192.168.0.12:5000/api/my-invitations', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const invitations = await response.json();
        console.log('Found pending invitations:', invitations);
        
        if (invitations.length > 0) {
          // Show the first pending invitation
          const invitation = invitations[0];
          
          // Convert the API format to socket format
          const formattedInvitation = {
            invitationId: invitation.id,
            gameType: invitation.game_type,
            invitedBy: invitation.invited_by_username,
            teamSlot: invitation.team_slot,
            expiresAt: invitation.expires_at
          };
          
          setCurrentInvitation(formattedInvitation);
          setShowModal(true);
          console.log('Showing pending invitation:', formattedInvitation);
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
    
    // Mark this invitation as processed so we don't show it again
    setProcessedInvitations(prev => new Set(prev).add(invitationId));
    
    // Send response via socket
    socket.emit('respond_to_invitation', { invitationId, response });
    
    // Close modal
    setShowModal(false);
    setCurrentInvitation(null);
    console.log('GlobalInvitationHandler: Modal closed after response');
    
    // If there are more pending invitations, show the next one after a short delay
    setTimeout(() => {
      fetchAndShowPendingInvitation();
    }, 1000);
  };

  const handleCloseModal = () => {
    console.log('GlobalInvitationHandler: Modal closed manually');
    // Note: We don't close the modal on manual close anymore
    // The modal only closes when user accepts/declines
    
    // Optional: You could add a "Remind me later" functionality here
    // For now, the modal stays open
    
    // If you want to allow closing without responding, uncomment below:
    // setShowModal(false);
    // setCurrentInvitation(null);
  };

  // Add some debug info to the render
  console.log('GlobalInvitationHandler render:', { 
    hasUser: !!user, 
    hasSocket: !!socket, 
    hasInvitation: !!currentInvitation, 
    showModal 
  });

  return (
    <>
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            right: 0, 
            background: '#f0f0f0', 
            padding: '10px', 
            fontSize: '12px',
            zIndex: 9999,
            border: '1px solid #ccc'
          }}
        >
          <div>User: {user?.username || 'None'}</div>
          <div>Socket: {socket ? 'Connected' : 'Disconnected'}</div>
          <div>Modal: {showModal ? 'Visible' : 'Hidden'}</div>
          <div>Invitation: {currentInvitation ? 'Yes' : 'No'}</div>
          <div>Processed: {processedInvitations.size}</div>
          <button 
            onClick={fetchAndShowPendingInvitation}
            style={{ fontSize: '10px', marginTop: '5px' }}
          >
            Refresh Invitations
          </button>
        </div>
      )}
      
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