import React from 'react';

const ActiveGame = ({
  gameState,
  roundWinner,
  isMrassWin,
  showRoundDetails,
  gameCreatedAt,
  gameTime,
  onRoundWinnerChange,
  onToggleMrassWin,
  onAddRound,
  onToggleRoundDetails,
  onFinishGame,
  onCancelGame,
  loading
}) => {
  if (!gameState) return null;
  
  const { players, winningScore, currentRound } = gameState;
  const completedRounds = currentRound - 1;
  
  // Calculate game duration
  const calculateDuration = () => {
    if (!gameCreatedAt) return '';
    
    const startTime = new Date(gameCreatedAt);
    const now = gameTime;
    const diffMs = now - startTime;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  const duration = calculateDuration();
  
  return (
    <div>
      <div className="card border-primary mb-4">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1">🎲 Jaki Game</h5>
              <div className="small">
                <span className="me-3">
                  <i className="bi bi-arrow-repeat me-1"></i>
                  Round {currentRound}
                  {completedRounds > 0 && (
                    <span className="ms-1">({completedRounds} completed)</span>
                  )}
                </span>
                {duration && (
                  <span>
                    <i className="bi bi-clock me-1"></i>
                    Duration: {duration}
                  </span>
                )}
              </div>
            </div>
            <div>
              <button 
                className="btn btn-outline-light btn-sm me-2"
                onClick={onCancelGame}
              >
                <i className="bi bi-x-circle me-1"></i>
                Cancel
              </button>
              <button 
                className="btn btn-light btn-sm"
                onClick={onFinishGame}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    Finishing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-1"></i>
                    Finish Game
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div className="card-body">
          <div className="mb-4">
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              Jeu sur {winningScore} points. Premier joueur qui collecte {winningScore} points gagne.
            </div>
          </div>
          
          {/* Current Standings */}
          <div className="row g-3 mb-4">
            {players.map((player, index) => (
              <div key={index} className="col-6">
                <div className={`card h-100 ${player.score >= winningScore ? 'border-success' : 'border-0 shadow-sm'}`}>
                  <div className={`card-header ${player.score >= winningScore ? 'bg-success text-white' : 'bg-light'}`}>
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">{player.name}</h5>
                      {player.score >= winningScore && (
                        <span className="badge bg-warning text-dark">
                          <i className="bi bi-trophy-fill me-1"></i>
                          Winner
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="card-body text-center">
                    <div className={`display-4 fw-bold ${player.score >= winningScore ? 'text-success' : 'text-primary'}`}>
                      {player.score}
                    </div>
                    <div className="text-muted">points</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Round Details */}
          {completedRounds > 0 && (
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Round History</h6>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={onToggleRoundDetails}
                >
                  {showRoundDetails ? (
                    <>
                      <i className="bi bi-chevron-up me-1"></i>
                      Hide Details
                    </>
                  ) : (
                    <>
                      <i className="bi bi-chevron-down me-1"></i>
                      Show Details
                    </>
                  )}
                </button>
              </div>
              
              {showRoundDetails && (
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead className="bg-light">
                        <tr>
                          <th>Round</th>
                          <th>Winner</th>
                          <th>Points</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gameState.rounds.map((round, index) => (
                          <tr key={index}>
                            <td>{round.roundNumber}</td>
                            <td>{round.winner}</td>
                            <td>{round.points}</td>
                            <td>
                              {round.isMrass ? (
                                <span className="badge bg-danger">
                                  <i className="bi bi-hand-index-thumb me-1"></i>
                                  Mrass
                                </span>
                              ) : (
                                <span className="badge bg-primary">Normal</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Add Round Form */}
          {!gameState.completed && (
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="bi bi-plus-circle me-2"></i>
                  Add Round {currentRound}
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Round Winner</label>
                  <div className="row g-2">
                    {players.map((player, index) => (
                      <div key={index} className="col-6">
                        <div
                          className={`card text-center ${roundWinner === player.name ? 'border-success' : 'border'} cursor-pointer`}
                          onClick={() => onRoundWinnerChange(player.name)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="card-body py-3">
                            <div className="fw-bold">{player.name}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="mrass-win"
                      checked={isMrassWin}
                      onChange={onToggleMrassWin}
                      disabled={!roundWinner}
                    />
                    <label className="form-check-label" htmlFor="mrass-win">
                      <span className="me-1">Win by Mrass</span>
                      <span className="text-danger">(2 points)</span>
                    </label>
                  </div>
                </div>
                
                <div className="text-center">
                  <button
                    className="btn btn-primary btn-lg px-4"
                    onClick={onAddRound}
                    disabled={!roundWinner}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Add Round
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveGame;