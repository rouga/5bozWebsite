// client/src/components/GameDetails.jsx
import React from 'react';

const GameDetails = ({ game }) => {
  if (!game || !game.game_data) return null;
  
  const gameData = typeof game.game_data === 'string' ? JSON.parse(game.game_data) : game.game_data;
  
  // Calculate the dealer for each round
  const calculateDealerForRound = (roundIndex) => {
    if (gameData.initialDealer === undefined) return null;
    
    const initialDealerIndex = parseInt(gameData.initialDealer);
    
    if (game.type === 'chkan') {
      // For chkan games
      const players = gameData.players || [];
      if (players.length === 0) return null;
      
      const numPlayers = players.length;
      const dealerIndex = (initialDealerIndex + roundIndex) % numPlayers;
      return players[dealerIndex]?.name;
    } else {
      // For s7ab games
      const teams = gameData.teams || [];
      if (teams.length < 2) return null;
      
      // Create dealing order array
      const dealerOrder = [];
      
      // Team 1 player 1
      if (teams[0]?.players?.[0]) {
        dealerOrder.push(teams[0].players[0]);
      }
      
      // Team 2 player 1
      if (teams[1]?.players?.[0]) {
        dealerOrder.push(teams[1].players[0]);
      }
      
      // Team 1 player 2
      if (teams[0]?.players?.[1]) {
        dealerOrder.push(teams[0].players[1]);
      }
      
      // Team 2 player 2
      if (teams[1]?.players?.[1]) {
        dealerOrder.push(teams[1].players[1]);
      }
      
      if (dealerOrder.length === 0) return null;
      
      const dealerIndex = (initialDealerIndex + roundIndex) % dealerOrder.length;
      return dealerOrder[dealerIndex];
    }
  };
  
  // Calculate round win statistics
  const calculateRoundWinStats = () => {
    if (!gameData.roundWinners || !Array.isArray(gameData.roundWinners)) {
      return [];
    }
    
    // Count wins for each player
    const winCounts = {};
    gameData.roundWinners.forEach(winner => {
      if (winner) {
        winCounts[winner] = (winCounts[winner] || 0) + 1;
      }
    });
    
    // Convert to array and sort by count descending
    const stats = Object.entries(winCounts).map(([name, count]) => ({
      name,
      count
    }));
    
    stats.sort((a, b) => b.count - a.count);
    return stats;
  };
  
  const renderWinStats = () => {
    const stats = calculateRoundWinStats();
    
    if (stats.length === 0) {
      return (
        <div className="text-center text-muted">
          <small>No round winner data available</small>
        </div>
      );
    }
    
    return (
      <div className="mt-3 mb-3">
        <h6 className="text-muted mb-2">Round Win Statistics</h6>
        <div className="row g-2">
          {stats.map((stat, index) => (
            <div key={index} className="col-6 col-md-3">
              <div className={`text-center p-2 rounded ${index === 0 ? 'bg-warning bg-opacity-10' : 'bg-light'}`}>
                <div className="fw-semibold small">{stat.name}</div>
                <div className="d-flex align-items-center justify-content-center gap-1">
                  <i className="bi bi-trophy-fill text-warning"></i>
                  <span className="h5 mb-0">{stat.count}</span>
                  <small className="text-muted">wins</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  if (game.type === 'chkan') {
    const players = gameData.players || [];
    const maxRounds = Math.max(...players.map(p => p.scores.length));
    
    return (
      <div className="mt-3">
        <h6 className="text-muted mb-3">Round Details</h6>
        <div className="table-responsive">
          <table className="table table-sm table-bordered">
            <thead className="bg-light">
              <tr>
                <th className="fw-semibold">Player</th>
                {Array.from({ length: maxRounds }, (_, i) => (
                  <th key={i} className="text-center fw-semibold">
                    <div>R{i + 1}</div>
                    {gameData.initialDealer !== undefined && (
                      <div className="small text-muted">
                        <i className="bi bi-shuffle me-1"></i>
                        Jarray: {calculateDealerForRound(i)}
                      </div>
                    )}
                    {gameData.roundWinners && gameData.roundWinners[i] && (
                      <div className="small text-warning mt-1">
                        <i className="bi bi-trophy-fill me-1"></i>
                        Farchet {gameData.roundWinners[i]}
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
                      {player.scores[roundIndex] !== undefined ? player.scores[roundIndex] : '–'}
                    </td>
                  ))}
                  <td className="text-center fw-bold bg-primary text-white">
                    {player.totalScore || player.scores.reduce((a, b) => a + b, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Round Win Statistics */}
        {renderWinStats()}
      </div>
    );
  } else {
    // S7ab games
    const teams = gameData.teams || [];
    const maxRounds = Math.max(...teams.map(t => t.scores.length));
    
    return (
      <div className="mt-3">
        <h6 className="text-muted mb-3">Round Details</h6>
        <div className="table-responsive">
          <table className="table table-sm table-bordered">
            <thead className="bg-light">
              <tr>
                <th className="fw-semibold">Team</th>
                {Array.from({ length: maxRounds }, (_, i) => (
                  <th key={i} className="text-center fw-semibold">
                    <div>R{i + 1}</div>
                    {gameData.initialDealer !== undefined && (
                      <div className="small text-muted">
                        <i className="bi bi-shuffle me-1"></i>
                        Jarray: {calculateDealerForRound(i)}
                      </div>
                    )}
                    {gameData.roundWinners && gameData.roundWinners[i] && (
                      <div className="small text-warning mt-1">
                        <i className="bi bi-trophy-fill me-1"></i>
                        Farchet {gameData.roundWinners[i]}
                      </div>
                    )}
                  </th>
                ))}
                <th className="text-center fw-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => {
                // Format players as a string
                const playersStr = team.players && team.players.length > 0 
                  ? team.players.join(' & ') 
                  : team.name;
                
                return (
                  <tr key={index}>
                    <td className="fw-medium">
                      {playersStr}
                      <div className="small text-muted">
                        {team.name}
                      </div>
                    </td>
                    {Array.from({ length: maxRounds }, (_, roundIndex) => (
                      <td key={roundIndex} className="text-center">
                        {team.scores[roundIndex] !== undefined ? team.scores[roundIndex] : '–'}
                      </td>
                    ))}
                    <td className="text-center fw-bold bg-primary text-white">
                      {team.totalScore || team.scores.reduce((a, b) => a + b, 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Round Win Statistics */}
        {renderWinStats()}
      </div>
    );
  }
};

export default GameDetails;