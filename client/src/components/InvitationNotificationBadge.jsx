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

      // Listen for new invitations
      socket.on('game_invitation', (invitation) => {
        setPendingInvitations(prev => [...prev, invitation]);
      });

      return () => {
        socket.off('game_invitation');
      };
    }
  }, [user, socket]);

  const fetchPendingInvitations = async () => {
    try {
      const response = await fetch('http://192.168.0.12:5000/api/my-invitations', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const invitations = await response.json();
        setPendingInvitations(invitations);
      }
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
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