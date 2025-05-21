import { useState, useEffect } from 'react';
import { GameCard, GameDetails, LoadingSpinner, EmptyState, PageHeader, StatusAlert } from '../src/components';
import { API_BASE_URL } from '../src/utils/api';

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
      const res = await fetch(`${API_BASE_URL}/api/scores?page=${page}&limit=${scoresPerPage}`);
      
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
            title="Game History"
            subtitle="Complete record of all Rami games"
            icon="♠️"
          />

          {/* Game Cards */}
          {scores.length === 0 && !loading ? (
            <EmptyState
              icon="bi-calendar-x"
              title="No games recorded yet"
              description="Start playing to see your game history here!"
            />
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
                        <GameCard game={game} />
                        
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
                          <GameDetails game={game} />
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
            <LoadingSpinner text="Loading games..." className="my-4" />
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