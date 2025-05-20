import React from 'react';

const InvitationWaiting = ({
  playerAcceptanceStatus,
  players,
  allInvitationsAccepted,
  onStartGame,
  onCancel
}) => {
  const totalInvitations = Object.keys(playerAcceptanceStatus).length;
  const acceptedInvitations = Object.values(playerAcceptanceStatus).filter(status => status).length;
  const isWaiting = acceptedInvitations < totalInvitations;

  // Helper to get the player name based on team slot
  const getPlayerName = (teamSlot) => {
    const playerIndex = parseInt(teamSlot.replace('player', '')) - 1;
    const playerKey = `player${playerIndex + 1}`;
    return players[playerKey] || `Player ${playerIndex + 1}`;
  };

  return (
    <div className="text-center">
      <h3 className="fw-bold text-dark mb-4">Waiting for player responses</h3>
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="mb-3">
            <div className="progress">
              <div 
                className="progress-bar bg-success" 
                role="progressbar" 
                style={{ width: `${(acceptedInvitations / totalInvitations) * 100}%` }}
              >
                {acceptedInvitations}/{totalInvitations}
              </div>
            </div>
          </div>
          
          <p className="text-muted">
            {isWaiting ? (
              <>
                <i className="bi bi-clock-history me-2"></i>
                Waiting for {totalInvitations - acceptedInvitations} player(s) to respond...
                <br />
                <small>Players have 5 minutes to respond</small>
              </>
            ) : (
              <>
                <i className="bi bi-check-circle-fill text-success me-2"></i>
                All players have accepted the invitation!
              </>
            )}
          </p>

          {/* Show player status */}
          <div className="row g-2 mt-3">
            {Object.entries(playerAcceptanceStatus).map(([teamSlot, accepted]) => {
              const playerName = getPlayerName(teamSlot);
              
              return (
                <div key={teamSlot} className="col-6">
                  <div className={`p-2 rounded ${accepted ? 'bg-success bg-opacity-10' : 'bg-warning bg-opacity-10'}`}>
                    <div className="d-flex align-items-center">
                      {accepted ? (
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                      ) : (
                        <i className="bi bi-clock text-warning me-2"></i>
                      )}
                      <small className="fw-semibold">{playerName}</small>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {allInvitationsAccepted && (
        <button 
          className="btn btn-success btn-lg me-3"
          onClick={onStartGame}
        >
          <i className="bi bi-play-circle me-2"></i>
          Start Game
        </button>
      )}

      <button 
        className="btn btn-outline-secondary"
        onClick={onCancel}
      >
        <i className="bi bi-x-circle me-2"></i>
        Cancel
      </button>
    </div>
  );
};

export default InvitationWaiting;