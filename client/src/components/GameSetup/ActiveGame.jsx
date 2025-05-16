// client/src/components/GameSetup/ActiveGame.jsx
import React from 'react';
import { FormInput } from '../index';

const ActiveGame = ({
  gameType,
  gameState,
  roundScores,
  roundInputError,
  showRoundDetails,
  loading,
  gameCreatedAt,
  gameTime,
  onRoundScoreChange,
  onPlayerNameChange,
  onTeamNameChange,
  onAddRound,
  onToggleRoundDetails,
  onFinishGame,
  onCancelGame
}) => {
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
                onClick={onCancelGame}
              >
                <i className="bi bi-x-circle me-1"></i>
                Cancel
              </button>
              <button 
                className="btn btn-light btn-sm"
                onClick={onFinishGame}
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
                onClick={onToggleRoundDetails}
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
                          onChange={(e) => onPlayerNameChange(index, e.target.value)}
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
                    onChange={(e) => onRoundScoreChange(`player-${index}`, e.target.value)}
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
                    onChange={(e) => onRoundScoreChange(`team-${index}`, e.target.value)}
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
              onClick={onAddRound}
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

export default ActiveGame;