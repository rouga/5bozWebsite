// client/src/components/LiveScoresCard.jsx
import React, { useState, useEffect } from 'react';

// Utility function to calculate game duration
const calculateDuration = (createdAt, currentTime) => {
  const startTime = new Date(createdAt);
  const now = currentTime || new Date();
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

const LiveScoresCard = ({ activeGames, loading, error }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedGame, setExpandedGame] = useState(null);

  // Update time every second for real-time duration updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleGameDetails = (gameIndex) => {
    setExpandedGame(expandedGame === gameIndex ? null : gameIndex);
  };

  // Calculate round win statistics
  const calculateRoundWinStats = (gameData) => {
    if (!gameData.roundWinners || !Array.isArray(gameData.roundWinners)) {
      return [];
    }
    
    // Count wins for each player
    const winCounts = {};
    gameData.roundWinners.forEach(winner => {
      if (winner) {
        winCounts[winner] = (winCounts[winner] || 0) + 1;
      }
    });
    
    // Convert to array and sort by count descending
    const stats = Object.entries(winCounts).map(([name, count]) => ({
      name,
      count
    }));
    
    stats.sort((a, b) => b.count - a.count);
    return stats;
  };
  
  const renderWinStats = (gameData) => {
    const stats = calculateRoundWinStats(gameData);
    
    if (stats.length === 0) {
      return (
        <div className="text-center text-muted">
          <small>No round winner data available</small>
        </div>
      );
    }
    
    return (
      <div className="mt-3 mb-3">
        <h6 className="text-muted mb-2">Round Win Statistics</h6>
        <div className="row g-2">
          {stats.map((stat, index) => (
            <div key={index} className="col-6 col-md-3">
              <div className={`text-center p-2 rounded ${index === 0 ? 'bg-warning bg-opacity-10' : 'bg-light'}`}>
                <div className="fw-semibold small">{stat.name}</div>
                <div className="d-flex align-items-center justify-content-center gap-1">
                  <i className="bi bi-trophy-fill text-warning"></i>
                  <span className="h5 mb-0">{stat.count}</span>
                  <small className="text-muted">wins</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRoundDetails = (gameData, gameType) => {
    if (gameType === 'chkan') {
      const players = gameData.players || [];
      const maxRounds = Math.max(...players.map(p => p.scores.length));
      
      if (maxRounds === 0) return <p className="text-muted">No rounds completed yet.</p>;
      
      // Helper function to get dealer name for a specific round
      const getDealerForRound = (roundIndex) => {
        if (gameData.initialDealer === undefined) return null;
        
        const initialDealerIndex = parseInt(gameData.initialDealer);
        const numPlayers = players.length;
        const dealerIndex = (initialDealerIndex + roundIndex) % numPlayers;
        return players[dealerIndex]?.name;
      };
      
      return (
        <>
          <div className="table-responsive mt-3">
            <table className="table table-sm table-bordered">
              <thead className="bg-light">
                <tr>
                  <th className="fw-semibold">Player</th>
                  {Array.from({ length: maxRounds }, (_, i) => (
                    <th key={i} className="text-center fw-semibold">
                      <div>R{i + 1}</div>
                      {gameData.initialDealer !== undefined && (
                        <div className="small text-muted">
                          <i className="bi bi-shuffle me-1"></i>
                          {getDealerForRound(i)}
                        </div>
                      )}
                      {gameData.roundWinners && gameData.roundWinners[i] && (
                        <div className="small text-warning mt-1">
                          <i className="bi bi-trophy-fill me-1"></i>
                          {gameData.roundWinners[i]}
                        </div>
                      )}
                    </th>
                  ))}
                  <th className="text-center fw-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr key={index}>
                    <td className="fw-medium">{player.name}</td>
                    {Array.from({ length: maxRounds }, (_, roundIndex) => (
                      <td key={roundIndex} className="text-center">
                        {player.scores[roundIndex] !== undefined ? player.scores[roundIndex] : '–'}
                      </td>
                    ))}
                    <td className="text-center fw-bold bg-primary text-white">
                      {player.scores.reduce((a, b) => a + b, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Round Win Statistics */}
          {renderWinStats(gameData)}
        </>
      );
    } else {
      const teams = gameData.teams || [];
      const maxRounds = Math.max(...teams.map(t => t.scores.length));
      
      if (maxRounds === 0) return <p className="text-muted">No rounds completed yet.</p>;
      
      // Helper function to get dealer name for a specific round
      const getDealerForRound = (roundIndex) => {
        if (gameData.initialDealer === undefined) return null;
        
        const initialDealerIndex = parseInt(gameData.initialDealer);
        
        // Create dealer order array
        const dealerOrder = [];
        
        // Team 1 player 1
        if (teams[0]?.players?.[0]) {
          dealerOrder.push(teams[0].players[0]);
        }
        
        // Team 2 player 1
        if (teams[1]?.players?.[0]) {
          dealerOrder.push(teams[1].players[0]);
        }
        
        // Team 1 player 2
        if (teams[0]?.players?.[1]) {
          dealerOrder.push(teams[0].players[1]);
        }
        
        // Team 2 player 2
        if (teams[1]?.players?.[1]) {
          dealerOrder.push(teams[1].players[1]);
        }
        
        if (dealerOrder.length === 0) return null;
        
        const dealerIndex = (initialDealerIndex + roundIndex) % dealerOrder.length;
        return dealerOrder[dealerIndex];
      };
      
      // Format player names for team display
      const formatTeamPlayerNames = (team) => {
        if (!team.players || team.players.length === 0) return team.name;
        return team.players.join(' & ');
      };
      
      return (
        <>
          <div className="table-responsive mt-3">
            <table className="table table-sm table-bordered">
              <thead className="bg-light">
                <tr>
                  <th className="fw-semibold">Team</th>
                  {Array.from({ length: maxRounds }, (_, i) => (
                    <th key={i} className="text-center fw-semibold">
                      <div>R{i + 1}</div>
                      {gameData.initialDealer !== undefined && (
                        <div className="small text-muted">
                          <i className="bi bi-shuffle me-1"></i>
                          {getDealerForRound(i)}
                        </div>
                      )}
                      {gameData.roundWinners && gameData.roundWinners[i] && (
                        <div className="small text-warning mt-1">
                          <i className="bi bi-trophy-fill me-1"></i>
                          {gameData.roundWinners[i]}
                        </div>
                      )}
                    </th>
                  ))}
                  <th className="text-center fw-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => {
                  const playerNames = formatTeamPlayerNames(team);
                  
                  return (
                    <tr key={index}>
                      <td className="fw-medium">
                        <div>{playerNames}</div>
                        <small className="text-muted">{team.name}</small>
                      </td>
                      {Array.from({ length: maxRounds }, (_, roundIndex) => (
                        <td key={roundIndex} className="text-center">
                          {team.scores[roundIndex] !== undefined ? team.scores[roundIndex] : '–'}
                        </td>
                      ))}
                      <td className="text-center fw-bold bg-primary text-white">
                        {team.scores.reduce((a, b) => a + b, 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Round Win Statistics */}
          {renderWinStats(gameData)}
        </>
      );
    }
  };

  const renderActiveGame = (game, index) => {
    if (!game.gameState) return null;

    const gameData = typeof game.gameState === 'string' 
      ? JSON.parse(game.gameState) 
      : game.gameState;

    const gameType = game.gameType;
    const duration = calculateDuration(game.createdAt, currentTime);
    const isExpanded = expandedGame === index;

    if (gameType === 'chkan') {
      const players = gameData.players || [];
      const currentRound = gameData.currentRound || 1;
      const totalRounds = players.length > 0 ? players[0].scores.length : 0;
      
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
                <span className="badge bg-info me-2">🧍‍♂️ Chkan</span>
                <span className="fw-semibold">Crée par {game.username}</span>
              </div>
              <div className="text-end">
                <div className="text-muted small">
                  Tours {currentRound}
                  {totalRounds > 0 && (
                    <span className="ms-1">
                      ({totalRounds} complétés)
                    </span>
                  )}
                </div>
                <div className="text-muted small">
                  <i className="bi bi-clock me-1"></i>
                  {duration}
                </div>
              </div>
            </div>
            
            <div className="row g-2">
              {sortedPlayers.map((player, playerIndex) => {
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

            {/* Show additional info for more than 4 players */}
            {sortedPlayers.length > 4 && (
              <div className="text-center mt-2">
                <small className="text-muted">
                  +{sortedPlayers.length - 4} more player{sortedPlayers.length - 4 > 1 ? 's' : ''}
                </small>
              </div>
            )}

            {/* Show/Hide Details Button */}
            {totalRounds > 0 && (
              <div className="d-flex justify-content-center mt-3 pt-3 border-top">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => toggleGameDetails(index)}
                >
                  {isExpanded ? (
                    <>
                      <i className="bi bi-chevron-up me-1"></i>
                      Masquer les détails
                    </>
                  ) : (
                    <>
                      <i className="bi bi-chevron-down me-1"></i>
                      Afficher les détails
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="card-footer bg-light">
              <h6 className="text-muted mb-2">Scores tour par tour</h6>
              {renderRoundDetails(gameData, gameType)}
            </div>
          )}
        </div>
      );
    } else if (gameType === 's7ab') {
      const teams = gameData.teams || [];
      const currentRound = gameData.currentRound || 1;
      const totalRounds = teams.length > 0 ? teams[0].scores.length : 0;
      
      if (teams.length < 2) return null;

      const team1Score = teams[0].scores.reduce((sum, score) => sum + score, 0);
      const team2Score = teams[1].scores.reduce((sum, score) => sum + score, 0);
      const isTeam1Leading = team1Score < team2Score;

      // Format player names
      const formatTeamPlayers = (team) => {
        if (!team.players || team.players.length === 0) return team.name;
        return team.players.join(' & ');
      };

      const team1Players = formatTeamPlayers(teams[0]);
      const team2Players = formatTeamPlayers(teams[1]);

      return (
        <div key={index} className="card border-0 shadow-sm mb-3">
          <div className="card-body p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center">
                <span className="badge bg-success me-2">👬 S7ab</span>
                <span className="fw-semibold">Crée par {game.username}</span>
              </div>
              <div className="text-end">
                <div className="text-muted small">
                  Tours {currentRound}
                  {totalRounds > 0 && (
                    <span className="ms-1">
                      ({totalRounds} complétés)
                    </span>
                  )}
                </div>
                <div className="text-muted small">
                  <i className="bi bi-clock me-1"></i>
                  {duration}
                </div>
              </div>
            </div>
            
            <div className="row g-2">
              <div className="col-5">
                <div className={`text-center p-2 rounded ${isTeam1Leading ? 'bg-success bg-opacity-10 border-success' : 'bg-light'}`}>
                  <div className="fw-bold small text-muted">
                    {isTeam1Leading ? '👑 LEADING' : 'TEAM 1'}
                  </div>
                  <div className="fw-semibold small">{team1Players}</div>
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
                  <div className="fw-semibold small">{team2Players}</div>
                  <div className={`h5 mb-0 ${!isTeam1Leading ? 'text-success' : 'text-primary'}`}>
                    {team2Score}
                  </div>
                </div>
              </div>
            </div>

            {/* Show/Hide Details Button */}
            {totalRounds > 0 && (
              <div className="d-flex justify-content-center mt-3 pt-3 border-top">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => toggleGameDetails(index)}
                >
                  {isExpanded ? (
                    <>
                      <i className="bi bi-chevron-up me-1"></i>
                      Masquer les détails
                    </>
                  ) : (
                    <>
                      <i className="bi bi-chevron-down me-1"></i>
                      Afficher les détails
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="card-footer bg-light">
              <h6 className="text-muted mb-2">Scores tour par tour</h6>
              {renderRoundDetails(gameData, gameType)}
            </div>
          )}
        </div>
      );
    }

    return null;
  };
  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement des Jeux en direct...</span>
        </div>
        <p className="text-muted mt-2 mb-0">Chargement des Jeux en direct...</p>
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
        <h6 className="text-muted">Aucun jeu actif pour le moment</h6>
        <p className="text-muted small mb-0">
          Commencez une nouvelle partie pour voir les scores en direct ici !
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
            Mise à jour automatique toutes les 30 secondes
          </small>
        </div>
      )}
    </div>
  );
};

export default LiveScoresCard;