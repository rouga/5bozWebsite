import { useState, useEffect } from 'react';
import {
  LoadingSpinner,
  EmptyState,
  PageHeader,
  StatusAlert
} from '../src/components';

import { API_BASE_URL } from '../src/utils/api';

const JakiHistoryPage = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedGame, setExpandedGame] = useState(null);
  const gamesPerPage = 10;

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/jaki/games?page=${page}&limit=${gamesPerPage}`, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch Jaki games');
      }
      
      const data = await res.json();
      
      if (data.length < gamesPerPage) {
        setHasMore(false);
      }
      
      setGames(prev => page === 1 ? data : [...prev, ...data]);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching Jaki games:', err);
      setError('Failed to load games. Please try again later.');
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    if (page > 1) {
      fetchGames();
    }
  }, [page]);

  // Toggle expanded view for a game
  const toggleExpanded = (gameId) => {
    setExpandedGame(expandedGame === gameId ? null : gameId);
  };

  // Calculate game duration
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return null;
    
    // Handle timezone issues by ensuring both dates are properly parsed
    let start, end;
    
    try {
      // If the timestamp includes 'Z' or timezone info, use it as-is
      // Otherwise, treat it as UTC
      if (startTime.includes('Z') || startTime.includes('+') || startTime.includes('-')) {
        start = new Date(startTime);
      } else {
        // Assume UTC if no timezone specified
        start = new Date(startTime + 'Z');
      }
      
      if (endTime.includes('Z') || endTime.includes('+') || endTime.includes('-')) {
        end = new Date(endTime);
      } else {
        // Assume UTC if no timezone specified
        end = new Date(endTime + 'Z');
      }
    } catch (error) {
      console.error('Error parsing timestamps:', error);
      return null;
    }
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return null;
    }
    
    // Calculate the difference
    const diffMs = end.getTime() - start.getTime();
    
    // If duration is negative or unreasonably long (more than 24 hours), return null
    if (diffMs <= 0 || diffMs > 24 * 60 * 60 * 1000) {
      return null;
    }
    
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

  // Render game details expanded view
  const renderGameDetails = (game) => {
    const gameData = typeof game.game_data === 'string' ? JSON.parse(game.game_data) : game.game_data;

    if (!gameData || !gameData.rounds || gameData.rounds.length === 0) {
      return (
        <div className="text-center py-3">
          <p className="text-muted">Pas de détail de tour disponible.</p>
        </div>
      );
    }

    return (
      <div className="mt-3">
        <h6 className="text-muted mb-3">Détail tour</h6>
        <div className="table-responsive">
          <table className="table table-sm table-bordered">
            <thead className="bg-light">
              <tr>
                <th className="fw-semibold">Tour</th>
                <th className="fw-semibold">Gagnant</th>
                <th className="fw-semibold">Points</th>
                <th className="fw-semibold">Type</th>
              </tr>
            </thead>
            <tbody>
              {gameData.rounds.map((round, index) => (
                <tr key={index}>
                  <td>{round.roundNumber}</td>
                  <td>{round.winner}</td>
                  <td>{round.points}</td>
                  <td>
                    {round.isMrass ? (
                      <span className="badge bg-warning bg-gradient">
                        <i className="bi bi-ban me-1"></i>
                        Mrass
                      </span>
                    ) : (
                      <span className="badge bg-success">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="container mt-5">
        <StatusAlert status={{ type: 'error', message: error }} />
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4 px-3">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          {/* Page Header */}
          <PageHeader
            title="Historique des parties Jaki"
            subtitle="Rapport complet de toutes les parties Jaki"
            icon="🎲"
          />

          {/* Game Cards */}
          {games.length === 0 && !loading ? (
            <EmptyState
              icon="bi-calendar-x"
              title="No games recorded yet"
              description="Start playing to see your game history here!"
            />
          ) : (
            <div className="row g-3">
              {games.map(game => {
                const isExpanded = expandedGame === game.id;
                const duration = calculateDuration(game.created_at, game.played_at);
                const player1IsWinner = game.winner === game.player1;
                const player2IsWinner = game.winner === game.player2;
                
                // Extract authentication info from game_data
                const gameData = typeof game.game_data === 'string' ? JSON.parse(game.game_data) : game.game_data;
                const authenticatedPlayers = gameData?.authenticatedPlayers || [];
                const isPlayer1Authenticated = authenticatedPlayers.includes(game.player1);
                const isPlayer2Authenticated = authenticatedPlayers.includes(game.player2);
                
                return (
                  <div key={game.id} className="col-12">
                    <div className="card shadow-sm border-0 game-card">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="badge bg-warning rounded-pill">🎲 Jaki</span>
                          <div className="text-end">
                            <small className="text-muted d-block">
                              {new Date(game.played_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </small>
                            {duration && (
                              <small className="text-muted">
                                <i className="bi bi-clock me-1"></i>
                                {duration}
                              </small>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-center mb-2">
                          <small className="text-muted">Jeu sur {game.winning_score} points • {game.total_rounds} Tours complétés</small>
                        </div>
                        
                        <div className="row g-2 mb-3">
                          <div className="col-5">
                            <div className={`text-center p-2 rounded ${player1IsWinner ? 'bg-success bg-opacity-10 border-success' : 'bg-light'}`}>
                              <div className="fw-semibold small d-flex align-items-center justify-content-center gap-1">
                                {game.player1}
                                {isPlayer1Authenticated && (
                                  <i className="bi bi-check-circle-fill text-success" 
                                     title="Authenticated user" 
                                     style={{ fontSize: '0.8rem' }}></i>
                                )}
                              </div>
                              <div className={`h5 mb-0 ${player1IsWinner ? 'text-success' : 'text-primary'}`}>
                                {game.score1}
                              </div>
                              {player1IsWinner && (
                                <small className="text-success">
                                  <i className="bi bi-trophy-fill me-1"></i>
                                  Gagnant
                                </small>
                              )}
                            </div>
                          </div>
                          <div className="col-2 d-flex align-items-center justify-content-center">
                            <span className="text-muted fw-medium">VS</span>
                          </div>
                          <div className="col-5">
                            <div className={`text-center p-2 rounded ${player2IsWinner ? 'bg-success bg-opacity-10 border-success' : 'bg-light'}`}>
                              <div className="fw-semibold small d-flex align-items-center justify-content-center gap-1">
                                {game.player2}
                                {isPlayer2Authenticated && (
                                  <i className="bi bi-check-circle-fill text-success" 
                                     title="Authenticated user" 
                                     style={{ fontSize: '0.8rem' }}></i>
                                )}
                              </div>
                              <div className={`h5 mb-0 ${player2IsWinner ? 'text-success' : 'text-primary'}`}>
                                {game.score2}
                              </div>
                              {player2IsWinner && (
                                <small className="text-success">
                                  <i className="bi bi-trophy-fill me-1"></i>
                                  Gagnant
                                </small>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="d-flex justify-content-center">
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => toggleExpanded(game.id)}
                          >
                            {isExpanded ? (
                              <>
                                <i className="bi bi-chevron-up me-1"></i>
                                Cacher Details
                              </>
                            ) : (
                              <>
                                <i className="bi bi-chevron-down me-1"></i>
                                Montrer Details
                              </>
                            )}
                          </button>
                        </div>
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
            <LoadingSpinner text="Chargement des parties..." className="my-4" />
          )}
          
          {/* Load More Button */}
          {hasMore && !loading && games.length > 0 && (
            <div className="text-center mt-4 mb-4">
              <button 
                className="btn btn-outline-primary btn-lg px-4"
                onClick={loadMore}
              >
                <i className="bi bi-arrow-down-circle me-2"></i>
                Charger plus de parties
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JakiHistoryPage;