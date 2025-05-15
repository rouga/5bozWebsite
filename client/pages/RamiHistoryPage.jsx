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
          <h6>Round Details:</h6>
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Player</th>
                  {Array.from({ length: maxRounds }, (_, i) => (
                    <th key={i} className="text-center">R{i + 1}</th>
                  ))}
                  <th className="text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr key={index}>
                    <td className="fw-bold">{player.name}</td>
                    {Array.from({ length: maxRounds }, (_, roundIndex) => (
                      <td key={roundIndex} className="text-center">
                        {player.scores[roundIndex] || '-'}
                      </td>
                    ))}
                    <td className="text-center fw-bold">
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
          <h6>Round Details:</h6>
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Team</th>
                  {Array.from({ length: maxRounds }, (_, i) => (
                    <th key={i} className="text-center">R{i + 1}</th>
                  ))}
                  <th className="text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => (
                  <tr key={index}>
                    <td className="fw-bold">{team.name}</td>
                    {Array.from({ length: maxRounds }, (_, roundIndex) => (
                      <td key={roundIndex} className="text-center">
                        {team.scores[roundIndex] || '-'}
                      </td>
                    ))}
                    <td className="text-center fw-bold">
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

  // Function to format game result for display
  const formatGameResult = (game) => {
    if (game.type === 'chkan') {
      return (
        <div>
          <span className="badge bg-info me-2">Chkan</span>
          <div className="mt-1">
            <strong>Winners:</strong> {game.winners || 'No winners'}
          </div>
          <div className="small text-muted mt-1">
            {game.player_scores}
          </div>
        </div>
      );
    } else {
      // S7ab game (legacy format)
      return (
        <div>
          <span className="badge bg-success me-2">S7ab</span>
          <div className="d-flex justify-content-between align-items-center mt-1">
            <div>
              <span className="fw-bold me-2">{game.team1}</span>
              <span className="badge bg-primary rounded-pill">{game.score1}</span>
            </div>
            <span className="mx-2">vs</span>
            <div>
              <span className="badge bg-primary rounded-pill">{game.score2}</span>
              <span className="fw-bold ms-2">{game.team2}</span>
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
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-12">
          <div className="card shadow">
            <div className="card-header bg-light">
              <h2 className="mb-0">
                <span className="me-2">♠️</span>
                Complete Rami History
              </h2>
            </div>
            <div className="card-body">
              {scores.length === 0 && !loading ? (
                <p className="text-muted text-center">No games recorded yet</p>
              ) : (
                <div className="accordion" id="gameHistoryAccordion">
                  {scores.map(game => {
                    const details = getGameDetails(game);
                    const isExpanded = expandedGame === game.id;
                    
                    return (
                      <div key={game.id} className="accordion-item">
                        <h6 className="accordion-header" id={`heading${game.id}`}>
                          <button
                            className={`accordion-button ${isExpanded ? '' : 'collapsed'}`}
                            type="button"
                            onClick={() => toggleExpanded(game.id)}
                            aria-expanded={isExpanded}
                          >
                            <div className="d-flex justify-content-between w-100 me-3">
                              <div>
                                <span className="me-3">{new Date(game.played_at).toLocaleDateString()}</span>
                                <span className={`badge ${game.type === 'chkan' ? 'bg-info' : 'bg-success'} me-2`}>
                                  {game.type === 'chkan' ? 'Chkan' : 'S7ab'}
                                </span>
                              </div>
                              <div className="text-end">
                                {game.type === 'chkan' ? (
                                  <span className="text-muted">
                                    Winners: {game.winners || 'No winners'}
                                  </span>
                                ) : (
                                  <span className="text-muted">
                                    {game.team1} ({game.score1}) vs {game.team2} ({game.score2})
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        </h6>
                        {isExpanded && (
                          <div className="accordion-collapse show">
                            <div className="accordion-body">
                              {renderGameDetails(game)}
                              {details && (
                                <div className="mt-3 text-muted">
                                  <small>
                                    <strong>Game Summary:</strong> {details.rounds} rounds completed
                                  </small>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {loading && (
                <div className="text-center my-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              
              {hasMore && !loading && scores.length > 0 && (
                <div className="text-center mt-3">
                  <button 
                    className="btn btn-outline-primary" 
                    onClick={loadMore}
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}