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
import { gameAPI, handleApiError, API_BASE_URL } from '../src/utils/api';


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
      console.log("Received invitation response:", data);
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
      const response = await fetch(`${API_BASE_URL}/api/users`, {
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
      const response = await fetch(`${API_BASE_URL}/api/jaki/games?page=${page}&limit=${gamesPerPage}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/jaki/active-game`, {
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
      const response = await fetch(`${API_BASE_URL}/api/game-invitations/${gameId}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/jaki/active-game`, {
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
    
    // Format players for invitation properly
    const formattedPlayers = selectedPlayers.map((player, index) => {
      const isRegistered = registeredUsers.some(u => u.username.toLowerCase() === player.username.toLowerCase());
      return {
        username: player.username,
        isRegistered,
        teamSlot: `player${index + 1}`
      };
    });
    
    try {
      console.log("Sending invitations with data:", {
        gameType: 'jaki',
        players: formattedPlayers,
        gameId
      });
      
      const response = await fetch(`${API_BASE_URL}/api/game-invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          gameType: 'jaki',
          players: formattedPlayers,
          gameId
        })
      });
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        data = { error: "Failed to parse server response" };
      }
      
      if (!response.ok) {
        console.error("Server returned an error:", response.status, data);
        throw new Error(`Failed to send invitations: ${data.error || response.statusText}`);
      }
      
      console.log("Invitation response:", data);
      
      // Handle case where response is ok but data indicates failure
      if (data.error) {
        throw new Error(`Server error: ${data.error}`);
      }
      
      // Initialize acceptance status for registered players
      const initialStatus = {};
      formattedPlayers.forEach(player => {
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
    } catch (error) {
      console.error('Error sending invitations:', error);
      showError(`Failed to send game invitations: ${error.message || "Unknown error"}`);
      // Reset the game state to remove the current game ID
      dispatchGame({ type: 'RESET_GAME' });
      return null;
    }
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
    
    // Check if user is logged in
    if (!user || !user.id) {
      showError('You must be logged in to send invitations');
      return;
    }
    
    // Format players for invitation
    const selectedPlayers = [
      { username: playersData.players.player1 },
      { username: playersData.players.player2 }
    ];
    
    // Send invitations
    setLoading(true);
    try {
      const gameId = await sendGameInvitations(selectedPlayers);
      if (gameId) {
        dispatchGame({ type: 'SET_SHOW_FORM', payload: true });
      }
    } finally {
      setLoading(false);
    }
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
    if (!updatedState.players[winnerIndex].rounds) {
      updatedState.players[winnerIndex].rounds = [];
    }
    
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
        
        // Get list of registered users for authentication tracking
        const registeredUsernames = registeredUsers.map(u => u.username.toLowerCase());
        
        // Check which players are authenticated users
        const authenticatedPlayers = [
        stateToFinish.players[0].name,
        stateToFinish.players[1].name
        ].filter(name => registeredUsernames.includes(name.toLowerCase()));
        
        // Add authentication info to game data
        stateToFinish.authenticatedPlayers = authenticatedPlayers;
        
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
        const response = await fetch(`${API_BASE_URL}/api/jaki/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(gameDataToSave)
        });
        
        if (!response.ok) {
        throw new Error('Failed to save Jaki game');
        }
        
        // Delete active game
        await fetch(`${API_BASE_URL}/api/jaki/active-game`, {
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
      await fetch(`${API_BASE_URL}/api/jaki/active-game`, {
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

  // Calculate game duration
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

  // Render active game component
  const renderActiveGame = () => {
    return (
      <ActiveGame
        gameState={gameData.gameState}
        roundWinner={gameData.roundWinner}
        isMrassWin={gameData.isMrassWin}
        showRoundDetails={gameData.showRoundDetails}
        gameCreatedAt={gameData.gameCreatedAt}
        gameTime={gameTime}
        onRoundWinnerChange={handleSetRoundWinner}
        onToggleMrassWin={handleToggleMrassWin}
        onAddRound={handleAddRound}
        onToggleRoundDetails={handleToggleRoundDetails}
        onFinishGame={handleFinishGame}
        onCancelGame={handleCancelGame}
        loading={loading}
      />
    );
  };

  // Render invitation waiting component
  const renderInvitationWaiting = () => {
    if (!gameData.currentGameId || !Object.keys(gameData.playerAcceptanceStatus).length) {
      return null;
    }
    
    return (
      <InvitationWaiting
        playerAcceptanceStatus={gameData.playerAcceptanceStatus}
        players={playersData.players}
        allInvitationsAccepted={gameData.allInvitationsAccepted}
        onStartGame={handleStartGameAfterAcceptance}
        onCancel={handleCancelGame}
      />
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

  // Render Jaki game card
    const renderJakiGameCard = (game) => {
    const duration = game.created_at && game.played_at 
        ? calculateDuration(new Date(game.created_at), new Date(game.played_at))
        : null;
        
    const player1IsWinner = game.winner === game.player1;
    const player2IsWinner = game.winner === game.player2;
    
    // Extract authentication info from game_data
    const gameData = typeof game.game_data === 'string' ? JSON.parse(game.game_data) : game.game_data;
    const authenticatedPlayers = gameData?.authenticatedPlayers || [];
    const isPlayer1Authenticated = authenticatedPlayers.includes(game.player1);
    const isPlayer2Authenticated = authenticatedPlayers.includes(game.player2);
    
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