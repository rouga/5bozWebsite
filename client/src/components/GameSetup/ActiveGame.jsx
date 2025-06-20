// client/src/components/GameSetup/ActiveGame.jsx
import React, { useEffect } from 'react';
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
  roundWinner,
  onEnableMgagi,
  mgagiEnabled
}) => {
  // Handle automatic score setting for winning team or player
  useEffect(() => {
    if (!roundWinner) return;

    if (gameType === 's7ab') {
      // S7ab logic for teams - find which team the winner belongs to
      let winningTeamIndex = -1;
      gameState.teams.forEach((team, index) => {
        if (team.players && team.players.includes(roundWinner)) {
          winningTeamIndex = index;
        }
      });
      
      // Set scores for all winning team members to 0
      if (winningTeamIndex !== -1) {
        const team = gameState.teams[winningTeamIndex];
        if (team.players) {
          team.players.forEach((_, playerIndex) => {
            onRoundScoreChange(`team-${winningTeamIndex}-player-${playerIndex}`, '0');
          });
        }
      }
    } else if (gameType === 'chkan') {
      // Find the winner's index
      const winnerIndex = gameState.players.findIndex(player => player.name === roundWinner);
      
      if (winnerIndex !== -1) {
        // We'll apply the special scoring rules for the winner later
        // First, just clear their score field to indicate it will be auto-calculated
        onRoundScoreChange(`player-${winnerIndex}`, '');
      }
    }
  }, [roundWinner, gameType]);

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

  // Helper function to check if all required scores are entered
  const areAllScoresEntered = () => {
    if (gameType === 'chkan') {
      // For chkan, all player scores should be entered
      return gameState.players.every((_, index) => 
        roundScores[`player-${index}`] !== undefined && 
        roundScores[`player-${index}`] !== ''
      );
    } else {
      // For s7ab, ensure all team member scores are entered
      return gameState.teams.every((team, teamIndex) => 
        team.players && team.players.every((_, playerIndex) => 
          roundScores[`team-${teamIndex}-player-${playerIndex}`] !== undefined &&
          roundScores[`team-${teamIndex}-player-${playerIndex}`] !== ''
        )
      );
    }
  };

  // Calculate Chkan winner score based on other players' scores
  const calculateChkanWinnerScore = () => {
    if (gameType !== 'chkan' || !roundWinner) return null;
    
    // Find the winner index
    const winnerIndex = gameState.players.findIndex(player => player.name === roundWinner);
    if (winnerIndex === -1) return null;
    
    // Check if all other players have scores
    const allOtherPlayersHaveScores = gameState.players.every((_, playerIndex) => {
      if (playerIndex === winnerIndex) return true; // Skip the winner
      return roundScores[`player-${playerIndex}`] !== undefined && 
             roundScores[`player-${playerIndex}`] !== '';
    });
    
    if (!allOtherPlayersHaveScores) return null;
    
    // Check if all other players have a score of exactly 100
    let allOthersHave100 = true;
    
    for (let i = 0; i < gameState.players.length; i++) {
      if (i === winnerIndex) continue; // Skip the winner
      
      const score = parseInt(roundScores[`player-${i}`] || '0');
      if (score !== 100) {
        allOthersHave100 = false;
        break;
      }
    }
    
    // Apply the scoring rule
    if (allOthersHave100) {
      return -30; // Winner gets -30 if all others have exactly 100
    } else {
      return -10; // Winner gets -10 if at least one other player has a different score
    }
  };

  const handleAddRound = () => {
    // Step 1: Make a copy of the current roundScores
    const updatedScores = {...roundScores};
    let scoresUpdated = false;
    
    // Step 2: Special handling for Chkan winner
    if (gameType === 'chkan' && roundWinner) {
      const winnerIndex = gameState.players.findIndex(player => player.name === roundWinner);
      if (winnerIndex !== -1) {
        const winnerScore = calculateChkanWinnerScore();
        if (winnerScore !== null) {
          updatedScores[`player-${winnerIndex}`] = winnerScore.toString();
          scoresUpdated = true;
        }
      }
    }
    // Step 3: Ensure winning team scores are set to 0 for S7ab
    else if (gameType === 's7ab' && roundWinner) {
      let winningTeamIndex = -1;
      gameState.teams.forEach((team, index) => {
        if (team.players && team.players.includes(roundWinner)) {
          winningTeamIndex = index;
        }
      });
      
      if (winningTeamIndex !== -1) {
        const team = gameState.teams[winningTeamIndex];
        if (team.players) {
          team.players.forEach((_, playerIndex) => {
            const key = `team-${winningTeamIndex}-player-${playerIndex}`;
            if (updatedScores[key] !== '0') {
              updatedScores[key] = '0';
              scoresUpdated = true;
            }
          });
        }
      }
    }
    
    // Step 4: Set any missing scores to '0'
    if (gameType === 'chkan') {
      gameState.players.forEach((_, index) => {
        const key = `player-${index}`;
        // Skip the winner as their score is calculated separately
        if (roundWinner && gameState.players[index].name === roundWinner) {
          return;
        }
        if (updatedScores[key] === undefined || updatedScores[key] === '') {
          updatedScores[key] = '0';
          scoresUpdated = true;
        }
      });
    } else { // s7ab
      gameState.teams.forEach((team, teamIndex) => {
        if (team.players) {
          team.players.forEach((_, playerIndex) => {
            const key = `team-${teamIndex}-player-${playerIndex}`;
            if (updatedScores[key] === undefined || updatedScores[key] === '') {
              updatedScores[key] = '0';
              scoresUpdated = true;
            }
          });
        }
      });
    }
    
    // Step 5: Update all scores at once before calling onAddRound
    if (scoresUpdated) {
      // Update all changed scores
      Object.keys(updatedScores).forEach(key => {
        if (roundScores[key] !== updatedScores[key]) {
          onRoundScoreChange(key, updatedScores[key]);
        }
      });
      
      // Call onAddRound after a very short delay to ensure state updates
      setTimeout(() => onAddRound(), 50);
    } else {
      // No updates needed, call onAddRound directly
      onAddRound();
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
                  <td className="fw-medium">
                    {player.name}
                    {player.isMgagi && (
                      <span className="badge bg-warning ms-2">Mgagi</span>
                    )}
                  </td>
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

  // Helper function to determine which players are eligible for Mgagi
  const getEligibleMgagiPlayers = () => {
    if (gameType !== 'chkan' || mgagiEnabled) return [];
    
    const eligiblePlayers = [];
    
    // Get all player scores
    const playerScores = gameState.players.map(player => ({
      name: player.name,
      index: gameState.players.findIndex(p => p.name === player.name),
      totalScore: player.scores.reduce((a, b) => a + b, 0)
    }));
    
    // Sort scores from highest to lowest
    playerScores.sort((a, b) => b.totalScore - a.totalScore);
    
    // Find players who have score > 701 and no one else has reached 701 yet
    const playersAboveLimit = playerScores.filter(p => p.totalScore >= 701);
    
    if (playersAboveLimit.length === 1) {
      // Get the second highest score (if available)
      const secondHighestScore = playerScores.length > 1 ? playerScores[1].totalScore : 0;
      
      const player = playersAboveLimit[0];
      eligiblePlayers.push({
        name: player.name,
        index: player.index,
        totalScore: player.totalScore,
        newScore: secondHighestScore // This would be their score if they enable Mgagi
      });
    }
    
    return eligiblePlayers;
  };

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

  // Check if a player belongs to the winning team in s7ab mode
  const isPlayerInWinningTeam = (teamIndex, playerName) => {
    if (gameType !== 's7ab' || !roundWinner) return false;
    
    // Check if the selected round winner is in this team
    const team = gameState.teams[teamIndex];
    return team.players && team.players.includes(roundWinner);
  };

  // Get the winning team index if there is a round winner
  const getWinningTeamIndex = () => {
    if (gameType !== 's7ab' || !roundWinner) return -1;
    
    let winningTeamIndex = -1;
    gameState.teams.forEach((team, index) => {
      if (team.players && team.players.includes(roundWinner)) {
        winningTeamIndex = index;
      }
    });
    
    return winningTeamIndex;
  };

  // Check if a player is the round winner in Chkan mode
  const isChkanWinner = (playerIndex) => {
    if (gameType !== 'chkan' || !roundWinner) return false;
    const player = gameState.players[playerIndex];
    return player && player.name === roundWinner;
  };

  // Get the calculated score for the winner in Chkan mode
  const getChkanWinnerScoreDisplay = () => {
    const winnerScore = calculateChkanWinnerScore();
    if (winnerScore === null) return "Calculé automatiquement";
    return winnerScore.toString();
  };

  // Check if at least one non-winner player has a score different from 100
  const hasNon100Score = () => {
    if (gameType !== 'chkan' || !roundWinner) return false;
    
    const winnerIndex = gameState.players.findIndex(player => player.name === roundWinner);
    if (winnerIndex === -1) return false;
    
    for (let i = 0; i < gameState.players.length; i++) {
      if (i === winnerIndex) continue; // Skip the winner
      
      const scoreStr = roundScores[`player-${i}`] || '0';
      const score = parseInt(scoreStr);
      if (isNaN(score) || score !== 100) {
        return true;
      }
    }
    
    return false;
  };

  // Get the rule explanation for the current winner's score
  const getWinnerScoreExplanation = () => {
    if (gameType !== 'chkan' || !roundWinner) return null;
    
    const allOtherPlayersEntered = gameState.players.every((player, index) => {
      if (player.name === roundWinner) return true;
      return roundScores[`player-${index}`] !== undefined && roundScores[`player-${index}`] !== '';
    });
    
    if (!allOtherPlayersEntered) {
      return "Entrez les scores des autres joueurs d'abord";
    }
    
    if (hasNon100Score()) {
      return "Score: -10 (au moins un joueur a un score différent de 100)";
    } else {
      return "Score: -30 (tous les autres joueurs ont un score de 100)";
    }
  };

  // Get the eligible Mgagi players
  const eligibleMgagiPlayers = getEligibleMgagiPlayers();

  // Check Mgagi rules: If there is a Mgagi player, game is only won when two players reach 701+
  const checkMgagiRules = () => {
    if (gameType !== 'chkan') return null;
    
    // Check if there's a Mgagi player
    const hasMgagiPlayer = gameState.players.some(player => player.isMgagi);
    
    if (hasMgagiPlayer) {
      // Count players who have reached 701+
      const playersAboveLimit = gameState.players.filter(player => 
        player.scores.reduce((a, b) => a + b, 0) >= 701
      );
      
      if (playersAboveLimit.length === 1) {
        return (
          <div className="alert alert-info mt-3">
            <i className="bi bi-info-circle-fill me-2"></i>
            Un joueur Mgagi est en jeu. Pour gagner, deux joueurs doivent atteindre 701 points.
          </div>
        );
      }
    }
    
    return null;
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

      {/* Mgagi Option Display for eligible players */}
      {gameType === 'chkan' && eligibleMgagiPlayers.length > 0 && (
        <div className="alert alert-warning mb-4">
          <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <div className="flex-grow-1">
              <strong>{eligibleMgagiPlayers[0].name}</strong> a dépassé 701 points et peut décider de devenir "Mgagi"
              <div>
                <small>Score actuel: <strong>{eligibleMgagiPlayers[0].totalScore}</strong> → Nouveau score: <strong>{eligibleMgagiPlayers[0].newScore}</strong></small>
              </div>
              <div className="mt-2">
                <button 
                  className="btn btn-warning btn-sm me-2"
                  onClick={() => onEnableMgagi(eligibleMgagiPlayers[0].index)}
                >
                  <i className="bi bi-magic me-1"></i>
                  Activer Mgagi
                </button>
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => onEnableMgagi(null)}
                >
                  <i className="bi bi-x me-1"></i>
                  Non merci
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mgagi Rules Display */}
      {checkMgagiRules()}

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
                        <div className="fw-semibold small">
                          {player.name}
                          {player.isMgagi && (
                            <span className="badge bg-warning ms-1">Mgagi</span>
                          )}
                        </div>
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
                {gameType === 's7ab' 
                  ? "Sélectionnez le joueur qui est allé au bout de ses cartes ce tour. Les scores de son équipe seront automatiquement mis à 0."
                  : "Sélectionnez le joueur qui est allé au bout de ses cartes ce tour. Son score sera calculé automatiquement."}
              </small>
            </div>
          </div>

          {gameType === 'chkan' ? (
            <div className="row g-3">
              {gameState.players.map((player, index) => {
                // Check if this player is the round winner
                const isWinner = roundWinner === player.name;
                // Get winner score explanation for display
                const winnerScoreExplanation = isWinner ? getWinnerScoreExplanation() : null;
                
                return (
                  <div key={index} className="col-12 col-md-6">
                    <FormInput
                      label={
                        <>
                          {gameState.currentRound === 1 ? (
                            <input
                              type="text"
                              value={player.name}
                              onChange={(e) => onPlayerNameChange(index, e.target.value)}
                              className="form-control form-control-sm fw-semibold"
                              placeholder={`Player ${index + 1}`}
                            />
                          ) : (
                            <>
                              {player.name}
                              {player.isMgagi && (
                                <span className="badge bg-warning ms-1">Mgagi</span>
                              )}
                            </>
                          )}
                          {isWinner && (
                            <span className="badge bg-warning ms-2">
                              <i className="bi bi-trophy-fill me-1"></i>
                              Round Winner
                            </span>
                          )}
                        </>
                      }
                      type="number"
                      name={`player-${index}`}
                      value={isWinner ? "" : roundScores[`player-${index}`] || ''}
                      onChange={(e) => {
                        // Only allow changes for non-winners
                        if (!isWinner) {
                          onRoundScoreChange(`player-${index}`, e.target.value);
                        }
                      }}
                      placeholder={isWinner ? "Score calculé automatiquement" : "Enter score"}
                      disabled={isWinner}
                      helpText={winnerScoreExplanation}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="row g-3">
              {gameState.teams.map((team, teamIndex) => {
                const isWinningTeam = getWinningTeamIndex() === teamIndex;
                
                return (
                  <React.Fragment key={teamIndex}>
                    <div className="col-12">
                      <h6 className="fw-semibold border-bottom pb-2">
                        {team.name}
                        {isWinningTeam && (
                          <span className="badge bg-success ms-2">
                            <i className="bi bi-trophy-fill me-1"></i>
                            Winning Team
                          </span>
                        )}
                      </h6>
                    </div>
                    {team.players && team.players.map((playerName, playerIndex) => {
                      const scoreKey = `team-${teamIndex}-player-${playerIndex}`;
                      // Player is part of the winning team
                      const isWinner = isWinningTeam;
                      
                      return (
                        <div key={playerIndex} className="col-12 col-md-6">
                          <FormInput
                            label={
                              <>
                                {playerName}
                                {playerName === roundWinner && (
                                  <span className="badge bg-warning ms-2">
                                    <i className="bi bi-trophy-fill me-1"></i>
                                    Round Winner
                                  </span>
                                )}
                              </>
                            }
                            type="number"
                            name={scoreKey}
                            value={isWinner ? '0' : (roundScores[scoreKey] || '')}
                            onChange={(e) => {
                              // If this is the winning team, force score to 0
                              if (isWinner) {
                                onRoundScoreChange(scoreKey, '0');
                              } else {
                                onRoundScoreChange(scoreKey, e.target.value);
                              }
                            }}
                            placeholder={isWinner ? "0 (Winner)" : "Enter player score"}
                            min="0"
                            disabled={isWinner}
                            helpText={isWinner ? "Score is set to 0 automatically for winners" : null}
                          />
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          <div className="text-center mt-4">
            <button 
              className="btn btn-primary btn-lg px-4"
              onClick={handleAddRound}
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