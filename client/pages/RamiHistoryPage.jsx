import { useState, useEffect } from 'react';

export default function RamiHistoryPage() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedGame, setExpandedGame] = useState(null);
  const scoresPerPage = 10;

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://192.168.0.12:5000/api/scores?page=${page}&limit=${scoresPerPage}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch scores');
      }
      
      const data = await res.json();
      
      if (data.length < scoresPerPage) {
        setHasMore(false);
      }
      
      setScores(prev => page === 1 ? data : [...prev, ...data]);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching scores:', err);
      setError('Failed to load scores. Please try again later.');
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    if (page > 1) {
      fetchScores();
    }
  }, [page]);

  // Toggle expanded view for a game
  const toggleExpanded = (gameId) => {
    setExpandedGame(expandedGame === gameId ? null : gameId);
  };

  // Render detailed rounds view
  const renderGameDetails = (game) => {
    if (!game.game_data) return null;
    
    const gameData = typeof game.game_data === 'string' ? JSON.parse(game.game_data) : game.game_data;
    
    if (game.type === 'chkan') {
      const players = gameData.players || [];
      const maxRounds = Math.max(...players.map(p => p.scores.length));
      
      return (
        <div className="mt-3">
          <h6 className="text-muted mb-3">Round Details</h6>
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead className="bg-light">
                <tr>
                  <th className="fw-semibold">Player</th>
                  {Array.from({ length: maxRounds }, (_, i) => (
                    <th key={i} className="text-center fw-semibold">R{i + 1}</th>
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
                        {player.scores[roundIndex] || '–'}
                      </td>
                    ))}
                    <td className="text-center fw-bold bg-primary text-white">
                      {player.totalScore || player.scores.reduce((a, b) => a + b, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else {
      // S7ab games
      const teams = gameData.teams || [];
      const maxRounds = Math.max(...teams.map(t => t.scores.length));
      
      return (
        <div className="mt-3">
          <h6 className="text-muted mb-3">Round Details</h6>
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead className="bg-light">
                <tr>
                  <th className="fw-semibold">Team</th>
                  {Array.from({ length: maxRounds }, (_, i) => (
                    <th key={i} className="text-center fw-semibold">R{i + 1}</th>
                  ))}
                  <th className="text-center fw-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => (
                  <tr key={index}>
                    <td className="fw-medium">{team.name}</td>
                    {Array.from({ length: maxRounds }, (_, roundIndex) => (
                      <td key={roundIndex} className="text-center">
                        {team.scores[roundIndex] || '–'}
                      </td>
                    ))}
                    <td className="text-center fw-bold bg-primary text-white">
                      {team.totalScore || team.scores.reduce((a, b) => a + b, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  };

  // Function to format game result for card display
  const formatGameResult = (game) => {
    if (game.type === 'chkan') {
      // Parse player scores
      const playerScores = game.player_scores ? game.player_scores.split(', ') : [];
      const players = playerScores.map(scoreStr => {
        const parts = scoreStr.split(': ');
        return {
          name: parts[0],
          score: parseInt(parts[1]) || 0
        };
      });
      
      // Sort players by score (lowest first)
      players.sort((a, b) => a.score - b.score);
      
      // Determine winners (below 701)
      const winners = players.filter(p => p.score < 701);
      const hasWinners = winners.length > 0;
      
      return (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="badge bg-info rounded-pill">🎯 Chkan</span>
            <small className="text-muted">
              {new Date(game.played_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </small>
          </div>
          
          {/* Player scores grid */}
          <div className="row g-2 mb-3">
            {players.map((player, index) => {
              const isWinner = hasWinners ? player.score < 701 : index === 0;
              return (
                <div key={index} className="col-6">
                  <div className={`text-center p-2 rounded ${isWinner ? 'bg-success bg-opacity-10 border-success' : 'bg-light'}`}>
                    <div className="fw-bold small text-muted">
                      {isWinner && hasWinners ? 'WINNER' : `PLAYER ${index + 1}`}
                    </div>
                    <div className="fw-semibold small">{player.name}</div>
                    <div className={`h6 mb-0 ${isWinner ? 'text-success' : 'text-primary'}`}>
                      {player.score}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Winners summary */}
          {hasWinners && (
            <div className="border-top pt-2">
              <div className="text-center">
                <span className="text-success fw-medium small">
                  🏆 {winners.length} Winner{winners.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      // S7ab game (legacy format)
      return (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="badge bg-success rounded-pill">🤝 S7ab</span>
            <small className="text-muted">
              {new Date(game.played_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </small>
          </div>
          <div className="row g-2">
            <div className="col-5">
              <div className="text-center p-2 bg-light rounded">
                <div className="fw-bold small text-muted">TEAM 1</div>
                <div className="fw-semibold">{game.team1}</div>
                <div className="h5 mb-0 text-primary">{game.score1}</div>
              </div>
            </div>
            <div className="col-2 d-flex align-items-center justify-content-center">
              <span className="text-muted fw-medium">VS</span>
            </div>
            <div className="col-5">
              <div className="text-center p-2 bg-light rounded">
                <div className="fw-bold small text-muted">TEAM 2</div>
                <div className="fw-semibold">{game.team2}</div>
                <div className="h5 mb-0 text-primary">{game.score2}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  // Function to get game details for modal/tooltip
  const getGameDetails = (game) => {
    if (game.type === 'chkan' && game.game_data) {
      const gameData = typeof game.game_data === 'string' ? JSON.parse(game.game_data) : game.game_data;
      return {
        rounds: gameData.currentRound - 1,
        players: gameData.players?.map(p => `${p.name}: ${p.scores.reduce((a, b) => a + b, 0)}`).join(', ')
      };
    } else if (game.game_data) {
      const gameData = typeof game.game_data === 'string' ? JSON.parse(game.game_data) : game.game_data;
      return {
        rounds: gameData.currentRound - 1,
        teams: `${gameData.teams?.[0]?.name}: ${gameData.teams?.[0]?.scores?.reduce((a, b) => a + b, 0) || game.score1}, ${gameData.teams?.[1]?.name}: ${gameData.teams?.[1]?.scores?.reduce((a, b) => a + b, 0) || game.score2}`
      };
    }
    return null;
  };

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger alert-modern" role="alert">
          <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4 px-3">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          {/* Modern Header */}
          <div className="mb-4">
            <h1 className="h2 fw-bold text-dark mb-1">
              <span className="me-2">♠️</span>
              Game History
            </h1>
            <p className="text-muted mb-0">Complete record of all Rami games</p>
          </div>

          {/* Game Cards */}
          {scores.length === 0 && !loading ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="bi bi-calendar-x text-muted" style={{ fontSize: '3rem' }}></i>
              </div>
              <h5 className="text-muted">No games recorded yet</h5>
              <p className="text-muted">Start playing to see your game history here!</p>
            </div>
          ) : (
            <div className="row g-3">
              {scores.map(game => {
                const details = getGameDetails(game);
                const isExpanded = expandedGame === game.id;
                
                return (
                  <div key={game.id} className="col-12">
                    <div className="card shadow-sm border-0 game-card">
                      <div 
                        className="card-body p-3 cursor-pointer"
                        onClick={() => toggleExpanded(game.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {formatGameResult(game)}
                        
                        {details && (
                          <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                            <small className="text-muted">
                              <i className="bi bi-dice-3 me-1"></i>
                              {details.rounds} round{details.rounds !== 1 ? 's' : ''} completed
                            </small>
                            <button 
                              className="btn btn-sm btn-outline-primary border-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(game.id);
                              }}
                            >
                              {isExpanded ? (
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
                        )}
                      </div>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="card-footer bg-light border-top-0 p-3">
                          {renderGameDetails(game)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Loading Spinner */}
          {loading && (
            <div className="text-center my-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-2 mb-0">Loading games...</p>
            </div>
          )}
          
          {/* Load More Button */}
          {hasMore && !loading && scores.length > 0 && (
            <div className="text-center mt-4 mb-4">
              <button 
                className="btn btn-outline-primary btn-lg px-4"
                onClick={loadMore}
              >
                <i className="bi bi-arrow-down-circle me-2"></i>
                Load More Games
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}