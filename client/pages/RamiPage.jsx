import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../src/hooks/useAuth';
import { 
  GameCard, 
  LoadingSpinner, 
  StatusAlert, 
  PageHeader, 
  SectionCard, 
  EmptyState,
  GameTypeCard,
  FormInput
} from '../src/components';
import { gameAPI, handleApiError } from '../src/utils/api';

export default function RamiPage() {
  const [user] = useAuth();
  const [gameState, setGameState] = useState(null);
  const [gameCreatedAt, setGameCreatedAt] = useState(null);
  const [gameTime, setGameTime] = useState(new Date()); 
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingActiveGame, setLoadingActiveGame] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [gameType, setGameType] = useState('');
  const [roundScores, setRoundScores] = useState({});
  const [roundInputError, setRoundInputError] = useState(null);
  const [status, setStatus] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [numberOfPlayers, setNumberOfPlayers] = useState(3);
  const [showRoundDetails, setShowRoundDetails] = useState(false);
  const scoresPerPage = 5;

  // Calculate game duration
  const calculateDuration = () => {
    if (!gameCreatedAt) return '';
    
    const startTime = new Date(gameCreatedAt);
    const now = gameTime; // Use the state variable for real-time updates
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

  // Get total completed rounds
  const getCompletedRounds = () => {
    if (!gameState) return 0;
    
    if (gameType === 'chkan') {
      return gameState.players.length > 0 ? gameState.players[0].scores.length : 0;
    } else {
      return gameState.teams.length > 0 ? gameState.teams[0].scores.length : 0;
    }
  };

  // Render round-by-round details table
  const renderRoundDetails = () => {
    const completedRounds = getCompletedRounds();
    
    if (completedRounds === 0) {
      return (
        <div className="text-center py-3">
          <p className="text-muted mb-0">Aucun tour terminé.</p>
        </div>
      );
    }

    if (gameType === 'chkan') {
      const players = gameState.players || [];
      const maxRounds = Math.max(...players.map(p => p.scores.length));
      
      return (
        <div className="table-responsive">
          <table className="table table-sm table-bordered">
            <thead className="bg-light">
              <tr>
                <th className="fw-semibold">Joueur</th>
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
      );
    } else {
      const teams = gameState.teams || [];
      const maxRounds = Math.max(...teams.map(t => t.scores.length));
      
      return (
        <div className="table-responsive">
          <table className="table table-sm table-bordered">
            <thead className="bg-light">
              <tr>
                <th className="fw-semibold">Equipe</th>
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
                      {team.scores[roundIndex] !== undefined ? team.scores[roundIndex] : '–'}
                    </td>
                  ))}
                  <td className="text-center fw-bold bg-primary text-white">
                    {team.scores.reduce((a, b) => a + b, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };

  useEffect(() => {
    fetchScores();
    if (user) {
      checkForActiveGame();
    } else {
      setLoadingActiveGame(false);
    }
  }, [user]);

  // Add real-time duration updates
  useEffect(() => {
    let interval;
    if (gameCreatedAt) {
      interval = setInterval(() => {
        setGameTime(new Date());
      }, 1000); // Update every second
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameCreatedAt]);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const data = await gameAPI.getScores(page, scoresPerPage);
      
      if (data.length < scoresPerPage) {
        setHasMore(false);
      }
      
      setScores(prev => page === 1 ? data : [...prev, ...data]);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching scores:', err);
      setError('Failed to load recent games. Please try again later.');
      setLoading(false);
    }
  };

  const checkForActiveGame = async () => {
    try {
      setLoadingActiveGame(true);
      const data = await gameAPI.getActiveGame();
      
      if (data.hasActiveGame) {
        setGameState(data.gameState);
        setGameType(data.gameType);
        setGameCreatedAt(data.createdAt);
        setShowForm(true);
        initializeRoundScores(data.gameState);
      }
    } catch (err) {
      console.error('Error checking for active game:', err);
    } finally {
      setLoadingActiveGame(false);
    }
  };

  const initializeRoundScores = (state) => {
    const newRoundScores = {};
    if (state.type === 'chkan') {
      state.players.forEach((_, index) => {
        newRoundScores[`player-${index}`] = '';
      });
    } else {
      newRoundScores['team-0'] = '';
      newRoundScores['team-1'] = '';
    }
    setRoundScores(newRoundScores);
  };

  const initializeGame = (type, numPlayers = 2) => {
    let initialState;
    
    if (type === 'chkan') {
      const players = [];
      for (let i = 0; i < numPlayers; i++) {
        players.push({
          name: `Player ${i + 1}`,
          scores: []
        });
      }
      initialState = {
        type,
        players,
        currentRound: 1
      };
    } else {
      initialState = {
        type,
        teams: [
          { name: 'Team 1', scores: [] },
          { name: 'Team 2', scores: [] }
        ],
        currentRound: 1
      };
    }
    
    setGameState(initialState);
    setGameType(type);
    setGameCreatedAt(new Date().toISOString());
    initializeRoundScores(initialState);
  };

  const handlePlayerNameChange = (index, newName) => {
    const updatedState = { ...gameState };
    updatedState.players[index].name = newName;
    setGameState(updatedState);
    saveGameState(updatedState);
  };

  const handleTeamNameChange = (index, newName) => {
    const updatedState = { ...gameState };
    updatedState.teams[index].name = newName;
    setGameState(updatedState);
    saveGameState(updatedState);
  };

  const handleRoundScoreChange = (key, value) => {
    setRoundScores({ ...roundScores, [key]: value });
    setRoundInputError(null);
  };

  const addRound = async () => {
    setRoundInputError(null);
    
    // Validate all scores are entered
    const scores = Object.values(roundScores);
    if (scores.some(score => score === '' || score === null)) {
      setRoundInputError('Please enter scores for all players/teams');
      return;
    }

    // Validate scores are numbers
    const numericScores = scores.map(score => parseInt(score));
    if (numericScores.some(score => isNaN(score) || score < 0)) {
      setRoundInputError('Scores must be positive numbers');
      return;
    }

    const updatedState = { ...gameState };

    if (gameType === 'chkan') {
      updatedState.players.forEach((player, index) => {
        const scoreKey = `player-${index}`;
        player.scores.push(parseInt(roundScores[scoreKey]));
      });
    } else {
      updatedState.teams.forEach((team, index) => {
        const scoreKey = `team-${index}`;
        team.scores.push(parseInt(roundScores[scoreKey]));
      });
    }

    updatedState.currentRound += 1;
    setGameState(updatedState);
    
    // Clear round scores
    const clearedScores = {};
    Object.keys(roundScores).forEach(key => {
      clearedScores[key] = '';
    });
    setRoundScores(clearedScores);

    // Save the game state
    await saveGameState(updatedState);
    
    // Auto-expand round details after first round
    if (getCompletedRounds() === 1) {
      setShowRoundDetails(true);
    }
  };

  const saveGameState = async (state) => {
    if (!user) return;
    
    try {
      await gameAPI.saveActiveGame(state, gameType);
    } catch (err) {
      console.error('Error saving game state:', err);
    }
  };

  const finishGame = async () => {
    try {
      setLoading(true);
      
      // Calculate final scores and determine winner(s)
      let gameData;
      
      if (gameType === 'chkan') {
        const playersWithTotals = gameState.players.map(player => ({
          ...player,
          totalScore: player.scores.reduce((sum, score) => sum + score, 0)
        }));
        
        // Sort by total score for winners determination
        const sortedPlayers = [...playersWithTotals].sort((a, b) => a.totalScore - b.totalScore);
        const winners = sortedPlayers.filter(p => p.totalScore < 701);
        const losers = sortedPlayers.filter(p => p.totalScore >= 701);
        
        gameData = {
          type: 'chkan',
          winners: winners.map(p => p.name).join(', ') || 'None',
          losers: losers.map(p => p.name).join(', ') || 'None',
          player_scores: playersWithTotals.map(p => `${p.name}: ${p.totalScore}`).join(', '),
          created_at: gameCreatedAt, // Include the game creation timestamp
          game_data: {
            ...gameState,
            players: playersWithTotals,
            winners: winners.map(p => p.name),
            losers: losers.map(p => p.name)
          }
        };
      } else {
        // S7ab game
        const teamsWithTotals = gameState.teams.map(team => ({
          ...team,
          totalScore: team.scores.reduce((sum, score) => sum + score, 0)
        }));
        
        const sortedTeams = [...teamsWithTotals].sort((a, b) => a.totalScore - b.totalScore);
        
        gameData = {
          type: 's7ab',
          team1: teamsWithTotals[0].name,
          team2: teamsWithTotals[1].name,
          score1: teamsWithTotals[0].totalScore,
          score2: teamsWithTotals[1].totalScore,
          created_at: gameCreatedAt, // Include the game creation timestamp
          game_data: {
            ...gameState,
            teams: teamsWithTotals,
            winner: sortedTeams[0].name
          }
        };
      }

      await gameAPI.saveGame(gameData);
      await gameAPI.deleteActiveGame();
      
      setStatus({ type: 'success', message: 'Game completed successfully!' });
      
      // Reset game state
      setGameState(null);
      setGameType('');
      setGameCreatedAt(null);
      setShowForm(false);
      setRoundScores({});
      setShowRoundDetails(false);
      
      // Refresh scores list
      setPage(1);
      setHasMore(true);
      fetchScores();
      
      setTimeout(() => setStatus(null), 5000);
    } catch (err) {
      console.error('Error finishing game:', err);
      setStatus({ type: 'error', message: 'Failed to save game. Please try again.' });
      setTimeout(() => setStatus(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const cancelGame = async () => {
    try {
      await gameAPI.deleteActiveGame();
      setGameState(null);
      setGameType('');
      setGameCreatedAt(null);
      setShowForm(false);
      setRoundScores({});
      setShowRoundDetails(false);
      setStatus({ type: 'info', message: 'Game cancelled.' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error('Error cancelling game:', err);
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

  // Game setup section
  const renderGameSetup = () => {
    if (!gameType) {
      return (
        <div className="text-center">
          <h3 className="mb-4 fw-bold text-dark">Choisissez le type de jeu</h3>
          <div className="row justify-content-center g-4">
            <div className="col-12 col-md-6 col-lg-5">
              <GameTypeCard
                title="Chkan"
                icon="🧍‍♂️"
                description="Jeu individuel"
                onClick={() => initializeGame('chkan', numberOfPlayers)}
              >
                <div className="mb-3">
                  <label className="form-label fw-semibold">Nombre de joueurs</label>
                  <select 
                    className="form-select form-select-sm w-auto mx-auto"
                    value={numberOfPlayers}
                    onChange={(e) => setNumberOfPlayers(parseInt(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value={2}>2 Joueurs</option>
                    <option value={3}>3 Joueurs</option>
                    <option value={4}>4 Joueurs</option>
                  </select>
                </div>
                
                <div className="small text-muted mb-3">
                  <i className="bi bi-info-circle me-1"></i>
                  Gagnants : joueurs avec moins de 701 points
                </div>
                <button className="btn btn-primary btn-lg">
                  <i className="bi bi-play-circle me-2"></i>
                  Commencer partie Chkan
                </button>
              </GameTypeCard>
            </div>
            <div className="col-12 col-md-6 col-lg-5">
              <GameTypeCard
                title="S7ab"
                icon="👬"
                description="Jeu en équipe (2 équipes)"
                onClick={() => initializeGame('s7ab')}
              >
                <div className="small text-muted mb-3">
                  <i className="bi bi-info-circle me-1"></i>
                  Gagnant : Équipe avec le score total le plus bas
                </div>
                <button className="btn btn-primary btn-lg">
                  <i className="bi bi-play-circle me-2"></i>
                  Commencer partie S7ab
                </button>
              </GameTypeCard>
            </div>
          </div>
        </div>
      );
    }

    const completedRounds = getCompletedRounds();
    const duration = calculateDuration();

    return (
      <div>
        {/* Game Progress Header */}
        <div className="card border-primary mb-4">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">
                  {gameType === 'chkan' ? '🧍‍♂️Jeu Chkan' : '👬 Jeu S7ab'}
                </h5>
                <div className="small">
                  <span className="me-3">
                    <i className="bi bi-arrow-repeat me-1"></i>
                    Tours {gameState.currentRound}
                    {completedRounds > 0 && (
                      <span className="ms-1">({completedRounds} complétés)</span>
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
                  onClick={cancelGame}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Cancel
                </button>
                <button 
                  className="btn btn-light btn-sm"
                  onClick={finishGame}
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
        </div>

        {/* Current Standings */}
        {gameState.currentRound > 1 && (
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Current Standings</h6>
              {completedRounds > 0 && (
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setShowRoundDetails(!showRoundDetails)}
                >
                  {showRoundDetails ? (
                    <>
                      <i className="bi bi-chevron-up me-1"></i>
                      Hide Round Details
                    </>
                  ) : (
                    <>
                      <i className="bi bi-chevron-down me-1"></i>
                      Show Round Details
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="card-body">
              {gameType === 'chkan' ? (
                <div className="row g-2">
                  {gameState.players.map((player, index) => {
                    const total = player.scores.reduce((sum, score) => sum + score, 0);
                    return (
                      <div key={index} className="col-6 col-md-3">
                        <div className="text-center p-2 bg-light rounded">
                          <div className="fw-semibold small">{player.name}</div>
                          <div className="h5 mb-0 text-primary">{total}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="row g-2">
                  {gameState.teams.map((team, index) => {
                    const total = team.scores.reduce((sum, score) => sum + score, 0);
                    return (
                      <div key={index} className="col-6">
                        <div className="text-center p-3 bg-light rounded">
                          <div className="fw-semibold">{team.name}</div>
                          <div className="h4 mb-0 text-primary">{total}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Round Details Table */}
            {showRoundDetails && (
              <div className="card-footer bg-light">
                <h6 className="text-muted mb-3">Round-by-Round Breakdown</h6>
                {renderRoundDetails()}
              </div>
            )}
          </div>
        )}

        {/* Round Entry Form */}
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">
              <i className="bi bi-plus-circle me-2"></i>
              Add Round {gameState.currentRound} Scores
            </h6>
          </div>
          <div className="card-body">
            {roundInputError && (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {roundInputError}
              </div>
            )}

            {gameType === 'chkan' ? (
              <div className="row g-3">
                {gameState.players.map((player, index) => (
                  <div key={index} className="col-12 col-md-6">
                    <FormInput
                      label={
                        gameState.currentRound === 1 ? (
                          <input
                            type="text"
                            value={player.name}
                            onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                            className="form-control form-control-sm fw-semibold"
                            placeholder={`Player ${index + 1}`}
                          />
                        ) : (
                          player.name
                        )
                      }
                      type="number"
                      name={`player-${index}`}
                      value={roundScores[`player-${index}`] || ''}
                      onChange={(e) => handleRoundScoreChange(`player-${index}`, e.target.value)}
                      placeholder="Enter score"
                      min="0"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="row g-3">
                {gameState.teams.map((team, index) => (
                  <div key={index} className="col-12 col-md-6">
                    <FormInput
                      label={
                        gameState.currentRound === 1 ? (
                          <input
                            type="text"
                            value={team.name}
                            onChange={(e) => handleTeamNameChange(index, e.target.value)}
                            className="form-control form-control-sm fw-semibold"
                            placeholder={`Team ${index + 1}`}
                          />
                        ) : (
                          team.name
                        )
                      }
                      type="number"
                      name={`team-${index}`}
                      value={roundScores[`team-${index}`] || ''}
                      onChange={(e) => handleRoundScoreChange(`team-${index}`, e.target.value)}
                      placeholder="Enter score"
                      min="0"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="text-center mt-4">
              <button 
                className="btn btn-primary btn-lg px-4"
                onClick={addRound}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add Round {gameState.currentRound}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid px-3 mt-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          {/* Main Header */}
          <PageHeader
            title="Section Rami"
            subtitle="Créez et suivez les scores de jeu Rami entre 5boz"
            icon="♠️"
            gradient={true}
          />

          {/* Score Entry Section */}
          <SectionCard
            title="Gestion des jeux"
            subtitle="Créez de nouveaux jeux"
            icon="bi-controller"
          >
            <StatusAlert status={status} className="mb-4" />

            {user ? (
              <div>
                {loadingActiveGame ? (
                  <LoadingSpinner text="Vérification de la partie sauvegardée..." className="py-5" />
                ) : !showForm ? (
                  <EmptyState
                    icon="bi-controller"
                    title="Prêt à commencer une nouvelle partie de Rami ?"
                    description="Choisissez entre Chkan (individuel) ou S7ab (équipe)"
                    action={
                      <button 
                        className="btn btn-primary btn-lg px-4"
                        onClick={() => setShowForm(true)}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Démarrer le jeu
                      </button>
                    }
                  />
                ) : (
                  renderGameSetup()
                )}
              </div>
            ) : (
              <EmptyState
                icon="bi-lock-fill"
                title="Login Required"
                description="You need to be logged in to start new Rami games and save your progress."
                action={
                  <Link to="/login" className="btn btn-primary btn-lg">
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Connectez-vous pour démarrer les jeux
                  </Link>
                }
              />
            )}
          </SectionCard>

          {/* History Section */}
          <SectionCard
            title="Jeux récents"
            subtitle="Derniers résultats et classements des matchs"
            icon="bi-clock-history"
            actions={
              <Link to="/rami/history" className="btn btn-outline-primary">
                <i className="bi bi-clock-history me-1"></i>
                Voir tout l'historique
              </Link>
            }
          >
            {error ? (
              <StatusAlert status={{ type: 'error', message: error }} />
            ) : scores.length === 0 && !loading ? (
              <EmptyState
                icon="bi-calendar-x"
                title="Aucune partie ajoutée pour le moment"
                description="Commencez à jouer pour voir vos jeux ici !"
              />
            ) : (
              <>
                <div className="row g-3">
                  {scores.map(game => (
                    <div key={game.id} className="col-12 col-md-6 col-lg-4">
                      <GameCard game={game} />
                    </div>
                  ))}
                </div>
                
                {loading && (
                  <LoadingSpinner text="Chargement des parties..." className="my-4" />
                )}
                
                {hasMore && !loading && scores.length > 0 && (
                  <div className="text-center mt-4">
                    <button 
                      className="btn btn-outline-primary btn-lg px-4"
                      onClick={loadMore}
                    >
                      <i className="bi bi-arrow-down-circle me-2"></i>
                      Charger plus de parties
                    </button>
                  </div>
                )}
              </>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}