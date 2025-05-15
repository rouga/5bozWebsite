import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../src/hooks/useAuth';

export default function RamiPage() {
  const [user] = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [gameType, setGameType] = useState(''); // 'chkan' or 's7ab'
  const [gameState, setGameState] = useState(null); // Current active game
  const [status, setStatus] = useState(null);
  
  // Round input state
  const [roundScores, setRoundScores] = useState({});
  const [roundInputError, setRoundInputError] = useState(null);
  
  // History state
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scoresPerPage = 10;

  // Fetch scores on component mount
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

  // Initialize new game
  const initializeGame = (type) => {
    setGameType(type);
    if (type === 'chkan') {
      setGameState({
        type: 'chkan',
        players: [
          { name: '', scores: [], totalScore: 0 },
          { name: '', scores: [], totalScore: 0 }
        ],
        currentRound: 1,
        isComplete: false
      });
    } else if (type === 's7ab') {
      setGameState({
        type: 's7ab',
        teams: [
          { name: '', scores: [], totalScore: 0 },
          { name: '', scores: [], totalScore: 0 }
        ],
        currentRound: 1,
        isComplete: false
      });
    }
    setRoundScores({});
    setRoundInputError(null);
    setShowForm(true);
  };

  // Add player (Chkan only)
  const addPlayer = () => {
    if (gameState && gameState.players && gameState.players.length < 4) {
      setGameState(prev => ({
        ...prev,
        players: [...prev.players, { name: '', scores: [], totalScore: 0 }]
      }));
    }
  };

  // Remove player (Chkan only)
  const removePlayer = (index) => {
    if (gameState && gameState.players && gameState.players.length > 2) {
      setGameState(prev => ({
        ...prev,
        players: prev.players.filter((_, i) => i !== index)
      }));
      // Clear round scores for removed player
      const newRoundScores = { ...roundScores };
      delete newRoundScores[index];
      setRoundScores(newRoundScores);
    }
  };

  // Update player/team name
  const updateName = (index, name) => {
    setGameState(prev => {
      if (prev.type === 'chkan') {
        const newPlayers = [...prev.players];
        newPlayers[index].name = name;
        return { ...prev, players: newPlayers };
      } else {
        const newTeams = [...prev.teams];
        newTeams[index].name = name;
        return { ...prev, teams: newTeams };
      }
    });
  };

  // Update round score input
  const handleRoundScoreChange = (index, value) => {
    setRoundScores(prev => ({
      ...prev,
      [index]: value
    }));
    setRoundInputError(null);
  };

  // Add round scores
  const submitRound = () => {
    setRoundInputError(null);
    
    // Validate inputs
    const entities = gameState.type === 'chkan' ? gameState.players : gameState.teams;
    const hasEmptyScores = entities.some((_, index) => !roundScores[index] && roundScores[index] !== '0');
    
    if (hasEmptyScores) {
      setRoundInputError('Please fill in all scores for this round');
      return;
    }

    // Validate names are filled
    const hasEmptyNames = entities.some(entity => !entity.name.trim());
    if (hasEmptyNames) {
      setRoundInputError('Please fill in all player/team names before adding scores');
      return;
    }

    // Convert scores to numbers and validate
    const scores = entities.map((_, index) => {
      const score = parseInt(roundScores[index]);
      if (isNaN(score) || score < 0) {
        setRoundInputError('All scores must be valid positive numbers');
        return null;
      }
      return score;
    });

    if (scores.includes(null)) return;

    // Add scores to game state
    setGameState(prev => {
      if (prev.type === 'chkan') {
        const newPlayers = prev.players.map((player, index) => {
          const newScores = [...player.scores, scores[index]];
          return {
            ...player,
            scores: newScores,
            totalScore: newScores.reduce((sum, score) => sum + score, 0)
          };
        });
        return {
          ...prev,
          players: newPlayers,
          currentRound: prev.currentRound + 1
        };
      } else {
        const newTeams = prev.teams.map((team, index) => {
          const newScores = [...team.scores, scores[index]];
          return {
            ...team,
            scores: newScores,
            totalScore: newScores.reduce((sum, score) => sum + score, 0)
          };
        });
        return {
          ...prev,
          teams: newTeams,
          currentRound: prev.currentRound + 1
        };
      }
    });

    // Clear round scores for next round
    setRoundScores({});
  };

  // Finish game and determine winners
  const finishGame = async () => {
    if (!gameState) return;

    // Check if game has any rounds
    const entities = gameState.type === 'chkan' ? gameState.players : gameState.teams;
    if (!entities[0].scores.length) {
      setRoundInputError('Cannot finish game without any completed rounds');
      return;
    }

    let gameResult;
    
    if (gameState.type === 'chkan') {
      // In Chkan, players below 701 win
      const playersWithTotals = gameState.players.map(player => ({
        name: player.name,
        total: player.totalScore,
        scores: player.scores
      }));
      
      const winners = playersWithTotals.filter(player => player.total < 701);
      const losers = playersWithTotals.filter(player => player.total >= 701);
      
      gameResult = {
        type: 'chkan',
        winners: winners.length > 0 ? winners.map(w => w.name).join(', ') : 'No Winners',
        losers: losers.length > 0 ? losers.map(l => l.name).join(', ') : 'All Players',
        player_scores: playersWithTotals.map(p => `${p.name}: ${p.total}`).join(', '),
        game_data: gameState
      };
      
      console.log('Chkan game result:', gameResult); // Debug log
    } else {
      // In S7ab, team with lowest score wins
      const teamsWithTotals = gameState.teams.map(team => ({
        name: team.name,
        total: team.totalScore,
        scores: team.scores
      }));
      
      const sortedTeams = [...teamsWithTotals].sort((a, b) => a.total - b.total);
      
      gameResult = {
        type: 's7ab',
        team1: sortedTeams[0].name,
        score1: sortedTeams[0].total,
        team2: sortedTeams[1].name,
        score2: sortedTeams[1].total,
        game_data: gameState
      };
      
      console.log('S7ab game result:', gameResult); // Debug log
    }

    // Submit to backend
    try {
      const res = await fetch('http://192.168.0.12:5000/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameResult),
        credentials: 'include'
      });

      if (res.ok) {
        const savedGame = await res.json();
        console.log('Game saved successfully:', savedGame); // Debug log
        setStatus({ type: 'success', message: 'Game completed successfully!' });
        setGameState(null);
        setShowForm(false);
        setGameType('');
        setRoundScores({});
        
        // Refresh the scores list
        setPage(1);
        setHasMore(true);
        fetchScores();
      } else {
        const errorData = await res.json();
        console.error('Save game error:', errorData); // Debug log
        setStatus({ type: 'error', message: `Failed to save game: ${errorData.error || 'Unknown error'}` });
      }
    } catch (err) {
      console.error('Network error saving game:', err);
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    }

    // Hide the alert after 3 seconds
    setTimeout(() => setStatus(null), 3000);
  };

  // Cancel game
  const cancelGame = () => {
    setGameState(null);
    setShowForm(false);
    setGameType('');
    setRoundScores({});
    setRoundInputError(null);
  };

  // Check if game has started (at least one round completed)
  const gameHasStarted = () => {
    if (!gameState) return false;
    const entities = gameState.type === 'chkan' ? gameState.players : gameState.teams;
    return entities[0] && entities[0].scores && entities[0].scores.length > 0;
  };

  // Check if all names are filled
  const allNamesProvided = () => {
    if (!gameState) return false;
    const entities = gameState.type === 'chkan' ? gameState.players : gameState.teams;
    return entities.every(entity => entity.name.trim());
  };

  // Check if current round has any scores entered
  const hasRoundScoresEntered = () => {
    return Object.keys(roundScores).length > 0 && Object.values(roundScores).some(score => score !== '');
  };

  // Render round input form
  const renderRoundInput = () => {
    if (!gameState || !allNamesProvided()) return null;

    const entities = gameState.type === 'chkan' ? gameState.players : gameState.teams;

    return (
      <div className="mt-4 p-3 bg-light rounded">
        <h5>Round {gameState.currentRound} Scores</h5>
        
        {roundInputError && (
          <div className="alert alert-danger alert-sm mb-3">
            {roundInputError}
          </div>
        )}
        
        <div className="row g-2">
          {entities.map((entity, index) => (
            <div key={index} className="col-md-3">
              <label className="form-label fw-bold">{entity.name}</label>
              <input
                type="number"
                className="form-control"
                value={roundScores[index] || ''}
                onChange={(e) => handleRoundScoreChange(index, e.target.value)}
                placeholder="Enter score"
                min="0"
              />
            </div>
          ))}
        </div>
        
        <div className="mt-3">
          <button 
            className="btn btn-primary me-2" 
            onClick={submitRound}
            disabled={!roundScores || Object.keys(roundScores).length === 0}
          >
            Add Round {gameState.currentRound}
          </button>
          
          {entities[0].scores.length > 0 && (
            <button className="btn btn-success" onClick={finishGame}>
              Finish Game
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render score table
  const renderScoreTable = () => {
    if (!gameState) return null;
    
    const entities = gameState.type === 'chkan' ? gameState.players : gameState.teams;
    const hasScores = entities[0] && entities[0].scores && entities[0].scores.length > 0;
    
    if (!hasScores) return null;

    const maxRounds = Math.max(...entities.map(entity => entity.scores.length));

    return (
      <div className="table-responsive mb-4">
        <table className="table table-bordered table-sm">
          <thead className="table-light">
            <tr>
              <th>{gameState.type === 'chkan' ? 'Player' : 'Team'}</th>
              {Array.from({ length: maxRounds }, (_, i) => (
                <th key={i} className="text-center">R{i + 1}</th>
              ))}
              <th className="text-center fw-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {entities.map((entity, index) => (
              <tr key={index}>
                <td className="fw-bold">{entity.name}</td>
                {entity.scores.map((score, roundIndex) => (
                  <td key={roundIndex} className="text-center">
                    {score}
                  </td>
                ))}
                {/* Fill empty cells if this entity has fewer rounds */}
                {entity.scores.length < maxRounds && 
                  Array.from({ length: maxRounds - entity.scores.length }, (_, i) => (
                    <td key={`empty-${i}`} className="text-center">-</td>
                  ))
                }
                <td className="text-center fw-bold bg-primary text-white">
                  {entity.totalScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render game setup
  const renderGameSetup = () => {
    if (!gameType) {
      return (
        <div className="text-center">
          <h4 className="mb-4">Choose Rami Game Type</h4>
          <div className="row justify-content-center">
            <div className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-body text-center">
                  <h5 className="card-title">🎯 Chkan</h5>
                  <p className="card-text">Individual play (2-4 players)</p>
                  <p className="small text-muted">Winners: Players below 701 points</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => initializeGame('chkan')}
                  >
                    Start Chkan Game
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-body text-center">
                  <h5 className="card-title">🤝 S7ab</h5>
                  <p className="card-text">Team play (2 teams)</p>
                  <p className="small text-muted">Winner: Team with lowest total score</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => initializeGame('s7ab')}
                  >
                    Start S7ab Game
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!gameState) return null;

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">
            {gameType === 'chkan' ? '🎯 Chkan Game' : '🤝 S7ab Game'}
          </h4>
          <button className="btn btn-outline-secondary btn-sm" onClick={cancelGame}>
            Cancel Game
          </button>
        </div>

        {/* Player/Team Setup - Hide after game starts */}
        {!gameHasStarted() && (
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">{gameState.type === 'chkan' ? 'Players' : 'Teams'}</h6>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {gameState.type === 'chkan' ? (
                  gameState.players.map((player, index) => (
                    <div key={index} className="col-md-3">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder={`Player ${index + 1}`}
                          value={player.name}
                          onChange={(e) => updateName(index, e.target.value)}
                          maxLength={50}
                        />
                        {gameState.players.length > 2 && (
                          <button 
                            className="btn btn-outline-danger" 
                            onClick={() => removePlayer(index)}
                            type="button"
                            title="Remove player"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  gameState.teams.map((team, index) => (
                    <div key={index} className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={`Team ${index + 1}`}
                        value={team.name}
                        onChange={(e) => updateName(index, e.target.value)}
                        maxLength={50}
                      />
                    </div>
                  ))
                )}
              </div>

              {gameState.type === 'chkan' && gameState.players.length < 4 && (
                <button className="btn btn-outline-primary mt-3" onClick={addPlayer}>
                  + Add Player
                </button>
              )}
            </div>
          </div>
        )}

        {/* Score Table */}
        {renderScoreTable()}

        {/* Round Input */}
        {allNamesProvided() && renderRoundInput()}

        {/* Instructions */}
        {!allNamesProvided() && (
          <div className="alert alert-info">
            <strong>Instructions:</strong> Please fill in all {gameState.type === 'chkan' ? 'player' : 'team'} names before adding scores.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mt-2">
      <div className="row justify-content-center">
        <div className="col-md-10 pb-4">
          {/* Score Entry Section */}
          <div className="card shadow mb-4">
            <div className="card-header bg-light">
              <h2 className="mb-0">
                <span className="me-2">♠️</span>
                Rami Scores
              </h2>
            </div>
            <div className="card-body">
              {status && (
                <div className={`alert alert-${status.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
                  {status.type === 'success' ? '✅' : '❌'} {status.message}
                </div>
              )}

              {user ? (
                <div>
                  {!showForm ? (
                    <div className="text-center">
                      <p className="text-muted mb-3">Ready to start a new Rami game?</p>
                      <button 
                        className="btn btn-primary btn-lg"
                        onClick={() => setShowForm(true)}
                      >
                        <span className="me-2">+</span>
                        Start New Game
                      </button>
                    </div>
                  ) : (
                    renderGameSetup()
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="mb-3">
                    <i className="bi bi-lock-fill text-muted" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h5 className="text-muted">Login Required</h5>
                  <p className="text-muted mb-3">
                    You need to be logged in to start new Rami games.
                  </p>
                  <Link to="/login" className="btn btn-primary">
                    Login to Start Games
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* History Section */}
          <div className="card shadow">
            <div className="card-header bg-light">
              <h3 className="mb-1">
                <span className="me-2">📋</span>
                Game History
              </h3>
            </div>
            <div className="card-body">
              {error ? (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              ) : scores.length === 0 && !loading ? (
                <p className="text-muted text-center">No games recorded yet</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scores.map(game => (
                        <tr key={game.id}>
                          <td>{new Date(game.played_at).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${game.type === 'chkan' ? 'bg-info' : 'bg-success'}`}>
                              {game.type === 'chkan' ? 'Chkan' : 'S7ab'}
                            </span>
                          </td>
                          <td>
                            {game.type === 'chkan' ? (
                              <div>
                                <strong>Winners:</strong> {game.winners}<br/>
                                <small className="text-muted">{game.player_scores}</small>
                              </div>
                            ) : (
                              <div>
                                <strong>{game.team1}</strong> 
                                <span className="badge bg-primary mx-2">{game.score1}</span>
                                vs
                                <span className="badge bg-primary mx-2">{game.score2}</span>
                                <strong>{game.team2}</strong>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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