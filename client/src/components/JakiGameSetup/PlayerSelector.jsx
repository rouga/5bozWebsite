import React, { useState } from 'react';

const PlayerSelector = ({
  winningScore,
  registeredUsers,
  players,
  onPlayerSelection,
  customInputs,
  onToggleCustomInput,
  onWinningScoreChange,
  onSendInvitations
}) => {
  const [validationError, setValidationError] = useState(null);

  // Check if username is already used in current selection
  const isDuplicate = (username, currentSlot) => {
    if (!username) return false;
    
    // For case-insensitive comparison
    const normalizedUsername = username.toLowerCase().trim();
    
    // Check for duplicates across both players
    for (const slot in players) {
      if (players[slot] && 
          slot !== currentSlot && 
          players[slot].toLowerCase().trim() === normalizedUsername) {
        return true;
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

  // Enhanced player selection handler with validation
  const handlePlayerSelection = (playerSlot, value) => {
    // Clear previous errors for this field
    setValidationError(null);
    
    // Check for duplicates
    if (value && isDuplicate(value, playerSlot)) {
      setValidationError('Players must be different');
      return;
    }
    
    // For custom inputs, check if name conflicts with registered users
    if (value && customInputs[playerSlot] && isRegisteredUsername(value)) {
      setValidationError('This name is already used by a registered user');
      return;
    }
    
    // Update the value
    onPlayerSelection(playerSlot, value);
  };

  return (
    <div>
      <div className="text-center mb-4">
        <h3 className="fw-bold text-dark">Jaki Game Setup</h3>
        <p className="text-muted">Select players and game settings</p>
      </div>
      
      {validationError && (
        <div className="alert alert-danger mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {validationError}
        </div>
      )}
      
      {/* Winning Score Selector */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Game Settings</h5>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label fw-semibold">Winning Score</label>
            <select 
              className="form-select"
              value={winningScore}
              onChange={(e) => onWinningScoreChange(e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map(score => (
                <option key={score} value={score}>{score} points</option>
              ))}
            </select>
            <div className="form-text">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                First player to reach this score wins the game
              </small>
            </div>
          </div>
        </div>
      </div>
      
      {/* Player Selection */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Select Players</h5>
        </div>
        <div className="card-body">
          {['player1', 'player2'].map((playerKey, index) => {
            const isCustomInput = customInputs[playerKey];
            
            return (
              <div key={playerKey} className="mb-3">
                <label className="form-label fw-semibold">Player {index + 1}</label>
                <div className="d-flex gap-2 align-items-center">
                  {isCustomInput ? (
                    <input
                      type="text"
                      className="form-control"
                      value={players[playerKey] || ''}
                      onChange={(e) => handlePlayerSelection(playerKey, e.target.value)}
                      placeholder="Enter player name"
                    />
                  ) : (
                    <select
                      className="form-select"
                      value={players[playerKey] || ''}
                      onChange={(e) => handlePlayerSelection(playerKey, e.target.value)}
                    >
                      <option value="">Select a player</option>
                      {registeredUsers.map(user => (
                        <option 
                          key={user.id} 
                          value={user.username}
                          disabled={
                            (playerKey === 'player1' && players.player2 === user.username) ||
                            (playerKey === 'player2' && players.player1 === user.username)
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
                    onClick={() => onToggleCustomInput(playerKey)}
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
          onClick={onSendInvitations}
          disabled={!players.player1 || !players.player2 || !!validationError}
        >
          <i className="bi bi-paper-plane me-2"></i>
          Send Invitations
        </button>
      </div>
    </div>
  );
};

export default PlayerSelector;