// client/src/components/GameSetup/PlayerSelector.jsx
import React, { useState } from 'react';
import { FormInput } from '../index';

const PlayerSelector = ({
  gameType,
  numberOfPlayers,
  registeredUsers,
  teamPlayers,
  setTeamPlayers,
  customPlayerInputs,
  setCustomPlayerInputs,
  chkanPlayers,
  setChkanPlayers,
  chkanCustomInputs,
  setChkanCustomInputs,
  playerAcceptanceStatus,
  onPlayerSelection,
  onToggleCustomInput,
  onChkanPlayerSelection,
  onToggleChkanCustomInput,
  error,
  onGoBack,
  onSendInvitations
}) => {
  const [validationErrors, setValidationErrors] = useState({});

  // Function to check if username is already used in current selection
  const isDuplicate = (username, currentTeam, currentSlot) => {
    if (!username) return false;
    
    // For case-insensitive comparison
    const normalizedUsername = username.toLowerCase().trim();
    
    if (gameType === 's7ab') {
      // Check in team1
      for (const slot in teamPlayers.team1) {
        if (teamPlayers.team1[slot] && 
            (currentTeam !== 'team1' || currentSlot !== slot) && 
            teamPlayers.team1[slot].toLowerCase().trim() === normalizedUsername) {
          return true;
        }
      }
      
      // Check in team2
      for (const slot in teamPlayers.team2) {
        if (teamPlayers.team2[slot] && 
            (currentTeam !== 'team2' || currentSlot !== slot) && 
            teamPlayers.team2[slot].toLowerCase().trim() === normalizedUsername) {
          return true;
        }
      }
    } else if (gameType === 'chkan') {
      // Check in chkan players
      for (const idx in chkanPlayers) {
        if (chkanPlayers[idx] && 
            idx !== currentSlot && 
            chkanPlayers[idx].toLowerCase().trim() === normalizedUsername) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Function to check if manually entered name conflicts with registered users
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
    if (value && isDuplicate(value, team, playerSlot)) {
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
    onPlayerSelection(team, playerSlot, value);
  };
  
  // Enhanced player selection handler with validation for Chkan
  const handleChkanPlayerSelection = (playerIndex, value) => {
    // Clear previous errors for this field
    setValidationErrors(prev => ({
      ...prev,
      [`player-${playerIndex}`]: null
    }));
    
    // Check for duplicates
    if (value && isDuplicate(value, null, playerIndex)) {
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
    onChkanPlayerSelection(playerIndex, value);
  };
  
  // Check if there are any validation errors
  const hasValidationErrors = () => {
    return Object.values(validationErrors).some(error => error !== null && error !== undefined);
  };

  // Handle send invitations with validation check
  const handleSendInvitations = () => {
    // Perform final validation checks
    if (hasValidationErrors()) {
      return; // Don't proceed if there are validation errors
    }
    
    onSendInvitations();
  };

  // Render player selection for S7ab with validation
  const renderS7abPlayerSelection = (team, teamNumber) => {
    return (
      <div className="card mb-3">
        <div className="card-header">
          <h6 className="mb-0">Équipe {teamNumber}</h6>
        </div>
        <div className="card-body">
          {['player1', 'player2'].map((playerSlot, index) => {
            const teamSlotKey = `${team}-${playerSlot}`;
            const isAccepted = playerAcceptanceStatus[teamSlotKey];
            const playerName = teamPlayers[team][playerSlot];
            const isRegistered = registeredUsers.some(u => u.username.toLowerCase() === playerName?.toLowerCase());
            const validationError = validationErrors[teamSlotKey];
            
            return (
              <div key={playerSlot} className="mb-3">
                <label className="form-label fw-semibold">
                  Joueur {index + 1}
                  {isRegistered && playerName && (
                    <span className="ms-2">
                      {isAccepted ? (
                        <i className="bi bi-check-circle-fill text-success" title="Authenticated"></i>
                      ) : (
                        <i className="bi bi-clock text-warning" title="Waiting for response"></i>
                      )}
                    </span>
                  )}
                </label>
                <div className="d-flex gap-2 align-items-center">
                  {customPlayerInputs[team][playerSlot] ? (
                    <FormInput
                      value={teamPlayers[team][playerSlot]}
                      onChange={(e) => handlePlayerSelection(team, playerSlot, e.target.value)}
                      placeholder="Entrer nom du joueur"
                      className="mb-0 flex-grow-1"
                      error={validationError}
                    />
                  ) : (
                    <div className="flex-grow-1">
                      <select
                        className={`form-select ${validationError ? 'is-invalid' : ''}`}
                        value={teamPlayers[team][playerSlot]}
                        onChange={(e) => handlePlayerSelection(team, playerSlot, e.target.value)}
                      >
                        <option value="">Choisir un joueur</option>
                        {registeredUsers.map((user) => (
                          <option 
                            key={user.id} 
                            value={user.username}
                            disabled={isDuplicate(user.username, team, playerSlot)}
                          >
                            {user.username} {isDuplicate(user.username, team, playerSlot) ? '(déjà sélectionné)' : ''}
                          </option>
                        ))}
                      </select>
                      {validationError && (
                        <div className="invalid-feedback d-block">
                          {validationError}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => onToggleCustomInput(team, playerSlot)}
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
            );
          })}
        </div>
      </div>
    );
  };

  // Render Chkan player selection with validation
  const renderChkanPlayerSelection = () => {
    return (
      <div className="card mb-3">
        <div className="card-header">
          <h6 className="mb-0">Sélection des joueurs</h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {Array.from({ length: numberOfPlayers }, (_, index) => {
              const teamSlotKey = `player-${index}`;
              const isAccepted = playerAcceptanceStatus[teamSlotKey];
              const playerName = chkanPlayers[index];
              const isRegistered = registeredUsers.some(u => u.username.toLowerCase() === playerName?.toLowerCase());
              const validationError = validationErrors[teamSlotKey];
              
              return (
                <div key={index} className="col-12 col-md-6">
                  <label className="form-label fw-semibold">
                    Joueur {index + 1}
                    {isRegistered && playerName && (
                      <span className="ms-2">
                        {isAccepted ? (
                          <i className="bi bi-check-circle-fill text-success" title="Authenticated"></i>
                        ) : (
                          <i className="bi bi-clock text-warning" title="Waiting for response"></i>
                        )}
                      </span>
                    )}
                  </label>
                  <div className="d-flex gap-2 align-items-center">
                    {chkanCustomInputs[index] ? (
                      <FormInput
                        value={chkanPlayers[index] || ''}
                        onChange={(e) => handleChkanPlayerSelection(index, e.target.value)}
                        placeholder="Entrer nom du joueur"
                        className="mb-0 flex-grow-1"
                        error={validationError}
                      />
                    ) : (
                      <div className="flex-grow-1">
                        <select
                          className={`form-select ${validationError ? 'is-invalid' : ''}`}
                          value={chkanPlayers[index] || ''}
                          onChange={(e) => handleChkanPlayerSelection(index, e.target.value)}
                        >
                          <option value="">Choisir un joueur</option>
                          {registeredUsers.map((user) => (
                            <option 
                              key={user.id} 
                              value={user.username}
                              disabled={isDuplicate(user.username, null, index)}
                            >
                              {user.username} {isDuplicate(user.username, null, index) ? '(déjà sélectionné)' : ''}
                            </option>
                          ))}
                        </select>
                        {validationError && (
                          <div className="invalid-feedback d-block">
                            {validationError}
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => onToggleChkanCustomInput(index)}
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
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (gameType === 'chkan') {
    return (
      <div>
        <div className="text-center mb-4">
          <h3 className="fw-bold text-dark">Configuration Chkan</h3>
          <p className="text-muted">Sélectionnez les {numberOfPlayers} joueurs</p>
        </div>
        
        {error && (
          <div className="alert alert-danger mb-4">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}
        
        {renderChkanPlayerSelection()}
        
        <div className="text-center">
          <button 
            className="btn btn-outline-secondary me-3"
            onClick={onGoBack}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Retour
          </button>
          <button 
            className="btn btn-primary btn-lg"
            onClick={handleSendInvitations}
            disabled={hasValidationErrors()}
          >
            <i className="bi bi-paper-plane me-2"></i>
            Envoyer les invitations
          </button>
        </div>
      </div>
    );
  }

  if (gameType === 's7ab') {
    return (
      <div>
        <div className="text-center mb-4">
          <h3 className="fw-bold text-dark">Configuration S7ab</h3>
          <p className="text-muted">Sélectionnez les joueurs pour chaque équipe</p>
        </div>
        
        {error && (
          <div className="alert alert-danger mb-4">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}
        
        <div className="row">
          <div className="col-12 col-md-6">
            {renderS7abPlayerSelection('team1', 1)}
          </div>
          <div className="col-12 col-md-6">
            {renderS7abPlayerSelection('team2', 2)}
          </div>
        </div>
        
        <div className="text-center">
          <button 
            className="btn btn-outline-secondary me-3"
            onClick={onGoBack}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Retour
          </button>
          <button 
            className="btn btn-primary btn-lg"
            onClick={handleSendInvitations}
            disabled={hasValidationErrors()}
          >
            <i className="bi bi-paper-plane me-2"></i>
            Envoyer les invitations
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default PlayerSelector;