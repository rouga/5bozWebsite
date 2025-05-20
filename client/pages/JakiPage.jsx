import { useState, useEffect, useReducer } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../src/hooks/useAuth';
import useSocket from '../src/hooks/useSocket';
import useStatus from '../src/hooks/useStatus';
import { 
  GameCard, 
  LoadingSpinner, 
  StatusAlert, 
  PageHeader, 
  SectionCard, 
  EmptyState
} from '../src/components';
import { 
  GameTypeSelector,
  PlayerSelector,
  InvitationWaiting,
  ActiveGame
} from '../src/components/JakiGameSetup';
import { gameAPI, handleApiError } from '../src/utils/api';

// Game state reducer
const gameStateReducer = (state, action) => {
  switch (action.type) {
    case 'RESET_GAME':
      return {
        gameState: null,
        winningScore: 7,
        gameCreatedAt: null,
        showForm: false,
        currentGameId: null,
        playerAcceptanceStatus: {},
        allInvitationsAccepted: false,
        roundScores: {},
        showRoundDetails: false,
        roundWinner: null,
        isMrassWin: false
      };
    case 'SET_WINNING_SCORE':
      return { ...state, winningScore: action.payload };
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload };
    case 'SET_GAME_CREATED_AT':
      return { ...state, gameCreatedAt: action.payload };
    case 'SET_SHOW_FORM':
      return { ...state, showForm: action.payload };
    case 'SET_CURRENT_GAME_ID':
      return { ...state, currentGameId: action.payload };
    case 'SET_PLAYER_ACCEPTANCE_STATUS':
      return { ...state, playerAcceptanceStatus: { ...state.playerAcceptanceStatus, ...action.payload } };
    case 'SET_ALL_INVITATIONS_ACCEPTED':
      return { ...state, allInvitationsAccepted: action.payload };
    case 'SET_ROUND_WINNER':
      return { ...state, roundWinner: action.payload };
    case 'SET_IS_MRASS_WIN':
      return { ...state, isMrassWin: action.payload };
    case 'SET_SHOW_ROUND_DETAILS':
      return { ...state, showRoundDetails: action.payload };
    case 'LOAD_ACTIVE_GAME':
      return {
        ...state,
        gameState: action.payload.gameState,
        winningScore: action.payload.gameState.winningScore || 7,
        gameCreatedAt: action.payload.createdAt,
        showForm: true,
      };
    default:
      return state;
  }
};

// Players state reducer
const playersReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PLAYER':
      return {
        ...state,
        players: {
          ...state.players,
          [action.payload.index]: action.payload.value
        }
      };
    case 'TOGGLE_CUSTOM_INPUT':
      const newCustomInputs = {
        ...state.customInputs,
        [action.payload]: !state.customInputs[action.payload]
      };
      // Clear player name if we're toggling from custom to dropdown
      const updatedPlayers = { ...state.players };
      if (!state.customInputs[action.payload]) {
        updatedPlayers[action.payload] = '';
      }
      return {
        ...state,
        players: updatedPlayers,
        customInputs: newCustomInputs
      };
    case 'RESET_PLAYERS':
      return {
        players: {
          player1: '',
          player2: ''
        },
        customInputs: {
          player1: false,
          player2: false
        }
      };
    default:
      return state;
  }
};

export default function JakiPage() {
  const [user] = useAuth();
  const socket = useSocket();
  const { status, showSuccess, showError } = useStatus();
  
  // Use reducers for complex state management
  const [gameData, dispatchGame] = useReducer(gameStateReducer, {
    gameState: null,
    winningScore: 7,
    gameCreatedAt: null,
    showForm: false,
    currentGameId: null,
    playerAcceptanceStatus: {},
    allInvitationsAccepted: false,
    roundScores: {},
    showRoundDetails: false,
    roundWinner: null,
    isMrassWin: false
  });

  const [playersData, dispatchPlayers] = useReducer(playersReducer, {
    players: {
      player1: '',
      player2: ''
    },
    customInputs: {
      player1: false,
      player2: false
    }
  });
  
  // Simple states
  const [gameTime, setGameTime] = useState(new Date());
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingActiveGame, setLoadingActiveGame] = useState(true);
  const [error, setError] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const gamesPerPage = 5;

  // Socket event handlers for invitations
  useEffect(() => {
    if (!socket) return;

    const handleInvitationResponse = (data) => {
      if (data.gameId === gameData.currentGameId) {
        dispatchGame({
          type: 'SET_PLAYER_ACCEPTANCE_STATUS', 
          payload: { [data.teamSlot]: data.response === 'accepted' }
        });
        
        showSuccess(`${data.playerName} has ${data.response} the game invitation`);
        
        checkAllInvitationsAccepted(data.gameId);
      }
    };

    socket.on('invitation_response', handleInvitationResponse);
    return () => socket.off('invitation_response', handleInvitationResponse);
  }, [socket, gameData.currentGameId]);

  // Game time tracker for active games
  useEffect(() => {
    let interval;
    if (gameData.gameCreatedAt) {
      interval = setInterval(() => setGameTime(new Date()), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameData.gameCreatedAt]);

  // Initial data loading
  useEffect(() => {
    fetchRecentGames();
    fetchRegisteredUsers();
    if (user) {
      checkForActiveGame();
    } else {
      setLoadingActiveGame(false);
    }
  }, [user]);

  // Load more games when page changes
  useEffect(() => {
    if (page > 1) fetchRecentGames();
  }, [page]);

  // API Functions
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

  const fetchRecentGames = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://192.168.0.12:5000/api/jaki/games?page=${page}&limit=${gamesPerPage}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch Jaki games');
      }
      
      const data = await response.json();
      
      if (data.length < gamesPerPage) {
        setHasMore(false);
      }
      
      setRecentGames(prev => page === 1 ? data : [...prev, ...data]);
    } catch (err) {
      console.error('Error fetching Jaki games:', err);
      setError('Failed to load recent games. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const checkForActiveGame = async () => {
    try {
      setLoadingActiveGame(true);
      const response = await fetch('http://192.168.0.12:5000/api/jaki/active-game', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to check for active Jaki game');
      }
      
      const data = await response.json();
      
      if (data.hasActiveGame) {
        dispatchGame({
          type: 'LOAD_ACTIVE_GAME',
          payload: data
        });
      }
    } catch (err) {
      console.error('Error checking for active Jaki game:', err);
    } finally {
      setLoadingActiveGame(false);
    }
  };

  const checkAllInvitationsAccepted = async (gameId) => {
    try {
      const response = await fetch(`http://192.168.0.12:5000/api/game-invitations/${gameId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const invitations = await response.json();
        const allAccepted = invitations.every(inv => inv.status === 'accepted');
        dispatchGame({ type: 'SET_ALL_INVITATIONS_ACCEPTED', payload: allAccepted });
      }
    } catch (error) {
      console.error('Error checking invitation status:', error);
    }
  };

  const saveGameState = async (state) => {
    if (!user) return;
    
    try {
      const response = await fetch('http://192.168.0.12:5000/api/jaki/active-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameState: state })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save Jaki game state');
      }
    } catch (err) {
      console.error('Error saving Jaki game state:', err);
    }
  };

  const sendGameInvitations = async (selectedPlayers) => {
    const gameId = `jaki-game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    dispatchGame({ type: 'SET_CURRENT_GAME_ID', payload: gameId });
    
    // Determine which players are registered
    const playersWithRegistrationStatus = selectedPlayers.map((player, index) => {
      const isRegistered = registeredUsers.some(u => u.username.toLowerCase() === player.username.toLowerCase());
      const teamSlot = `player${index + 1}`;
      
      return {
        ...player,
        isRegistered,
        teamSlot
      };
    });
    
    try {
      const response = await fetch('http://192.168.0.12:5000/api/game-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          gameType: 'jaki',
          players: playersWithRegistrationStatus,
          gameId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Initialize acceptance status for registered players
        const initialStatus = {};
        playersWithRegistrationStatus.forEach(player => {
          if (player.isRegistered && player.username !== user?.username) {
            initialStatus[player.teamSlot] = false;
          } else if (!player.isRegistered || player.username === user?.username) {
            // Non-registered players and self are automatically "accepted"
            initialStatus[player.teamSlot] = true;
          }
        });
        
        dispatchGame({ type: 'SET_PLAYER_ACCEPTANCE_STATUS', payload: initialStatus });
        
        if (data.invitationsSent > 0) {
          showSuccess(`Invitations sent to ${data.invitationsSent} player(s). Waiting for responses...`);
        } else {
          // No invitations needed, can start immediately
          dispatchGame({ type: 'SET_ALL_INVITATIONS_ACCEPTED', payload: true });
        }
        
        return gameId;
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      showError('Failed to send game invitations');
    }
    
    return null;
  };

  // Event handlers
  const handleWinningScoreChange = (score) => {
    dispatchGame({ type: 'SET_WINNING_SCORE', payload: parseInt(score) });
  };

  const handlePlayerSelection = (index, value) => {
    dispatchPlayers({
      type: 'SET_PLAYER', 
      payload: { index, value }
    });
  };

  const handleToggleCustomInput = (playerIndex) => {
    dispatchPlayers({
      type: 'TOGGLE_CUSTOM_INPUT',
      payload: playerIndex
    });
  };

  const handleSendInvitations = async () => {
    if (!playersData.players.player1 || !playersData.players.player2) {
      showError('Please select both players');
      return;
    }
    
    // Check for duplicate players
    if (playersData.players.player1.toLowerCase() === playersData.players.player2.toLowerCase()) {
      showError('Les joueurs doivent etre différents');
      return;
    }
    
    // Format players for invitation
    const selectedPlayers = [
      { username: playersData.players.player1 },
      { username: playersData.players.player2 }
    ];
    
    // Send invitations
    const gameId = await sendGameInvitations(selectedPlayers);
    if (!gameId) return;
    
    dispatchGame({ type: 'SET_SHOW_FORM', payload: true });
  };

  const handleStartGameAfterAcceptance = () => {
    const player1 = playersData.players.player1;
    const player2 = playersData.players.player2;
    
    const initialState = {
      type: 'jaki',
      winningScore: gameData.winningScore,
      players: [
        { name: player1, score: 0, rounds: [] },
        { name: player2, score: 0, rounds: [] }
      ],
      rounds: [],
      currentRound: 1
    };
    
    dispatchGame({ type: 'SET_GAME_STATE', payload: initialState });
    dispatchGame({ type: 'SET_GAME_CREATED_AT', payload: new Date().toISOString() });
    dispatchGame({ type: 'SET_ALL_INVITATIONS_ACCEPTED', payload: false });
    
    // Save initial game state
    saveGameState(initialState);
  };

  const handleAddRound = () => {
    if (!gameData.roundWinner) {
      showError('Please select the round winner');
      return;
    }
    
    const updatedState = { ...gameData.gameState };
    const winnerIndex = updatedState.players.findIndex(p => p.name === gameData.roundWinner);
    
    if (winnerIndex === -1) {
      showError('Invalid round winner selected');
      return;
    }
    
    // Add points based on win type
    const pointsToAdd = gameData.isMrassWin ? 2 : 1;
    updatedState.players[winnerIndex].score += pointsToAdd;
    
    // Record round details
    updatedState.rounds.push({
      winner: gameData.roundWinner,
      isMrass: gameData.isMrassWin,
      points: pointsToAdd,
      roundNumber: updatedState.currentRound
    });
    
    // Update player rounds data
    updatedState.players[winnerIndex].rounds.push({
      roundNumber: updatedState.currentRound,
      points: pointsToAdd,
      isMrass: gameData.isMrassWin
    });
    
    // Check for game winner
    const hasWinner = updatedState.players.some(p => p.score >= updatedState.winningScore);
    
    if (hasWinner) {
      // Mark game as completed with winner
      updatedState.completed = true;
      updatedState.winner = updatedState.players[winnerIndex].name;
    }
    
    // Increment round counter
    updatedState.currentRound += 1;
    
    // Update state
    dispatchGame({ type: 'SET_GAME_STATE', payload: updatedState });
    dispatchGame({ type: 'SET_ROUND_WINNER', payload: null });
    dispatchGame({ type: 'SET_IS_MRASS_WIN', payload: false });
    
    // Save game state
    saveGameState(updatedState);
    
    // If game is completed, finish it
    if (hasWinner) {
      handleFinishGame(updatedState);
    }
  };

  const handleFinishGame = async (gameState = null) => {
    try {
      setLoading(true);
      
      const stateToFinish = gameState || gameData.gameState;
      
      // Make sure we have a winner
      if (!stateToFinish.completed && !stateToFinish.winner) {
        // Determine winner manually if needed
        const winnerIndex = stateToFinish.players[0].score >= stateToFinish.players[1].score ? 0 : 1;
        stateToFinish.winner = stateToFinish.players[winnerIndex].name;
        stateToFinish.completed = true;
      }
      
      // Prepare data for saving
      const gameDataToSave = {
        player1: stateToFinish.players[0].name,
        player2: stateToFinish.players[1].name,
        score1: stateToFinish.players[0].score,
        score2: stateToFinish.players[1].score,
        winner: stateToFinish.winner,
        winning_score: stateToFinish.winningScore,
        total_rounds: stateToFinish.currentRound - 1,
        created_at: gameData.gameCreatedAt,
        game_data: stateToFinish
      };
      
      // Save completed game
      const response = await fetch('http://192.168.0.12:5000/api/jaki/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(gameDataToSave)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save Jaki game');
      }
      
      // Delete active game
      await fetch('http://192.168.0.12:5000/api/jaki/active-game', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      showSuccess('Game completed successfully!');
      
      // Reset game state
      dispatchGame({ type: 'RESET_GAME' });
      dispatchPlayers({ type: 'RESET_PLAYERS' });
      
      // Refresh games list
      setPage(1);
      setHasMore(true);
      fetchRecentGames();
      
    } catch (err) {
      console.error('Error finishing Jaki game:', err);
      showError('Failed to save game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelGame = async () => {
    try {
      await fetch('http://192.168.0.12:5000/api/jaki/active-game', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      dispatchGame({ type: 'RESET_GAME' });
      dispatchPlayers({ type: 'RESET_PLAYERS' });
      showSuccess('Game cancelled.');
    } catch (err) {
      console.error('Error cancelling game:', err);
      showError('Failed to cancel game. Please try again.');
    }
  };

  const handleToggleRoundDetails = () => {
    dispatchGame({ 
      type: 'SET_SHOW_ROUND_DETAILS', 
      payload: !gameData.showRoundDetails 
    });
  };

  const handleSetRoundWinner = (player) => {
    dispatchGame({ type: 'SET_ROUND_WINNER', payload: player });
  };

  const handleToggleMrassWin = () => {
    dispatchGame({ type: 'SET_IS_MRASS_WIN', payload: !gameData.isMrassWin });
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  // Render active game component
  const renderActiveGame = () => {
    if (!gameData.gameState) return null;
    
    const { players, winningScore, currentRound } = gameData.gameState;
    const completedRounds = currentRound - 1;
    const duration = calculateDuration(gameData.gameCreatedAt, gameTime);
    
    return (
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
            <div className="d-flex gap-2">
              <button 
                className="btn btn-sm btn-outline-light"
                onClick={handleCancelGame}
              >
                <i className="bi bi-x-circle me-1"></i>
                Canceller
              </button>
              <button 
                className="btn btn-sm btn-light"
                onClick={() => handleFinishGame()}
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
                    Finir la partie.
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
                          Gagnant
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
                <h6 className="mb-0">Historique des tours</h6>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={handleToggleRoundDetails}
                >
                  {gameData.showRoundDetails ? (
                    <>
                      <i className="bi bi-chevron-up me-1"></i>
                      Cacher Details
                    </>
                  ) : (
                    <>
                      <i className="bi bi-chevron-down me-1"></i>
                      Montrer  Details
                    </>
                  )}
                </button>
              </div>
              
              {gameData.showRoundDetails && (
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead className="bg-light">
                        <tr>
                          <th>Tour</th>
                          <th>Gagnant</th>
                          <th>Points</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gameData.gameState.rounds.map((round, index) => (
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
          {!gameData.gameState.completed && (
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="bi bi-plus-circle me-2"></i>
                  Ajouter Tour {currentRound}
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Gagnant du tour</label>
                  <div className="row g-2">
                    {players.map((player, index) => (
                      <div key={index} className="col-6">
                        <div
                          className={`card text-center ${gameData.roundWinner === player.name ? 'border-success' : 'border'} cursor-pointer`}
                          onClick={() => handleSetRoundWinner(player.name)}
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
                      checked={gameData.isMrassWin}
                      onChange={handleToggleMrassWin}
                      disabled={!gameData.roundWinner}
                    />
                    <label className="form-check-label" htmlFor="mrass-win">
                      <span className="me-1">Victoir par Mrass</span>
                      <span className="text-danger">(2 points)</span>
                    </label>
                  </div>
                </div>
                
                <div className="text-center">
                  <button
                    className="btn btn-primary btn-lg px-4"
                    onClick={handleAddRound}
                    disabled={!gameData.roundWinner}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Ajouter Tour
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render invitation waiting component
  const renderInvitationWaiting = () => {
    if (!gameData.currentGameId || !Object.keys(gameData.playerAcceptanceStatus).length) {
      return null;
    }
    
    const totalInvitations = Object.keys(gameData.playerAcceptanceStatus).length;
    const acceptedInvitations = Object.values(gameData.playerAcceptanceStatus).filter(status => status).length;
    const isWaiting = acceptedInvitations < totalInvitations;

    return (
      <div className="text-center">
        <h3 className="fw-bold text-dark mb-4">En attente de la réponse des joueurs</h3>
        
        <div className="card mb-4">
          <div className="card-body">
            <div className="mb-3">
              <div className="progress">
                <div 
                  className="progress-bar bg-success" 
                  role="progressbar" 
                  style={{ width: `${(acceptedInvitations / totalInvitations) * 100}%` }}
                >
                  {acceptedInvitations}/{totalInvitations}
                </div>
              </div>
            </div>
            
            <p className="text-muted">
              {isWaiting ? (
                <>
                  <i className="bi bi-clock-history me-2"></i>
                  En attente de {totalInvitations - acceptedInvitations} joueur(s) à répondre ...
                  <br />
                  <small>Les joueurs ont 5 minutes pour répondre</small>
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  Tous les joueurs ont accépté l'invitation!
                </>
              )}
            </p>

            {/* Show player status */}
            <div className="row g-2 mt-3">
              {Object.entries(gameData.playerAcceptanceStatus).map(([teamSlot, accepted]) => {
                const playerIndex = parseInt(teamSlot.replace('player', '')) - 1;
                const playerName = playersData.players[`player${playerIndex + 1}`];
                
                return (
                  <div key={teamSlot} className="col-6">
                    <div className={`p-2 rounded ${accepted ? 'bg-success bg-opacity-10' : 'bg-warning bg-opacity-10'}`}>
                      <div className="d-flex align-items-center">
                        {accepted ? (
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                        ) : (
                          <i className="bi bi-clock text-warning me-2"></i>
                        )}
                        <small className="fw-semibold">{playerName}</small>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {gameData.allInvitationsAccepted && (
          <button 
            className="btn btn-success btn-lg me-3"
            onClick={handleStartGameAfterAcceptance}
          >
            <i className="bi bi-play-circle me-2"></i>
            Commencer jeu
          </button>
        )}

        <button 
          className="btn btn-outline-secondary"
          onClick={handleCancelGame}
        >
          <i className="bi bi-x-circle me-2"></i>
          Canceller
        </button>
      </div>
    );
  };

  // Render player selection form
  const renderPlayerSelector = () => {
    return (
      <div>
        <div className="text-center mb-4">
          <h3 className="fw-bold text-dark">Préparation d'un jeu Jaki</h3>
          <p className="text-muted">Sélectionner joueurs et configuer le jeu</p>
        </div>
        
        {/* Winning Score Selector */}
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">Paramètres jeu</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label fw-semibold">Score objectif</label>
              <select 
                className="form-select"
                value={gameData.winningScore}
                onChange={(e) => handleWinningScoreChange(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map(score => (
                  <option key={score} value={score}>{score} points</option>
                ))}
              </select>
              <div className="form-text">
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Premier joueur qui atteint ce score gagne
                </small>
              </div>
            </div>
          </div>
        </div>
        
        {/* Player Selection */}
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">Sélectionner joueurs</h5>
          </div>
          <div className="card-body">
            {['player1', 'player2'].map((playerKey, index) => {
              const isCustomInput = playersData.customInputs[playerKey];
              
              return (
                <div key={playerKey} className="mb-3">
                  <label className="form-label fw-semibold">Joueur {index + 1}</label>
                  <div className="d-flex gap-2 align-items-center">
                    {isCustomInput ? (
                      <input
                        type="text"
                        className="form-control"
                        value={playersData.players[playerKey] || ''}
                        onChange={(e) => handlePlayerSelection(playerKey, e.target.value)}
                        placeholder="Enter player name"
                      />
                    ) : (
                      <select
                        className="form-select"
                        value={playersData.players[playerKey] || ''}
                        onChange={(e) => handlePlayerSelection(playerKey, e.target.value)}
                      >
                        <option value="">Sélectionner un joueur</option>
                        {registeredUsers.map(user => (
                          <option 
                            key={user.id} 
                            value={user.username}
                            disabled={
                              (playerKey === 'player1' && playersData.players.player2 === user.username) ||
                              (playerKey === 'player2' && playersData.players.player1 === user.username)
                            }
                          >
                            {user.username}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => handleToggleCustomInput(playerKey)}
                      title={isCustomInput ? "Select from registered users" : "Enter custom name"}
                    >
                      {isCustomInput ? (
                        <i className="bi bi-list"></i>
                      ) : (
                        <i className="bi bi-pencil"></i>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="text-center">
          <button 
            className="btn btn-primary btn-lg"
            onClick={handleSendInvitations}
            disabled={!playersData.players.player1 || !playersData.players.player2}
          >
            <i className="bi bi-paper-plane me-2"></i>
            Send Invitations
          </button>
        </div>
      </div>
    );
  };

  // Helper function to calculate duration
  const calculateDuration = (startTime, currentTime) => {
    if (!startTime) return '';
    
    const start = new Date(startTime);
    const now = currentTime || new Date();
    const diffMs = now - start;
    
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

  // Render Jaki game card
  const renderJakiGameCard = (game) => {
    const duration = game.created_at && game.played_at 
      ? calculateDuration(new Date(game.created_at), new Date(game.played_at))
      : null;
      
    const player1IsWinner = game.winner === game.player1;
    const player2IsWinner = game.winner === game.player2;
    
    return (
      <div className="card border-0 shadow-sm h-100">
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
          
          <div className="row g-2">
            <div className="col-5">
              <div className={`text-center p-2 rounded ${player1IsWinner ? 'bg-success bg-opacity-10 border-success' : 'bg-light'}`}>
                <div className="fw-semibold small">{game.player1}</div>
                <div className={`h5 mb-0 ${player1IsWinner ? 'text-success' : 'text-primary'}`}>
                  {game.score1}
                </div>
                {player1IsWinner && (
                  <small className="text-success">
                    <i className="bi bi-trophy-fill me-1"></i>
                    Winner
                  </small>
                )}
              </div>
            </div>
            <div className="col-2 d-flex align-items-center justify-content-center">
              <span className="text-muted fw-medium">VS</span>
            </div>
            <div className="col-5">
              <div className={`text-center p-2 rounded ${player2IsWinner ? 'bg-success bg-opacity-10 border-success' : 'bg-light'}`}>
                <div className="fw-semibold small">{game.player2}</div>
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
            title="Section Jaki"
            subtitle="Créer et suivre les parties Jaki entre 5boz"
            icon="🎲"
            gradient={true}
          />

          {/* Status Alert */}
          {status && (
            <StatusAlert status={status} className="mb-4" />
          )}

          {/* Game Section */}
          <SectionCard
            title="Gestion des parties"
            subtitle="Créer une nouvelle partie ou continuer une partie en cours"
            icon="bi-controller"
          >
            {user ? (
              <div>
                {loadingActiveGame ? (
                  <LoadingSpinner text="Checking for saved game..." className="py-5" />
                ) : !gameData.showForm ? (
                  <EmptyState
                    icon="bi-dice-1"
                    title="Ready to start a new Jaki game?"
                    description="Setup a new game and track scores"
                    action={
                      <button 
                        className="btn btn-primary btn-lg px-4"
                        onClick={() => dispatchGame({ type: 'SET_SHOW_FORM', payload: true })}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Commencer Jeu
                      </button>
                    }
                  />
                ) : gameData.gameState ? (
                  renderActiveGame()
                ) : gameData.currentGameId && Object.keys(gameData.playerAcceptanceStatus).length > 0 ? (
                  renderInvitationWaiting()
                ) : (
                  renderPlayerSelector()
                )}
              </div>
            ) : (
              <EmptyState
                icon="bi-lock-fill"
                title="Login Required"
                description="Il faut se connecter pour commencer un jeu Jaki et sauvegarder les scores."
                action={
                  <Link to="/login" className="btn btn-primary btn-lg">
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Se connecter pour commencer un jeu
                  </Link>
                }
              />
            )}
          </SectionCard>

          {/* Recent Games Section */}
          <SectionCard
            title="Recent Games"
            subtitle="Latest Jaki game results"
            icon="bi-clock-history"
            actions={
              <Link to="/jaki/history" className="btn btn-outline-primary">
                <i className="bi bi-clock-history me-1"></i>
                Voir Historique complet
              </Link>
            }
          >
            {error ? (
              <StatusAlert status={{ type: 'error', message: error }} />
            ) : recentGames.length === 0 && !loading ? (
              <EmptyState
                icon="bi-calendar-x"
                title="No games recorded yet"
                description="Start playing to see your games here!"
              />
            ) : (
              <>
                <div className="row g-3">
                  {recentGames.map(game => (
                    <div key={game.id} className="col-12 col-md-6 col-lg-4">
                      {renderJakiGameCard(game)}
                    </div>
                  ))}
                </div>
                
                {loading && (
                  <LoadingSpinner text="Loading games..." className="my-4" />
                )}
                
                {hasMore && !loading && recentGames.length > 0 && (
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