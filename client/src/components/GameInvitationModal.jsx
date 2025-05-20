// Fixed GameInvitationModal.jsx
import React, { useState, useEffect } from 'react';

const GameInvitationModal = ({ invitation, onRespond, onClose, show }) => {
  const [responding, setResponding] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default

  useEffect(() => {
    if (!invitation || !show) return;

    // Calculate time left
    const calculateTimeLeft = () => {
      const now = new Date();
      const expiresAt = new Date(invitation.expiresAt);
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remaining);
      
      // Only auto-close when invitation expires
      if (remaining <= 0) {
        onClose();
      }
    };

    // Update timer every second
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [invitation, show, onClose]);

  const handleResponse = async (response) => {
    
    if (responding) {
      return;
    }
    
    setResponding(true);
    
    try {
      await onRespond(invitation.invitationId, response);
      // Don't setResponding(false) here - let the parent handle modal closure
    } catch (error) {
      setResponding(false);
    }
  };

  const handleBackdropClick = (e) => {
    // Prevent closing on backdrop click
    e.stopPropagation();
  };

  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getGameTypeDisplay = () => {
    switch (invitation.gameType) {
      case 'chkan':
        return '🧍‍♂️ Chkan (Individual)';
      case 's7ab':
        return '👬 S7ab (Team)';
      default:
        return invitation.gameType;
    }
  };

  const getPositionDisplay = () => {
    if (invitation.gameType === 'chkan') {
      const playerNum = invitation.teamSlot.split('-')[1];
      return `Player ${parseInt(playerNum) + 1}`;
    } else {
      const [team, player] = invitation.teamSlot.split('-');
      const teamNum = team === 'team1' ? '1' : '2';
      const playerNum = player === 'player1' ? '1' : '2';
      return `Team ${teamNum}, Player ${playerNum}`;
    }
  };

  if (!invitation || !show) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000 }}>
      {/* Backdrop - clicking it won't close the modal */}
      <div 
        className="modal-backdrop fade show" 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 2040 
        }}
        onClick={handleBackdropClick}
      ></div>
      
      {/* Modal */}
      <div 
        className="modal d-block" 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px', width: '90%' }}>
          <div className="modal-content shadow-lg border-3 border-primary">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">
                <i className="bi bi-controller me-2"></i>
                Game Invitation
              </h5>
            </div>
            
            <div className="modal-body text-center">
              <div className="mb-4">
                <div className="mb-3">
                  <i className="bi bi-people-fill text-primary" style={{ fontSize: '3rem' }}></i>
                </div>
                <h5 className="fw-bold">
                  <strong>{invitation.invitedBy}</strong> has invited you to play
                </h5>
                <div className="mt-3">
                  <span className="badge bg-primary fs-6">{getGameTypeDisplay()}</span>
                </div>
                <div className="mt-2">
                  <small className="text-muted">Your position: {getPositionDisplay()}</small>
                </div>
              </div>
              
              <div className="alert alert-warning d-flex align-items-center">
                <i className="bi bi-clock me-2"></i>
                <span>
                  This invitation expires in <strong>{formatTimeLeft()}</strong>
                </span>
              </div>
              
              {timeLeft <= 60 && (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Invitation expires soon!
                </div>
              )}

              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                Please respond to continue. This modal will remain until you accept or decline.
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="row w-100 g-2">
                <div className="col-6">
                  <button
                    className="btn btn-success w-100 btn-lg"
                    onClick={() => handleResponse('accepted')}
                    disabled={responding}
                  >
                    {responding ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Accepting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Accept
                      </>
                    )}
                  </button>
                </div>
                <div className="col-6">
                  <button
                    className="btn btn-danger w-100 btn-lg"
                    onClick={() => handleResponse('declined')}
                    disabled={responding}
                  >
                    {responding ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Declining...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-x-circle me-2"></i>
                        Decline
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameInvitationModal;