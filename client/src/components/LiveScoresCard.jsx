// client/src/components/LiveScoresCard.jsx
import React from 'react';

const LiveScoresCard = ({ activeGames, loading, error }) => {
  const renderActiveGame = (game, index) => {
    if (!game.gameState) return null;

    const gameData = typeof game.gameState === 'string' 
      ? JSON.parse(game.gameState) 
      : game.gameState;

    if (game.gameType === 'chkan') {
      const players = gameData.players || [];
      const currentRound = gameData.currentRound || 1;
      
      // Sort players by current score
      const sortedPlayers = [...players].sort((a, b) => {
        const scoreA = a.scores.reduce((sum, score) => sum + score, 0);
        const scoreB = b.scores.reduce((sum, score) => sum + score, 0);
        return scoreA - scoreB;
      });

      return (
        <div key={index} className="card border-0 shadow-sm mb-3">
          <div className="card-body p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center">
                <span className="badge bg-info me-2">🎯 Chkan</span>
                <span className="fw-semibold">{game.username}'s Game</span>
              </div>
              <div className="text-muted small">
                Round {currentRound}
                <span className="ms-2">
                  <i className="bi bi-clock"></i>
                  <span className="ms-1">Live</span>
                </span>
              </div>
            </div>
            
            <div className="row g-2">
              {sortedPlayers.slice(0, 4).map((player, playerIndex) => {
                const totalScore = player.scores.reduce((sum, score) => sum + score, 0);
                const isLeading = playerIndex === 0;
                
                return (
                  <div key={playerIndex} className="col-6 col-lg-3">
                    <div className={`text-center p-2 rounded ${isLeading ? 'bg-success bg-opacity-10 border-success' : 'bg-light'}`}>
                      <div className="fw-bold small text-muted">
                        {isLeading ? '👑 LEADING' : `#${playerIndex + 1}`}
                      </div>
                      <div className="fw-semibold small">{player.name}</div>
                      <div className={`h6 mb-0 ${isLeading ? 'text-success' : 'text-primary'}`}>
                        {totalScore}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    } else if (game.gameType === 's7ab') {
      const teams = gameData.teams || [];
      const currentRound = gameData.currentRound || 1;
      
      if (teams.length < 2) return null;

      const team1Score = teams[0].scores.reduce((sum, score) => sum + score, 0);
      const team2Score = teams[1].scores.reduce((sum, score) => sum + score, 0);
      const isTeam1Leading = team1Score < team2Score;

      return (
        <div key={index} className="card border-0 shadow-sm mb-3">
          <div className="card-body p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center">
                <span className="badge bg-success me-2">🤝 S7ab</span>
                <span className="fw-semibold">{game.username}'s Game</span>
              </div>
              <div className="text-muted small">
                Round {currentRound}
                <span className="ms-2">
                  <i className="bi bi-clock"></i>
                  <span className="ms-1">Live</span>
                </span>
              </div>
            </div>
            
            <div className="row g-2">
              <div className="col-5">
                <div className={`text-center p-2 rounded ${isTeam1Leading ? 'bg-success bg-opacity-10 border-success' : 'bg-light'}`}>
                  <div className="fw-bold small text-muted">
                    {isTeam1Leading ? '👑 LEADING' : 'TEAM 1'}
                  </div>
                  <div className="fw-semibold small">{teams[0].name}</div>
                  <div className={`h5 mb-0 ${isTeam1Leading ? 'text-success' : 'text-primary'}`}>
                    {team1Score}
                  </div>
                </div>
              </div>
              <div className="col-2 d-flex align-items-center justify-content-center">
                <span className="text-muted fw-medium">VS</span>
              </div>
              <div className="col-5">
                <div className={`text-center p-2 rounded ${!isTeam1Leading ? 'bg-success bg-opacity-10 border-success' : 'bg-light'}`}>
                  <div className="fw-bold small text-muted">
                    {!isTeam1Leading ? '👑 LEADING' : 'TEAM 2'}
                  </div>
                  <div className="fw-semibold small">{teams[1].name}</div>
                  <div className={`h5 mb-0 ${!isTeam1Leading ? 'text-success' : 'text-primary'}`}>
                    {team2Score}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading live games...</span>
        </div>
        <p className="text-muted mt-2 mb-0">Loading live games...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
      </div>
    );
  }

  if (!activeGames || activeGames.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="mb-3">
          <i className="bi bi-controller text-muted" style={{ fontSize: '3rem' }}></i>
        </div>
        <h6 className="text-muted">No active games at the moment</h6>
        <p className="text-muted small mb-0">
          Start a new game to see live scores here!
        </p>
      </div>
    );
  }

  return (
    <div>
      {activeGames.map((game, index) => renderActiveGame(game, index))}
      {activeGames.length > 0 && (
        <div className="text-center mt-3">
          <small className="text-muted">
            <i className="bi bi-arrow-clockwise me-1"></i>
            Updates in real-time every 30 seconds
          </small>
        </div>
      )}
    </div>
  );
};

export default LiveScoresCard;