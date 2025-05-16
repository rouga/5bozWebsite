// client/src/components/GameSetup/PlayerSelector.jsx
import React from 'react';
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
  // Render player selection for S7ab with authentication status
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
            const isRegistered = registeredUsers.some(u => u.username === playerName);
            
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
                      onChange={(e) => onPlayerSelection(team, playerSlot, e.target.value)}
                      placeholder="Entrer nom du joueur"
                      className="mb-0 flex-grow-1"
                    />
                  ) : (
                    <select
                      className="form-select flex-grow-1"
                      value={teamPlayers[team][playerSlot]}
                      onChange={(e) => onPlayerSelection(team, playerSlot, e.target.value)}
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

  // Render Chkan player selection with authentication status
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
              const isRegistered = registeredUsers.some(u => u.username === playerName);
              
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
                        onChange={(e) => onChkanPlayerSelection(index, e.target.value)}
                        placeholder="Entrer nom du joueur"
                        className="mb-0 flex-grow-1"
                      />
                    ) : (
                      <select
                        className="form-select flex-grow-1"
                        value={chkanPlayers[index] || ''}
                        onChange={(e) => onChkanPlayerSelection(index, e.target.value)}
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
            onClick={onSendInvitations}
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
            onClick={onSendInvitations}
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