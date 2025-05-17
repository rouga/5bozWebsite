// client/src/games/rami/hooks/useRamiGame.js

import { useState, useEffect } from 'react';
import { gameAPI } from '../../../utils/api';
import useAuth from '../../../hooks/useAuth';
import usePlayers from './usePlayers';
import useGameInvitations from './useGameInvitations';

/**
 * Custom hook to manage Rami game logic
 */
export default function useRamiGame() {
  const [user] = useAuth();
  
  // Game state
  const [gameState, setGameState] = useState(null);
  const [gameCreatedAt, setGameCreatedAt] = useState(null);
  const [gameTime, setGameTime] = useState(new Date()); 
  const [gameType, setGameType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [roundScores, setRoundScores] = useState({});
  const [roundInputError, setRoundInputError] = useState(null);
  const [showRoundDetails, setShowRoundDetails] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingActiveGame, setLoadingActiveGame] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [numberOfPlayers, setNumberOfPlayers] = useState(3);

  // Player selection handling with the custom hook
  const {
    registeredUsers,
    teamPlayers,
    setTeamPlayers,
    customPlayerInputs,
    setCustomPlayerInputs,
    chkanPlayers,
    setChkanPlayers,
    chkanCustomInputs,
    setChkanCustomInputs,
    initializeChkanPlayerStates,
    validationErrors,
    setValidationErrors,
    hasValidationErrors,
    handlePlayerSelection,
    handleToggleCustomInput,
    handleChkanPlayerSelection,
    handleToggleChkanCustomInput,
    fetchRegisteredUsers,
    isDuplicateUsername,
    isRegisteredUsername,
  } = usePlayers();

  // Invitation handling with the custom hook
  const {
    playerAcceptanceStatus,
    setPlayerAcceptanceStatus,
    currentGameId,
    setCurrentGameId,
    allInvitationsAccepted,
    setAllInvitationsAccepted,
    sendGameInvitations,
    checkAllInvitationsAccepted,
  } = useGameInvitations(setStatus, user);

  // Time tracking for active games
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

  // Initial data loading
  useEffect(() => {
    fetchRegisteredUsers();
    if (user) {
      checkForActiveGame();
    } else {
      setLoadingActiveGame(false);
    }
  }, [user]);

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

  const resetGameState = () => {
    setGameState(null);
    setGameType('');
    setGameCreatedAt(null);
    setShowForm(false);
    setRoundScores({});
    setShowRoundDetails(false);
    setCurrentGameId(null);
    setPlayerAcceptanceStatus({});
    setAllInvitationsAccepted(false);
    
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

  const saveGameState = async (state) => {
    if (!user) return;
    
    try {
      await gameAPI.saveActiveGame(state, gameType);
    } catch (err) {
      console.error('Error saving game state:', err);
    }
  };

  // Event handlers
  const handleSelectGameType = (type) => {
    setGameType(type);
    if (type === 'chkan') {
      initializeChkanPlayerStates(numberOfPlayers);
    }
  };

  const handleSendInvitations = async () => {
    setRoundInputError(null);
    
    let selectedPlayers;
    
    if (gameType === 'chkan') {
      // Get all selected players
      selectedPlayers = Object.values(chkanPlayers)
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
      const team1Players = [teamPlayers.team1.player1, teamPlayers.team1.player2].filter(p => p);
      const team2Players = [teamPlayers.team2.player1, teamPlayers.team2.player2].filter(p => p);
      
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
    
    // Additional validation: Make sure manually entered names don't conflict with registered users
    const registeredUsernames = registeredUsers.map(u => u.username.toLowerCase());
    const customNames = selectedPlayers
      .filter(p => !registeredUsernames.includes(p.username.toLowerCase()))
      .map(p => p.username.toLowerCase());
    
    const hasConflict = customNames.some(name => registeredUsernames.includes(name));
    
    if (hasConflict) {
      setRoundInputError(`Un nom saisi manuellement est identique à un nom d'utilisateur déjà enregistré`);
      return;
    }
    
    // Send invitations to registered players
    const gameId = await sendGameInvitations(gameType, selectedPlayers);
    if (!gameId) return;
    
    setShowForm(true);
  };

  const handleStartGameAfterAcceptance = () => {
    let initialState;
    
    if (gameType === 'chkan') {
      const selectedPlayers = Object.values(chkanPlayers).filter(p => p.trim() !== '');
      const players = selectedPlayers.map((playerName, index) => ({
        name: playerName,
        scores: []
      }));
      
      initialState = {
        type: gameType,
        players,
        currentRound: 1
      };
    } else {
      const team1Players = [teamPlayers.team1.player1, teamPlayers.team1.player2].filter(p => p);
      const team2Players = [teamPlayers.team2.player1, teamPlayers.team2.player2].filter(p => p);
      
      initialState = {
        type: gameType,
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
    setGameCreatedAt(new Date().toISOString());
    initializeRoundScores(initialState);
    setAllInvitationsAccepted(false);
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

  const handleAddRound = async () => {
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
    if (updatedState.currentRound === 2) {
      setShowRoundDetails(true);
    }
  };

  const handleFinishGame = async () => {
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
      resetGameState();
      
      setTimeout(() => setStatus(null), 5000);
      
      return true; // Indicate successful completion
    } catch (err) {
      console.error('Error finishing game:', err);
      setStatus({ type: 'error', message: 'Failed to save game. Please try again.' });
      setTimeout(() => setStatus(null), 5000);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCancelGame = async () => {
    try {
      await gameAPI.deleteActiveGame();
      resetGameState();
      setStatus({ type: 'info', message: 'Game cancelled.' });
      setTimeout(() => setStatus(null), 3000);
      return true;
    } catch (err) {
      console.error('Error cancelling game:', err);
      return false;
    }
  };

  const handleToggleRoundDetails = () => {
    setShowRoundDetails(!showRoundDetails);
  };

  return {
    // Game state
    gameState,
    gameCreatedAt,
    gameTime,
    gameType,
    showForm,
    setShowForm,
    roundScores,
    roundInputError,
    showRoundDetails,
    
    // UI state
    loading,
    loadingActiveGame,
    error,
    status,
    setStatus,
    
    // Player selection state
    numberOfPlayers,
    setNumberOfPlayers,
    registeredUsers,
    teamPlayers,
    customPlayerInputs,
    chkanPlayers,
    chkanCustomInputs,
    validationErrors,
    
    // Invitation state
    playerAcceptanceStatus,
    currentGameId,
    allInvitationsAccepted,
    
    // Functions
    handleSelectGameType,
    handlePlayerSelection,
    handleToggleCustomInput,
    handleChkanPlayerSelection,
    handleToggleChkanCustomInput,
    handleSendInvitations,
    handleStartGameAfterAcceptance,
    handlePlayerNameChange,
    handleTeamNameChange,
    handleRoundScoreChange,
    handleAddRound,
    handleFinishGame,
    handleCancelGame,
    handleToggleRoundDetails,
    hasValidationErrors,
    isDuplicateUsername,
    isRegisteredUsername,
    resetGameState
  };
}