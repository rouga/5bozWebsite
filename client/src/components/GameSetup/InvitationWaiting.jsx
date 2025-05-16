// client/src/components/GameSetup/InvitationWaiting.jsx
import React from 'react';

const InvitationWaiting = ({
  gameType,
  playerAcceptanceStatus,
  chkanPlayers,
  teamPlayers,
  allInvitationsAccepted,
  onStartGame,
  onCancel
}) => {
  const totalInvitations = Object.keys(playerAcceptanceStatus).length;
  const acceptedInvitations = Object.values(playerAcceptanceStatus).filter(status => status).length;
  const isWaiting = acceptedInvitations < totalInvitations;

  const getPlayerName = (teamSlot) => {
    if (gameType === 'chkan') {
      const playerIndex = parseInt(teamSlot.split('-')[1]);
      return Object.values(chkanPlayers)[playerIndex] || `Player ${playerIndex + 1}`;
    } else {
      // S7ab logic for team slots
      const [team, player] = teamSlot.split('-');
      return teamPlayers[team][player] || `${team} ${player}`;
    }
  };

  return (
    <div className="text-center">
      <h3 className="fw-bold text-dark mb-4">Attente des réponses des joueurs</h3>
      
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
                En attente de {totalInvitations - acceptedInvitations} réponse(s)...
                <br />
                <small>Les joueurs ont 5 minutes pour répondre</small>
              </>
            ) : (
              <>
                <i className="bi bi-check-circle-fill text-success me-2"></i>
                Tous les joueurs ont accepté l'invitation !
              </>
            )}
          </p>

          {/* Show player status */}
          <div className="row g-2 mt-3">
            {Object.entries(playerAcceptanceStatus).map(([teamSlot, accepted]) => {
              const playerName = getPlayerName(teamSlot);
              
              return (
                <div key={teamSlot} className="col-6 col-md-4">
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
          Commencer la partie
        </button>
      )}

      <button 
        className="btn btn-outline-secondary"
        onClick={onCancel}
      >
        <i className="bi bi-x-circle me-2"></i>
        Annuler
      </button>
    </div>
  );
};

export default InvitationWaiting;