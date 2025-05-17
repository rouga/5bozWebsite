// client/src/games/rami/hooks/usePlayers.js

import { useState, useEffect } from 'react';

/**
 * Custom hook to manage player selection for Rami games
 */
export default function usePlayers() {
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [teamPlayers, setTeamPlayers] = useState({
    team1: { player1: '', player2: '' },
    team2: { player1: '', player2: '' }
  });
  const [customPlayerInputs, setCustomPlayerInputs] = useState({
    team1: { player1: false, player2: false },
    team2: { player1: false, player2: false }
  });
  const [chkanPlayers, setChkanPlayers] = useState({});
  const [chkanCustomInputs, setChkanCustomInputs] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

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

  // Initialize Chkan players state
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

  // Helper functions for username validation
  const isDuplicateUsername = (username, currentTeam, currentSlot) => {
    if (!username) return false;
    
    // For case-insensitive comparison
    const normalizedUsername = username.toLowerCase().trim();
    
    // Check in teamPlayers
    for (const team in teamPlayers) {
      for (const slot in teamPlayers[team]) {
        if (teamPlayers[team][slot] && 
            (currentTeam !== team || currentSlot !== slot) && 
            teamPlayers[team][slot].toLowerCase().trim() === normalizedUsername) {
          return true;
        }
      }
    }
    
    // Check in chkanPlayers
    for (const idx in chkanPlayers) {
      if (chkanPlayers[idx] && 
          idx !== currentSlot && 
          chkanPlayers[idx].toLowerCase().trim() === normalizedUsername) {
        return true;
      }
    }
    
    return false;
  };

  // Check if a custom name conflicts with registered users
  const isRegisteredUsername = (username) => {
    if (!username) return false;
    
    const normalizedUsername = username.toLowerCase().trim();
    return registeredUsers.some(user => user.username.toLowerCase() === normalizedUsername);
  };

  // Enhanced player selection handler with validation for S7ab
  const handlePlayerSelection = (team, playerSlot, value) => {
    // Clear previous errors for this field
    setValidationErrors(prev => ({
      ...prev,
      [`${team}-${playerSlot}`]: null
    }));
    
    // Check for duplicates
    if (value && isDuplicateUsername(value, team, playerSlot)) {
      setValidationErrors(prev => ({
        ...prev,
        [`${team}-${playerSlot}`]: 'Ce joueur est déjà sélectionné'
      }));
    }
    
    // For custom inputs, check if name conflicts with registered users
    if (value && customPlayerInputs[team][playerSlot] && isRegisteredUsername(value)) {
      setValidationErrors(prev => ({
        ...prev,
        [`${team}-${playerSlot}`]: 'Ce nom est déjà utilisé par un utilisateur enregistré'
      }));
    }
    
    // Update the value regardless of validation (we'll block submission with errors)
    setTeamPlayers(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [playerSlot]: value
      }
    }));
  };

  // Toggle between custom input and dropdown for S7ab
  const handleToggleCustomInput = (team, playerSlot) => {
    setCustomPlayerInputs(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [playerSlot]: !prev[team][playerSlot]
      }
    }));
    
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

  // Enhanced player selection handler with validation for Chkan
  const handleChkanPlayerSelection = (playerIndex, value) => {
    // Clear previous errors for this field
    setValidationErrors(prev => ({
      ...prev,
      [`player-${playerIndex}`]: null
    }));
    
    // Check for duplicates
    if (value && isDuplicateUsername(value, null, playerIndex)) {
      setValidationErrors(prev => ({
        ...prev,
        [`player-${playerIndex}`]: 'Ce joueur est déjà sélectionné'
      }));
    }
    
    // For custom inputs, check if name conflicts with registered users
    if (value && chkanCustomInputs[playerIndex] && isRegisteredUsername(value)) {
      setValidationErrors(prev => ({
        ...prev,
        [`player-${playerIndex}`]: 'Ce nom est déjà utilisé par un utilisateur enregistré'
      }));
    }
    
    // Update the value regardless of validation (we'll block submission with errors)
    setChkanPlayers(prev => ({
      ...prev,
      [playerIndex]: value
    }));
  };

  // Toggle between custom input and dropdown for Chkan
  const handleToggleChkanCustomInput = (playerIndex) => {
    setChkanCustomInputs(prev => ({
      ...prev,
      [playerIndex]: !prev[playerIndex]
    }));
    
    if (!chkanCustomInputs[playerIndex]) {
      setChkanPlayers(prev => ({
        ...prev,
        [playerIndex]: ''
      }));
    }
  };

  // Check if there are any validation errors
  const hasValidationErrors = () => {
    return Object.values(validationErrors).some(error => error !== null && error !== undefined);
  };

  return {
    registeredUsers,
    setRegisteredUsers,
    teamPlayers,
    setTeamPlayers,
    customPlayerInputs,
    setCustomPlayerInputs,
    chkanPlayers,
    setChkanPlayers,
    chkanCustomInputs,
    setChkanCustomInputs,
    validationErrors,
    setValidationErrors,
    hasValidationErrors,
    handlePlayerSelection,
    handleToggleCustomInput,
    handleChkanPlayerSelection,
    handleToggleChkanCustomInput,
    initializeChkanPlayerStates,
    fetchRegisteredUsers,
    isDuplicateUsername,
    isRegisteredUsername
  };
}