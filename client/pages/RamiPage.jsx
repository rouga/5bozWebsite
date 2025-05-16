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
  
  // New states for player selection
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [teamPlayers, setTeamPlayers] = useState({
    team1: { player1: '', player2: '' },
    team2: { player1: '', player2: '' }
  });
  const [customPlayerInputs, setCustomPlayerInputs] = useState({
    team1: { player1: false, player2: false },
    team2: { player1: false, player2: false }
  });
  
  // States for Chkan player selection
  const [chkanPlayers, setChkanPlayers] = useState({});
  const [chkanCustomInputs, setChkanCustomInputs] = useState({});
  
  const scoresPerPage = 5;

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

  // Get total completed rounds
  const getCompletedRounds = () => {
    if (!gameState) return 0;
    
    if (gameType === 'chkan') {
      return gameState.players.length > 0 ? gameState.players[0].scores.length : 0;
    } else {
      return gameState.teams.length > 0 ? gameState.teams[0].scores.length : 0;
    }
  };

  // Fetch registered users for dropdown
  const fetchRegisteredUsers = async () => {
    try {
      const response = await fetch('http://192.168.0.12:5000/api/users', {
        credentials: 'include'
      });
      if (response.ok) {
        const users = await response.json();
        setRegisteredUsers(users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Player selection handlers
  const handlePlayerSelection = (team, playerSlot, value) => {
    setTeamPlayers(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [playerSlot]: value
      }
    }));
  };

  const toggleCustomInput = (team, playerSlot) => {
    setCustomPlayerInputs(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [playerSlot]: !prev[team][playerSlot]
      }
    }));
    
    // Clear the current selection when toggling to custom
    if (!customPlayerInputs[team][playerSlot]) {
      setTeamPlayers(prev => ({
        ...prev,
        [team]: {
          ...prev[team],
          [playerSlot]: ''
        }
      }));
    }
  };

  // Chkan player selection handlers
  const handleChkanPlayerSelection = (playerIndex, value) => {
    setChkanPlayers(prev => ({
      ...prev,
      [playerIndex]: value
    }));
  };

  const toggleChkanCustomInput = (playerIndex) => {
    setChkanCustomInputs(prev => ({
      ...prev,
      [playerIndex]: !prev[playerIndex]
    }));
    
    // Clear the current selection when toggling to custom
    if (!chkanCustomInputs[playerIndex]) {
      setChkanPlayers(prev => ({
        ...prev,
        [playerIndex]: ''
      }));
    }
  };

  // Initialize Chkan player states
  const initializeChkanPlayerStates = (numPlayers) => {
    const players = {};
    const customInputs = {};
    
    for (let i = 0; i < numPlayers; i++) {
      players[i] = '';
      customInputs[i] = false;
    }
    
    setChkanPlayers(players);
    setChkanCustomInputs(customInputs);
  };

  // Render player selection for S7ab
  const renderPlayerSelection = (team, teamNumber) => {
    return (
      <div className="card mb-3">
        <div className="card-header">
          <h6 className="mb-0">Équipe {teamNumber}</h6>
        </div>
        <div className="card-body">
          {['player1', 'player2'].map((playerSlot, index) => (
            <div key={playerSlot} className="mb-3">
              <label className="form-label fw-semibold">
                Joueur {index + 1}
              </label>
              <div className="d-flex gap-2 align-items-center">
                {customPlayerInputs[team][playerSlot] ? (
                  <FormInput
                    value={teamPlayers[team][playerSlot]}
                    onChange={(e) => handlePlayerSelection(team, playerSlot, e.target.value)}
                    placeholder="Entrer nom du joueur"
                    className="mb-0 flex-grow-1"
                  />
                ) : (
                  <select
                    className="form-select flex-grow-1"
                    value={teamPlayers[team][playerSlot]}
                    onChange={(e) => handlePlayerSelection(team, playerSlot, e.target.value)}
                  >
                    <option value="">Choisir un joueur</option>
                    {registeredUsers.map((user) => (
                      <option key={user.id} value={user.username}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => toggleCustomInput(team, playerSlot)}
                  title={customPlayerInputs[team][playerSlot] ? "Sélectionner depuis la liste" : "Saisir manuellement"}
                >
                  {customPlayerInputs[team][playerSlot] ? (
                    <i className="bi bi-list"></i>
                  ) : (
                    <i className="bi bi-pencil"></i>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render player selection for Chkan
  const renderChkanPlayerSelection = (numPlayers) => {
    return (
      <div className="card mb-3">
        <div className="card-header">
          <h6 className="mb-0">Sélection des joueurs</h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {Array.from({ length: numPlayers }, (_, index) => (
              <div key={index} className="col-12 col-md-6">
                <label className="form-label fw-semibold">
                  Joueur {index + 1}
                </label>
                <div className="d-flex gap-2 align-items-center">
                  {chkanCustomInputs[index] ? (
                    <FormInput
                      value={chkanPlayers[index] || ''}
                      onChange={(e) => handleChkanPlayerSelection(index, e.target.value)}
                      placeholder="Entrer nom du joueur"
                      className="mb-0 flex-grow-1"
                    />
                  ) : (
                    <select
                      className="form-select flex-grow-1"
                      value={chkanPlayers[index] || ''}
                      onChange={(e) => handleChkanPlayerSelection(index, e.target.value)}
                    >
                      <option value="">Choisir un joueur</option>
                      {registeredUsers.map((user) => (
                        <option key={user.id} value={user.username}>
                          {user.username}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => toggleChkanCustomInput(index)}
                    title={chkanCustomInputs[index] ? "Sélectionner depuis la liste" : "Saisir manuellement"}
                  >
                    {chkanCustomInputs[index] ? (
                      <i className="bi bi-list"></i>
                    ) : (
                      <i className="bi bi-pencil"></i>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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
                <th className="fw-semibold">Équipe</th>
                {Array.from({ length: maxRounds }, (_, i) => (
                  <th key={i} className="text-center fw-semibold">R{i + 1}</th>
                ))}
                <th className="text-center fw-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr key={index}>
                  <td className="fw-medium">
                    <div>{team.name}</div>
                    {team.players && (
                      <small className="text-muted">
                        {team.players.join(' & ')}
                      </small>
                    )}
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
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };

  useEffect(() => {
    fetchScores();
    fetchRegisteredUsers();
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
      }, 1000);
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
      // Validate that players are selected
      const selectedPlayers = Object.values(chkanPlayers).filter(p => p.trim() !== '');
      
      if (selectedPlayers.length !== numPlayers) {
        setRoundInputError(`Veuillez sélectionner tous les ${numPlayers} joueurs`);
        return;
      }
      
      const players = selectedPlayers.map((playerName, index) => ({
        name: playerName,
        scores: []
      }));
      
      initialState = {
        type,
        players,
        currentRound: 1
      };
    } else {
      // For S7ab, create teams with individual players
      const team1Players = [teamPlayers.team1.player1, teamPlayers.team1.player2].filter(p => p);
      const team2Players = [teamPlayers.team2.player1, teamPlayers.team2.player2].filter(p => p);
      
      if (team1Players.length === 0 || team2Players.length === 0) {
        setRoundInputError('Veuillez sélectionner au moins un joueur pour chaque équipe');
        return;
      }
      
      initialState = {
        type,
        teams: [
          { 
            name: `Équipe 1`, 
            players: team1Players,
            scores: [] 
          },
          { 
            name: `Équipe 2`, 
            players: team2Players,
            scores: [] 
          }
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
          created_at: gameCreatedAt,
          game_data: {
            ...gameState,
            players: playersWithTotals,
            winners: winners.map(p => p.name),
            losers: losers.map(p => p.name)
          }
        };
      } else {
        // S7ab game with individual player tracking
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
          created_at: gameCreatedAt,
          game_data: {
            ...gameState,
            teams: teamsWithTotals,
            winner: sortedTeams[0].name,
            // Store individual players for each team
            team1Players: teamsWithTotals[0].players,
            team2Players: teamsWithTotals[1].players
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
      
      // Reset S7ab states
      setTeamPlayers({
        team1: { player1: '', player2: '' },
        team2: { player1: '', player2: '' }
      });
      setCustomPlayerInputs({
        team1: { player1: false, player2: false },
        team2: { player1: false, player2: false }
      });
      
      // Reset Chkan states
      setChkanPlayers({});
      setChkanCustomInputs({});
      
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
      
      // Reset S7ab states
      setTeamPlayers({
        team1: { player1: '', player2: '' },
        team2: { player1: '', player2: '' }
      });
      setCustomPlayerInputs({
        team1: { player1: false, player2: false },
        team2: { player1: false, player2: false }
      });
      
      // Reset Chkan states
      setChkanPlayers({});
      setChkanCustomInputs({});
      
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
                onClick={() => {
                  setGameType('chkan');
                  initializeChkanPlayerStates(numberOfPlayers);
                }}
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
                  Configurer partie Chkan
                </button>
              </GameTypeCard>
            </div>
            <div className="col-12 col-md-6 col-lg-5">
              <GameTypeCard
                title="S7ab"
                icon="👬"
                description="Jeu en équipe (2 équipes)"
                onClick={() => setGameType('s7ab')}
              >
                <div className="small text-muted mb-3">
                  <i className="bi bi-info-circle me-1"></i>
                  Gagnant : Équipe avec le score total le plus bas
                </div>
                <button className="btn btn-primary btn-lg">
                  <i className="bi bi-play-circle me-2"></i>
                  Configurer partie S7ab
                </button>
              </GameTypeCard>
            </div>
          </div>
        </div>
      );
    }

    // Chkan setup form for selecting players
    if (gameType === 'chkan' && !gameState) {
      return (
        <div>
          <div className="text-center mb-4">
            <h3 className="fw-bold text-dark">Configuration Chkan</h3>
            <p className="text-muted">Sélectionnez les {numberOfPlayers} joueurs</p>
          </div>
          
          {roundInputError && (
            <div className="alert alert-danger mb-4">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {roundInputError}
            </div>
          )}
          
          {renderChkanPlayerSelection(numberOfPlayers)}
          
          <div className="text-center">
            <button 
              className="btn btn-outline-secondary me-3"
              onClick={() => setGameType('')}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Retour
            </button>
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => initializeGame('chkan', numberOfPlayers)}
            >
              <i className="bi bi-play-circle me-2"></i>
              Commencer la partie
            </button>
          </div>
        </div>
      );
    }

    // S7ab setup form for selecting players
    if (gameType === 's7ab' && !gameState) {
      return (
        <div>
          <div className="text-center mb-4">
            <h3 className="fw-bold text-dark">Configuration S7ab</h3>
            <p className="text-muted">Sélectionnez les joueurs pour chaque équipe</p>
          </div>
          
          {roundInputError && (
            <div className="alert alert-danger mb-4">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {roundInputError}
            </div>
          )}
          
          <div className="row">
            <div className="col-12 col-md-6">
              {renderPlayerSelection('team1', 1)}
            </div>
            <div className="col-12 col-md-6">
              {renderPlayerSelection('team2', 2)}
            </div>
          </div>
          
          <div className="text-center">
            <button 
              className="btn btn-outline-secondary me-3"
              onClick={() => setGameType('')}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Retour
            </button>
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => initializeGame('s7ab')}
            >
              <i className="bi bi-play-circle me-2"></i>
              Commencer la partie
            </button>
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
                          {team.players && (
                            <div className="small text-muted mb-1">
                              {team.players.join(' & ')}
                            </div>
                          )}
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
                        <div>
                          <div className="fw-semibold">{team.name}</div>
                          {team.players && (
                            <small className="text-muted">
                              {team.players.join(' & ')}
                            </small>
                          )}
                        </div>
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