import { useState, useEffect, useCallback, useReducer } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../src/hooks/useAuth';
import useSocket from '../src/hooks/useSocket';
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
} from '../src/components/GameSetup';
import { gameAPI, handleApiError, API_BASE_URL } from '../src/utils/api';


// Game state reducer
const gameStateReducer = (state, action) => {
  switch (action.type) {
    case 'RESET_GAME':
      return {
        gameState: null,
        gameType: '',
        gameCreatedAt: null,
        showForm: false,
        roundScores: {},
        showRoundDetails: false,
        currentGameId: null,
        playerAcceptanceStatus: {},
        allInvitationsAccepted: false,
        initialDealer: null,
      };
    case 'SET_GAME_TYPE':
      return { ...state, gameType: action.payload };
    case 'SET_INITIAL_DEALER':
       return { ...state, initialDealer: action.payload };
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload };
    case 'SET_GAME_CREATED_AT':
      return { ...state, gameCreatedAt: action.payload };
    case 'SET_SHOW_FORM':
      return { ...state, showForm: action.payload };
    case 'SET_ROUND_SCORES':
      return { ...state, roundScores: action.payload };
    case 'SET_SHOW_ROUND_DETAILS':
      return { ...state, showRoundDetails: action.payload };
    case 'SET_CURRENT_GAME_ID':
      return { ...state, currentGameId: action.payload };
    case 'SET_PLAYER_ACCEPTANCE_STATUS':
      return { ...state, playerAcceptanceStatus: { ...state.playerAcceptanceStatus, ...action.payload } };
    case 'SET_ALL_INVITATIONS_ACCEPTED':
      return { ...state, allInvitationsAccepted: action.payload };
    case 'INIT_ROUND_SCORES':
      const newRoundScores = {};
      if (state.gameType === 'chkan') {
        action.payload.players.forEach((_, index) => {
          newRoundScores[`player-${index}`] = '';
        });
      } else {
        newRoundScores['team-0'] = '';
        newRoundScores['team-1'] = '';
      }
      return { ...state, roundScores: newRoundScores };
    case 'LOAD_ACTIVE_GAME':
      return {
        ...state,
        gameState: action.payload.gameState,
        gameType: action.payload.gameType,
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
    case 'INIT_CHKAN_PLAYERS':
      const players = {};
      const customInputs = {};
      for (let i = 0; i < action.payload; i++) {
        players[i] = '';
        customInputs[i] = false;
      }
      return {
        ...state,
        chkanPlayers: players,
        chkanCustomInputs: customInputs,
      };
    case 'SET_CHKAN_PLAYER':
      return {
        ...state,
        chkanPlayers: {
          ...state.chkanPlayers,
          [action.payload.index]: action.payload.value
        }
      };
    case 'TOGGLE_CHKAN_CUSTOM_INPUT':
      const newCustomInputs = {
        ...state.chkanCustomInputs,
        [action.payload]: !state.chkanCustomInputs[action.payload]
      };
      // Clear player name if we're toggling from custom to dropdown
      const updatedPlayers = { ...state.chkanPlayers };
      if (!state.chkanCustomInputs[action.payload]) {
        updatedPlayers[action.payload] = '';
      }
      return {
        ...state,
        chkanPlayers: updatedPlayers,
        chkanCustomInputs: newCustomInputs
      };
    case 'SET_TEAM_PLAYER':
      return {
        ...state,
        teamPlayers: {
          ...state.teamPlayers,
          [action.payload.team]: {
            ...state.teamPlayers[action.payload.team],
            [action.payload.playerSlot]: action.payload.value
          }
        }
      };
    case 'TOGGLE_TEAM_CUSTOM_INPUT':
      const newTeamCustomInputs = {
        ...state.customPlayerInputs,
        [action.payload.team]: {
          ...state.customPlayerInputs[action.payload.team],
          [action.payload.playerSlot]: !state.customPlayerInputs[action.payload.team][action.payload.playerSlot]
        }
      };
      // Clear player name if we're toggling from custom to dropdown
      const updatedTeamPlayers = { ...state.teamPlayers };
      if (!state.customPlayerInputs[action.payload.team][action.payload.playerSlot]) {
        updatedTeamPlayers[action.payload.team][action.payload.playerSlot] = '';
      }
      return {
        ...state,
        teamPlayers: updatedTeamPlayers,
        customPlayerInputs: newTeamCustomInputs
      };
    case 'RESET_PLAYERS':
      return {
        ...state,
        teamPlayers: {
          team1: { player1: '', player2: '' },
          team2: { player1: '', player2: '' }
        },
        customPlayerInputs: {
          team1: { player1: false, player2: false },
          team2: { player1: false, player2: false }
        },
        chkanPlayers: {},
        chkanCustomInputs: {}
      };
    default:
      return state;
  }
};

export default function RamiPage() {
  const [user] = useAuth();
  const socket = useSocket();
  
  // Use reducers for complex state management
  const [gameData, dispatchGame] = useReducer(gameStateReducer, {
    gameState: null,
    gameType: '',
    gameCreatedAt: null,
    showForm: false,
    roundScores: {},
    showRoundDetails: false,
    currentGameId: null,
    playerAcceptanceStatus: {},
    allInvitationsAccepted: false,
  });

  const [playersData, dispatchPlayers] = useReducer(playersReducer, {
    teamPlayers: {
      team1: { player1: '', player2: '' },
      team2: { player1: '', player2: '' }
    },
    customPlayerInputs: {
      team1: { player1: false, player2: false },
      team2: { player1: false, player2: false }
    },
    chkanPlayers: {},
    chkanCustomInputs: {},
  });
  
  // Simple states
  const [gameTime, setGameTime] = useState(new Date());
  const [numberOfPlayers, setNumberOfPlayers] = useState(3);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingActiveGame, setLoadingActiveGame] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [roundInputError, setRoundInputError] = useState(null);
  const [scores, setScores] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialDealer, setInitialDealer] = useState(null);
  const [roundWinner, setRoundWinner] = useState('');
  const scoresPerPage = 5;

  // Socket event handlers for invitations
  useEffect(() => {
    if (!socket) return;

    const handleInvitationResponse = (data) => {
      if (data.gameId === gameData.currentGameId) {
        dispatchGame({
          type: 'SET_PLAYER_ACCEPTANCE_STATUS', 
          payload: { [data.teamSlot]: data.response === 'accepted' }
        });
        
        setStatus({
          type: data.response === 'accepted' ? 'success' : 'info',
          message: `${data.playerName} has ${data.response} the game invitation`
        });
        
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
    fetchScores();
    fetchRegisteredUsers();
    if (user) {
      checkForActiveGame();
    } else {
      setLoadingActiveGame(false);
    }
  }, [user]);

  // Load more scores when page changes
  useEffect(() => {
    if (page > 1) fetchScores();
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

  const fetchScores = async () => {
    try {
      setLoading(true);
      const data = await gameAPI.getScores(page, scoresPerPage);
      
      if (data.length < scoresPerPage) {
        setHasMore(false);
      }
      
      setScores(prev => page === 1 ? data : [...prev, ...data]);
    } catch (err) {
      console.error('Error fetching scores:', err);
      setError('Failed to load recent games. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const checkForActiveGame = async () => {
    try {
      setLoadingActiveGame(true);
      const data = await gameAPI.getActiveGame();
      
      if (data.hasActiveGame) {
        dispatchGame({
          type: 'LOAD_ACTIVE_GAME',
          payload: data
        });
        // Initialize round scores
        initializeRoundScores(data.gameState);
      }
    } catch (err) {
      console.error('Error checking for active game:', err);
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
      await gameAPI.saveActiveGame(state, gameData.gameType);
    } catch (err) {
      console.error('Error saving game state:', err);
    }
  };

  const sendGameInvitations = async (gameType, selectedPlayers) => {
    const gameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    dispatchGame({ type: 'SET_CURRENT_GAME_ID', payload: gameId });
    
    // Determine which players are registered
    const playersWithRegistrationStatus = selectedPlayers.map((player, index) => {
      const isRegistered = registeredUsers.some(u => u.username.toLowerCase() === player.username.toLowerCase());
      let teamSlot;
      
      if (gameType === 'chkan') {
        teamSlot = `player-${index}`;
      } else {
        const teamIndex = Math.floor(index / 2);
        const playerIndex = index % 2;
        teamSlot = `team${teamIndex + 1}-player${playerIndex + 1}`;
      }
      
      return {
        ...player,
        isRegistered,
        teamSlot
      };
    });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/game-invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          gameType,
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
          setStatus({
            type: 'info',
            message: `Invitations sent to ${data.invitationsSent} player(s). Waiting for responses...`
          });
        } else {
          // No invitations needed, can start immediately
          dispatchGame({ type: 'SET_ALL_INVITATIONS_ACCEPTED', payload: true });
        }
        
        return gameId;
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      setStatus({
        type: 'error',
        message: 'Failed to send game invitations'
      });
    }
    
    return null;
  };

  // Helper functions
  const initializeRoundScores = useCallback((state) => {
    const newRoundScores = {};
    if (state.type === 'chkan') {
      state.players.forEach((_, index) => {
        newRoundScores[`player-${index}`] = '';
      });
    } else {
      // For S7ab, initialize scores for each player in each team
      state.teams.forEach((team, teamIndex) => {
        if (team.players) {
          team.players.forEach((_, playerIndex) => {
            newRoundScores[`team-${teamIndex}-player-${playerIndex}`] = '';
          });
        }
      });
    }
    dispatchGame({ type: 'SET_ROUND_SCORES', payload: newRoundScores });
  }, []);

  const isDuplicateUsername = (username) => {
    if (!username) return false;
    
    const normalizedUsername = username.toLowerCase().trim();
    
    if (gameData.gameType === 'chkan') {
      const usedNames = Object.values(playersData.chkanPlayers)
        .filter(name => name && name.trim() !== '')
        .map(name => name.toLowerCase().trim());
      
      return usedNames.filter(name => name === normalizedUsername).length > 1;
    } else {
      const allNames = [
        playersData.teamPlayers.team1.player1,
        playersData.teamPlayers.team1.player2,
        playersData.teamPlayers.team2.player1,
        playersData.teamPlayers.team2.player2
      ].filter(name => name && name.trim() !== '')
        .map(name => name.toLowerCase().trim());
      
      return allNames.filter(name => name === normalizedUsername).length > 1;
    }
  };

  const isRegisteredUsername = (username) => {
    if (!username) return false;
    
    const normalizedUsername = username.toLowerCase().trim();
    return registeredUsers.some(user => user.username.toLowerCase() === normalizedUsername);
  };

  // Event handlers
  const handleSelectGameType = (type) => {
    dispatchGame({ type: 'SET_GAME_TYPE', payload: type });
    if (type === 'chkan') {
      dispatchPlayers({ type: 'INIT_CHKAN_PLAYERS', payload: numberOfPlayers });
    }
  };

  const handleRoundWinnerChange = (winner) => {
    setRoundWinner(winner);
 };

  const handlePlayerSelection = (team, playerSlot, value) => {
    dispatchPlayers({
      type: 'SET_TEAM_PLAYER', 
      payload: { team, playerSlot, value }
    });
  };

  const handleToggleCustomInput = (team, playerSlot) => {
    dispatchPlayers({
      type: 'TOGGLE_TEAM_CUSTOM_INPUT',
      payload: { team, playerSlot }
    });
  };

  const handleChkanPlayerSelection = (playerIndex, value) => {
    dispatchPlayers({
      type: 'SET_CHKAN_PLAYER',
      payload: { index: playerIndex, value }
    });
  };

  const handleToggleChkanCustomInput = (playerIndex) => {
    dispatchPlayers({
      type: 'TOGGLE_CHKAN_CUSTOM_INPUT',
      payload: playerIndex
    });
  };

  const handleSendInvitations = async () => {
    setRoundInputError(null);
    
    let selectedPlayers;
    
    if (gameData.gameType === 'chkan') {
      // Get all selected players
      selectedPlayers = Object.values(playersData.chkanPlayers)
        .filter(p => p.trim() !== '')
        .map(username => ({ username }));
      
      if (selectedPlayers.length !== numberOfPlayers) {
        setRoundInputError(`Veuillez sélectionner tous les ${numberOfPlayers} joueurs`);
        return;
      }
      
      // Check for duplicates
      const uniqueNames = new Set(selectedPlayers.map(p => p.username.toLowerCase()));
      if (uniqueNames.size !== selectedPlayers.length) {
        setRoundInputError(`Chaque joueur doit avoir un nom unique`);
        return;
      }
    } else {
      const team1Players = [playersData.teamPlayers.team1.player1, playersData.teamPlayers.team1.player2].filter(p => p);
      const team2Players = [playersData.teamPlayers.team2.player1, playersData.teamPlayers.team2.player2].filter(p => p);
      
      if (team1Players.length === 0 || team2Players.length === 0) {
        setRoundInputError('Veuillez sélectionner au moins un joueur pour chaque équipe');
        return;
      }
      
      // Combine all players and check for duplicates
      const allPlayers = [...team1Players, ...team2Players];
      selectedPlayers = allPlayers.map(username => ({ username }));
      
      const uniqueNames = new Set(allPlayers.map(name => name.toLowerCase()));
      if (uniqueNames.size !== allPlayers.length) {
        setRoundInputError(`Chaque joueur doit avoir un nom unique`);
        return;
      }
    }
    
    // Check manual names vs registered users
    const registeredUsernames = registeredUsers.map(u => u.username.toLowerCase());
    const customNames = selectedPlayers
      .filter(p => !registeredUsernames.includes(p.username.toLowerCase()))
      .map(p => p.username.toLowerCase());
    
    const hasConflict = customNames.some(name => registeredUsernames.includes(name));
    
    if (hasConflict) {
      setRoundInputError(`Un nom saisi manuellement est identique à un nom d'utilisateur déjà enregistré`);
      return;
    }
    
    // Send invitations
    const gameId = await sendGameInvitations(gameData.gameType, selectedPlayers);
    if (!gameId) return;
    
    dispatchGame({ type: 'SET_SHOW_FORM', payload: true });
  };

    const handleEnableMgagi = (playerIndex) => {
    if (playerIndex === null) {
      // User declined Mgagi option
      return;
    }
    
    const updatedState = { ...gameData.gameState };
    
    // Get all player scores
    const playerScores = updatedState.players.map(player => ({
      name: player.name,
      index: updatedState.players.findIndex(p => p.name === player.name),
      totalScore: player.scores.reduce((a, b) => a + b, 0)
    }));
    
    // Sort scores from highest to lowest
    playerScores.sort((a, b) => b.totalScore - a.totalScore);
    
    // Get the second highest score
    const secondHighestScore = playerScores.length > 1 ? playerScores[1].totalScore : 0;
    
    // Player to become Mgagi
    const mgagiPlayer = updatedState.players[playerIndex];
    const currentScore = mgagiPlayer.scores.reduce((a, b) => a + b, 0);
    
    // Calculate how much to adjust their score
    const adjustment = secondHighestScore - currentScore;
    
    // Add adjustment as the latest score
    mgagiPlayer.scores.push(adjustment);
    
    // Mark player as Mgagi
    mgagiPlayer.isMgagi = true;
    
    // Update round counter
    updatedState.currentRound += 1;
    
    // Update game state
    dispatchGame({ type: 'SET_GAME_STATE', payload: updatedState });
    
    // Save game state
    saveGameState(updatedState);
    
    // Show success message
    setStatus({
      type: 'success',
      message: `${mgagiPlayer.name} est maintenant Mgagi avec un score de ${secondHighestScore}`
    });
  };

  const handleStartGameAfterAcceptance = () => {
    let initialState;
    
    if (gameData.gameType === 'chkan') {
      const selectedPlayers = Object.values(playersData.chkanPlayers).filter(p => p.trim() !== '');
      const players = selectedPlayers.map((playerName, index) => ({
        name: playerName,
        scores: []
      }));
      
      initialState = {
        type: gameData.gameType,
        players,
        currentRound: 1,
        initialDealer: initialDealer // Add this line
      };
    } else {
      const team1Players = [playersData.teamPlayers.team1.player1, playersData.teamPlayers.team1.player2].filter(p => p);
      const team2Players = [playersData.teamPlayers.team2.player1, playersData.teamPlayers.team2.player2].filter(p => p);
      
      initialState = {
        type: gameData.gameType,
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
        currentRound: 1,
        initialDealer: initialDealer // Add this line
      };
    }
   
    dispatchGame({ type: 'SET_GAME_STATE', payload: initialState });
    dispatchGame({ type: 'SET_GAME_CREATED_AT', payload: new Date().toISOString() });
    initializeRoundScores(initialState);
    dispatchGame({ type: 'SET_ALL_INVITATIONS_ACCEPTED', payload: false });
   saveGameState(initialState);
  };

  const handlePlayerNameChange = (index, newName) => {
    const updatedState = { ...gameData.gameState };
    updatedState.players[index].name = newName;
    dispatchGame({ type: 'SET_GAME_STATE', payload: updatedState });
    saveGameState(updatedState);
  };

  const handleTeamNameChange = (index, newName) => {
    const updatedState = { ...gameData.gameState };
    updatedState.teams[index].name = newName;
    dispatchGame({ type: 'SET_GAME_STATE', payload: updatedState });
    saveGameState(updatedState);
  };

  const handleRoundScoreChange = (key, value) => {
    dispatchGame({ 
      type: 'SET_ROUND_SCORES', 
      payload: { ...gameData.roundScores, [key]: value } 
    });
    setRoundInputError(null);
  };

  const handleAddRound = async () => {
    setRoundInputError(null);
    
    // Validate all scores are entered
    const scores = Object.values(gameData.roundScores);
    if (scores.some(score => score === '' || score === null)) {
      setRoundInputError('Please enter scores for all players/teams');
      return;
    }

    // Validate scores are numbers
    const numericScores = scores.map(score => parseInt(score));
    if (numericScores.some(score => isNaN(score))) {
      setRoundInputError('Scores must be valid numbers');
      return;
    }

    // For S7ab mode only, validate that scores are not negative
    if (gameData.gameType === 's7ab' && numericScores.some(score => score < 0)) {
      setRoundInputError('Team scores must be positive numbers');
      return;
    }

    const updatedState = { ...gameData.gameState };
    
    // Initialize roundWinners array if it doesn't exist
    if (!updatedState.roundWinners) {
      updatedState.roundWinners = [];
    }
    
    // Add the round winner to the array
    updatedState.roundWinners.push(roundWinner || null);

    if (gameData.gameType === 'chkan') {
      updatedState.players.forEach((player, index) => {
        const scoreKey = `player-${index}`;
        player.scores.push(parseInt(gameData.roundScores[scoreKey]));
      });
    } else {
      // For S7ab, we need to handle both team scores and individual player scores
      updatedState.teams.forEach((team, teamIndex) => {
        // Initialize playerScores array if it doesn't exist
        if (!team.playerScores) {
          team.playerScores = [];
        }
        
        // For this round, collect all player scores
        const roundPlayerScores = [];
        
        if (team.players) {
          team.players.forEach((_, playerIndex) => {
            const scoreKey = `team-${teamIndex}-player-${playerIndex}`;
            const playerScore = parseInt(gameData.roundScores[scoreKey]);
            roundPlayerScores.push(playerScore);
          });
        }
        
        // Add player scores for this round
        team.playerScores.push(roundPlayerScores);
        
        // Calculate total team score for this round (sum of player scores)
        const roundTeamScore = roundPlayerScores.reduce((sum, score) => sum + score, 0);
        
        // Add to the team scores array
        team.scores.push(roundTeamScore);
      });
    }

    updatedState.currentRound += 1;
    dispatchGame({ type: 'SET_GAME_STATE', payload: updatedState });
    
    // Clear round scores
    const clearedScores = {};
    Object.keys(gameData.roundScores).forEach(key => {
      clearedScores[key] = '';
    });
    dispatchGame({ type: 'SET_ROUND_SCORES', payload: clearedScores });
    
    // Clear round winner
    setRoundWinner('');

    // Save the game state
    await saveGameState(updatedState);
    
    // Auto-expand round details after first round
    if (updatedState.currentRound === 2) {
      dispatchGame({ type: 'SET_SHOW_ROUND_DETAILS', payload: true });
    }
  };

  const handleFinishGame = async () => {
    try {
      setLoading(true);
      
      // Calculate final scores and determine winner(s)
      let gameDataToSave;
      
      // Get list of registered users for authentication tracking
      const registeredUsernames = registeredUsers.map(u => u.username.toLowerCase());
      
      if (gameData.gameType === 'chkan') {
        const playersWithTotals = gameData.gameState.players.map(player => ({
          ...player,
          totalScore: player.scores.reduce((sum, score) => sum + score, 0),
          isAuthenticated: registeredUsernames.includes(player.name.toLowerCase())
        }));
        
        // Sort by total score for winners determination
        const sortedPlayers = [...playersWithTotals].sort((a, b) => a.totalScore - b.totalScore);
        const winners = sortedPlayers.filter(p => p.totalScore < 701);
        const losers = sortedPlayers.filter(p => p.totalScore >= 701);
        
        // Create a list of authenticated players
        const authenticatedPlayers = playersWithTotals
          .filter(p => p.isAuthenticated)
          .map(p => p.name);
        
        gameDataToSave = {
          type: 'chkan',
          winners: winners.map(p => p.name).join(', ') || 'None',
          losers: losers.map(p => p.name).join(', ') || 'None',
          player_scores: playersWithTotals.map(p => `${p.name}: ${p.totalScore}`).join(', '),
          created_at: gameData.gameCreatedAt,
          game_data: {
            ...gameData.gameState,
            players: playersWithTotals,
            winners: winners.map(p => p.name),
            losers: losers.map(p => p.name),
            authenticatedPlayers
          }
        };
      } else {
        // S7ab game with individual player tracking
        const teamsWithTotals = gameData.gameState.teams.map(team => {
          // Process player data if available
          let playerData = [];
          let authenticatedPlayers = [];
          
          if (team.players && team.playerScores) {
            playerData = team.players.map((playerName, playerIndex) => {
              // Calculate total score for this player
              let totalPlayerScore = 0;
              team.playerScores.forEach(roundScores => {
                if (roundScores[playerIndex] !== undefined) {
                  totalPlayerScore += roundScores[playerIndex];
                }
              });
              
              const isAuthenticated = registeredUsernames.includes(playerName.toLowerCase());
              if (isAuthenticated) {
                authenticatedPlayers.push(playerName);
              }
              
              return {
                name: playerName,
                totalScore: totalPlayerScore,
                isAuthenticated
              };
            });
          }
          
          return {
            ...team,
            totalScore: team.scores.reduce((sum, score) => sum + score, 0),
            playerData,
            authenticatedPlayers
          };
        });
        
        const sortedTeams = [...teamsWithTotals].sort((a, b) => a.totalScore - b.totalScore);
        
        // Create a list of all authenticated players
        const allAuthenticatedPlayers = teamsWithTotals.flatMap(t => t.authenticatedPlayers || []);
        
        gameDataToSave = {
          type: 's7ab',
          team1: teamsWithTotals[0].name,
          team2: teamsWithTotals[1].name,
          score1: teamsWithTotals[0].totalScore,
          score2: teamsWithTotals[1].totalScore,
          created_at: gameData.gameCreatedAt,
          game_data: {
            ...gameData.gameState,
            teams: teamsWithTotals,
            winner: sortedTeams[0].name,
            team1Players: teamsWithTotals[0].players || [],
            team2Players: teamsWithTotals[1].players || [],
            authenticatedPlayers: allAuthenticatedPlayers
          }
        };
      }

      // Save the game with authentication info
      await gameAPI.saveGame(gameDataToSave);
      await gameAPI.deleteActiveGame();
      
      setStatus({ type: 'success', message: 'Game completed successfully!' });
      
      // Reset game state
      dispatchGame({ type: 'RESET_GAME' });
      dispatchPlayers({ type: 'RESET_PLAYERS' });
      
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

  const handleCancelGame = async () => {
    try {
      await gameAPI.deleteActiveGame();
      dispatchGame({ type: 'RESET_GAME' });
      dispatchPlayers({ type: 'RESET_PLAYERS' });
      setStatus({ type: 'info', message: 'Game cancelled.' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error('Error cancelling game:', err);
    }
  };

  const handleToggleRoundDetails = () => {
    dispatchGame({ 
      type: 'SET_SHOW_ROUND_DETAILS', 
      payload: !gameData.showRoundDetails 
    });
  };

  const handleGoBack = () => {
    dispatchGame({ type: 'SET_GAME_TYPE', payload: '' });
    setRoundInputError(null);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  // Render game setup component based on current state
  const renderGameSetup = () => {
    // If we have a game state, show the active game component
    if (gameData.gameState) {
      return (
      <ActiveGame
        gameType={gameData.gameType}
        gameState={gameData.gameState}
        roundScores={gameData.roundScores}
        roundInputError={roundInputError}
        showRoundDetails={gameData.showRoundDetails}
        loading={loading}
        gameCreatedAt={gameData.gameCreatedAt}
        gameTime={gameTime}
        onRoundScoreChange={handleRoundScoreChange}
        onPlayerNameChange={handlePlayerNameChange}
        onTeamNameChange={handleTeamNameChange}
        onAddRound={handleAddRound}
        onToggleRoundDetails={handleToggleRoundDetails}
        onFinishGame={handleFinishGame}
        onCancelGame={handleCancelGame}
        onRoundWinnerChange={handleRoundWinnerChange}
        roundWinner={roundWinner}
        onEnableMgagi={handleEnableMgagi}
        mgagiEnabled={gameData.gameState?.players?.some(p => p.isMgagi)}
      />
      );
    }

    // If waiting for invitations
    if (gameData.currentGameId && Object.keys(gameData.playerAcceptanceStatus).length > 0) {
      return (
        <InvitationWaiting
          gameType={gameData.gameType}
          playerAcceptanceStatus={gameData.playerAcceptanceStatus}
          chkanPlayers={playersData.chkanPlayers}
          teamPlayers={playersData.teamPlayers}
          allInvitationsAccepted={gameData.allInvitationsAccepted}
          onStartGame={handleStartGameAfterAcceptance}
          onCancel={handleCancelGame}
        />
      );
    }

    // If game type is selected but no game state yet
    if (gameData.gameType) {
      return (
        <PlayerSelector
          gameType={gameData.gameType}
          numberOfPlayers={numberOfPlayers}
          registeredUsers={registeredUsers}
          teamPlayers={playersData.teamPlayers}
          setTeamPlayers={handlePlayerSelection}
          customPlayerInputs={playersData.customPlayerInputs}
          setCustomPlayerInputs={handleToggleCustomInput}
          chkanPlayers={playersData.chkanPlayers}
          setChkanPlayers={handleChkanPlayerSelection}
          chkanCustomInputs={playersData.chkanCustomInputs}
          setChkanCustomInputs={handleToggleChkanCustomInput}
          playerAcceptanceStatus={gameData.playerAcceptanceStatus}
          onPlayerSelection={handlePlayerSelection}
          onToggleCustomInput={handleToggleCustomInput}
          onChkanPlayerSelection={handleChkanPlayerSelection}
          onToggleChkanCustomInput={handleToggleChkanCustomInput}
          error={roundInputError}
          onGoBack={handleGoBack}
          onSendInvitations={handleSendInvitations}
          initialDealer={initialDealer}                 // Add these two lines
          setInitialDealer={setInitialDealer}
        />
      );
    }

    // Default: show game type selector
    return (
      <GameTypeSelector
        numberOfPlayers={numberOfPlayers}
        setNumberOfPlayers={setNumberOfPlayers}
        onSelectType={handleSelectGameType}
      />
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
                ) : !gameData.showForm ? (
                  <EmptyState
                    icon="bi-controller"
                    title="Prêt à commencer une nouvelle partie de Rami ?"
                    description="Choisissez entre Chkan (individuel) ou S7ab (équipe)"
                    action={
                      <button 
                        className="btn btn-primary btn-lg px-4"
                        onClick={() => dispatchGame({ type: 'SET_SHOW_FORM', payload: true })}
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