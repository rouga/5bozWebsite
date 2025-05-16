import React, { useState } from 'react';

const GameInvitationModal = ({ invitation, onRespond, onClose }) => {
  const [responding, setResponding] = useState(false);

  const handleResponse = async (response) => {
    setResponding(true);
    await onRespond(invitation.id, response);
    setResponding(false);
    onClose();
  };

  if (!invitation) return null;

  const formatTimeLeft = () => {
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    const timeLeft = Math.max(0, expiresAt - now);
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getGameTypeDisplay = () => {
    switch (invitation.game_type) {
      case 'chkan':
        return '🧍‍♂️ Chkan (Individual)';
      case 's7ab':
        return '👬 S7ab (Team)';
      default:
        return invitation.game_type;
    }
  };

  const getPositionDisplay = () => {
    if (invitation.game_type === 'chkan') {
      const playerNum = invitation.team_slot.split('-')[1];
      return `Player ${parseInt(playerNum) + 1}`;
    } else {
      const [team, player] = invitation.team_slot.split('-');
      const teamNum = team === 'team1' ? '1' : '2';
      const playerNum = player === 'player1' ? '1' : '2';
      return `Team ${teamNum}, Player ${playerNum}`;
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-controller me-2"></i>
              Game Invitation
            </h5>
          </div>
          <div className="modal-body">
            <div className="text-center mb-4">
              <div className="mb-3">
                <span style={{ fontSize: '3rem' }}>🎮</span>
              </div>
              <h6>
                <strong>{invitation.invited_by_username}</strong> has invited you to play
              </h6>
              <div className="mt-3">
                <span className="badge bg-primary fs-6">{getGameTypeDisplay()}</span>
              </div>
              <div className="mt-2">
                <small className="text-muted">Position: {getPositionDisplay()}</small>
              </div>
            </div>
            
            <div className="alert alert-warning d-flex align-items-center">
              <i className="bi bi-clock me-2"></i>
              <span>
                This invitation expires in <strong>{formatTimeLeft()}</strong>
              </span>
            </div>
            
            <div className="row g-2">
              <div className="col-6">
                <button
                  className="btn btn-success w-100"
                  onClick={() => handleResponse('accepted')}
                  disabled={responding}
                >
                  {responding ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bi bi-check-circle me-2"></i>
                  )}
                  Accept
                </button>
              </div>
              <div className="col-6">
                <button
                  className="btn btn-danger w-100"
                  onClick={() => handleResponse('declined')}
                  disabled={responding}
                >
                  {responding ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bi bi-x-circle me-2"></i>
                  )}
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameInvitationModal;