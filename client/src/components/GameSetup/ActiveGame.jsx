// client/src/components/GameSetup/ActiveGame.jsx
import React from 'react';
import { FormInput } from '../index';
import ScoreContributionStats from '../ScoreContributionStats';

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
  onCancelGame,
  onRoundWinnerChange,
  roundWinner
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

  // Calculate the current dealer based on round number and initial dealer
  const getCurrentDealer = () => {
    if (!gameState || !gameState.initialDealer) return null;

    const completedRounds = getCompletedRounds();
    const initialDealerIndex = parseInt(gameState.initialDealer);
    
    if (gameType === 'chkan') {
      // For chkan games, just rotate through the players
      const numPlayers = gameState.players.length;
      const currentDealerIndex = (initialDealerIndex + completedRounds) % numPlayers;
      return {
        name: gameState.players[currentDealerIndex]?.name,
        index: currentDealerIndex
      };
    } else {
      // For s7ab games, create an array of all players in the correct dealing order
      // Order: team1-player1, team2-player1, team1-player2, team2-player2
      const dealerOrder = [];
      
      // Team 1 player 1
      if (gameState.teams[0]?.players?.[0]) {
        dealerOrder.push({
          teamIndex: 0,
          playerIndex: 0,
          name: gameState.teams[0].players[0]
        });
      }
      
      // Team 2 player 1
      if (gameState.teams[1]?.players?.[0]) {
        dealerOrder.push({
          teamIndex: 1,
          playerIndex: 0,
          name: gameState.teams[1].players[0]
        });
      }
      
      // Team 1 player 2
      if (gameState.teams[0]?.players?.[1]) {
        dealerOrder.push({
          teamIndex: 0,
          playerIndex: 1,
          name: gameState.teams[0].players[1]
        });
      }
      
      // Team 2 player 2
      if (gameState.teams[1]?.players?.[1]) {
        dealerOrder.push({
          teamIndex: 1,
          playerIndex: 1,
          name: gameState.teams[1].players[1]
        });
      }
      
      if (dealerOrder.length === 0) return null;
      
      const currentDealerIndex = (initialDealerIndex + completedRounds) % dealerOrder.length;
      return dealerOrder[currentDealerIndex];
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

    // Helper function to get dealer name for a specific round
    const getDealerForRound = (roundIndex) => {
      if (!gameState.initialDealer && gameState.initialDealer !== 0) return null;
      
      const initialDealerIndex = parseInt(gameState.initialDealer);
      
      if (gameType === 'chkan') {
        // For chkan games
        const players = gameState.players || [];
        if (players.length === 0) return null;
        
        const numPlayers = players.length;
        const dealerIndex = (initialDealerIndex + roundIndex) % numPlayers;
        return players[dealerIndex]?.name;
      } else {
        // For s7ab games
        // Create dealer order array
        const dealerOrder = [];
        
        // Team 1 player 1
        if (gameState.teams[0]?.players?.[0]) {
          dealerOrder.push(gameState.teams[0].players[0]);
        }
        
        // Team 2 player 1
        if (gameState.teams[1]?.players?.[0]) {
          dealerOrder.push(gameState.teams[1].players[0]);
        }
        
        // Team 1 player 2
        if (gameState.teams[0]?.players?.[1]) {
          dealerOrder.push(gameState.teams[0].players[1]);
        }
        
        // Team 2 player 2
        if (gameState.teams[1]?.players?.[1]) {
          dealerOrder.push(gameState.teams[1].players[1]);
        }
        
        if (dealerOrder.length === 0) return null;
        
        const dealerIndex = (initialDealerIndex + roundIndex) % dealerOrder.length;
        return dealerOrder[dealerIndex];
      }
    };

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
                  <th key={i} className="text-center fw-semibold">
                    <div>R{i + 1}</div>
                    {(gameState.initialDealer !== undefined) && (
                      <div className="small text-muted">
                        <i className="bi bi-shuffle me-1"></i>
                        Jarray: {getDealerForRound(i)}
                      </div>
                    )}
                    {gameState.roundWinners && gameState.roundWinners[i] && (
                      <div className="small text-warning mt-1">
                        <i className="bi bi-trophy-fill me-1"></i>
                        Farchet {gameState.roundWinners[i]}
                      </div>
                    )}
                  </th>
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
                        {player.scores[roundIndex] !== undefined 
                          ? (player.scores[roundIndex] === 0 ? '-' : player.scores[roundIndex]) 
                          : '–'}
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
                  <th key={i} className="text-center fw-semibold">
                    <div>R{i + 1}</div>
                    {(gameState.initialDealer !== undefined) && (
                      <div className="small text-muted">
                        <i className="bi bi-shuffle me-1"></i>
                        Jarray: {getDealerForRound(i)}
                      </div>
                    )}
                    {gameState.roundWinners && gameState.roundWinners[i] && (
                      <div className="small text-warning mt-1">
                        <i className="bi bi-trophy-fill me-1"></i>
                          Farchet {gameState.roundWinners[i]}
                      </div>
                    )}
                  </th>
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
                      {team.scores[roundIndex] !== undefined 
                        ? (team.scores[roundIndex] === 0 ? '-' : team.scores[roundIndex]) 
                        : '–'}
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
  const currentDealer = getCurrentDealer();

  // Function to format dealer display
  const formatDealerDisplay = () => {
    if (!currentDealer) return null;
    
    if (gameType === 'chkan') {
      return (
        <div className="alert alert-info d-flex align-items-center">
          <i className="bi bi-shuffle me-2"></i>
          <div>
            <strong>{currentDealer.name}</strong> doit distribuer les cartes pour ce tour
          </div>
        </div>
      );
    } else {
      // For s7ab games
      const teamName = gameState.teams[currentDealer.teamIndex]?.name || `Équipe ${currentDealer.teamIndex + 1}`;
      return (
        <div className="alert alert-info d-flex align-items-center">
          <i className="bi bi-shuffle me-2"></i>
          <div>
            <strong>{currentDealer.name}</strong> 
            <span className="ms-1">de {teamName} doit distribuer les cartes pour ce tour</span>
          </div>
        </div>
      );
    }
  };

  // Generate round winner selector options
  const renderRoundWinnerOptions = () => {
    let options = [];

    if (gameType === 'chkan') {
      // For chkan games, all players can be winners
      gameState.players.forEach((player, index) => {
        options.push(
          <option key={`player-${index}`} value={player.name}>
            {player.name}
          </option>
        );
      });
    } else {
      // For s7ab games, all individual players can be winners
      gameState.teams.forEach((team, teamIndex) => {
        if (team.players && team.players.length > 0) {
          team.players.forEach((playerName, playerIndex) => {
            options.push(
              <option key={`team-${teamIndex}-player-${playerIndex}`} value={playerName}>
                {playerName} ({team.name})
              </option>
            );
          });
        }
      });
    }

    return options;
  };

  // Check if all scores are 0
  const areAllScoresZero = () => {
    const scores = Object.values(roundScores);
    if (scores.some(score => score === '' || score === null)) {
      return false;
    }
    return scores.every(score => parseInt(score) === 0);
  };

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

      {/* Current Dealer Display */}
      {formatDealerDisplay()}

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
              
              {/* Score Statistics */}
              {completedRounds > 0 && <ScoreContributionStats gameData={gameState} gameType={gameType} />}
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

          {/* Round Winner Selection */}
          <div className="mb-4">
            <label className="form-label fw-semibold">
              <i className="bi bi-trophy me-2 text-warning"></i>
              Qui est allé au bout de ses cartes ?
            </label>
            <select 
              className="form-select"
              value={roundWinner || ''}
              onChange={(e) => onRoundWinnerChange(e.target.value)}
            >
              <option value="">
                {areAllScoresZero() 
                  ? "-- Aucun gagnant (tous les scores sont 0) --" 
                  : "-- Sélectionner le gagnant du tour --"}
              </option>
              {renderRoundWinnerOptions()}
            </select>
            <div className="form-text">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                {areAllScoresZero() 
                  ? "Laisser vide si personne n'a gagné ce tour (tous les scores sont 0)" 
                  : "Sélectionnez le joueur qui est allé au bout de ses cartes ce tour."}
              </small>
            </div>
          </div>

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
              {gameState.teams.map((team, teamIndex) => (
                <React.Fragment key={teamIndex}>
                  <div className="col-12">
                    <h6 className="fw-semibold border-bottom pb-2">{team.name}</h6>
                  </div>
                  {team.players && team.players.map((playerName, playerIndex) => (
                    <div key={playerIndex} className="col-12 col-md-6">
                      <FormInput
                        label={playerName}
                        type="number"
                        name={`team-${teamIndex}-player-${playerIndex}`}
                        value={roundScores[`team-${teamIndex}-player-${playerIndex}`] || ''}
                        onChange={(e) => onRoundScoreChange(`team-${teamIndex}-player-${playerIndex}`, e.target.value)}
                        placeholder="Enter player score"
                        min="0"
                      />
                    </div>
                  ))}
                </React.Fragment>
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