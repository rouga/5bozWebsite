// Updated InvitationNotificationBadge - ensure it doesn't interfere with GlobalInvitationHandler
import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';

const InvitationNotificationBadge = () => {
  const [user] = useAuth();
  const socket = useSocket();
  const [pendingInvitations, setPendingInvitations] = useState([]);

  useEffect(() => {
    if (user && socket) {
      
      // Fetch existing pending invitations on component mount
      fetchPendingInvitations();

      // Listen for new invitations - but DON'T handle them, just update the count
      const handleGameInvitation = (invitation) => {
        // Just add to the pending list for badge count
        setPendingInvitations(prev => [...prev, invitation]);
      };

      // Listen for responses to clean up the list
      const handleInvitationResponse = () => {
        fetchPendingInvitations();
      };

      socket.on('game_invitation', handleGameInvitation);
      socket.on('invitation_response_sent', handleInvitationResponse);

      return () => {
        socket.off('game_invitation', handleGameInvitation);
        socket.off('invitation_response_sent', handleInvitationResponse);
      };
    }
  }, [user, socket]);

  const fetchPendingInvitations = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('http://192.168.0.12:5000/api/my-invitations', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const invitations = await response.json();
        setPendingInvitations(invitations);
      }
    } catch (error) {
    }
  };

  if (!user || pendingInvitations.length === 0) {
    return null;
  }

  return (
    <span className="position-relative">
      <span 
        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
        style={{ fontSize: '0.6rem' }}
      >
        {pendingInvitations.length}
        <span className="visually-hidden">pending game invitations</span>
      </span>
    </span>
  );
};

export default InvitationNotificationBadge;