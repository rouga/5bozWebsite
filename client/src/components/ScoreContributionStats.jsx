// client/src/components/ScoreContributionStats.jsx
import React from 'react';

const ScoreContributionStats = ({ gameData, gameType }) => {
  // Calculate score contribution statistics
  const calculateScoreStats = () => {
    let stats = [];
    
    if (gameType === 'chkan') {
      // For chkan games
      const players = gameData.players || [];
      
      stats = players.map(player => ({
        name: player.name,
        totalScore: player.scores.reduce((sum, score) => sum + score, 0),
        roundsPlayed: player.scores.length,
        scorePerRound: player.scores.length ? 
          Math.round((player.scores.reduce((sum, score) => sum + score, 0) / player.scores.length) * 10) / 10 : 0
      }));
    } else {
      // For s7ab games - use actual individual player scores
      const teams = gameData.teams || [];
      const allPlayers = [];
      
      teams.forEach((team, teamIndex) => {
        if (team.players && team.playerScores) {
          team.players.forEach((playerName, playerIndex) => {
            // Calculate total score for this player
            let totalPlayerScore = 0;
            
            team.playerScores.forEach(roundScores => {
              if (roundScores[playerIndex] !== undefined) {
                totalPlayerScore += roundScores[playerIndex];
              }
            });
            
            allPlayers.push({
              name: playerName,
              teamName: team.name,
              teamIndex: teamIndex,
              totalScore: totalPlayerScore,
              roundsPlayed: team.playerScores.length,
              scorePerRound: team.playerScores.length ? 
                Math.round((totalPlayerScore / team.playerScores.length) * 10) / 10 : 0
            });
          });
        }
      });
      
      stats = allPlayers;
    }
    
    // Sort by total score (ascending - lower is better)
    stats.sort((a, b) => a.totalScore - b.totalScore);
    
    return stats;
  };
  
  const stats = calculateScoreStats();
  
  if (stats.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-3 mb-3">
      <h6 className="text-muted mb-2">Score Statistics</h6>
      <div className="row g-2">
        {stats.map((stat, index) => {
          return (
            <div key={index} className="col-6 col-md-3">
              <div className={`text-center p-2 rounded ${index === 0 ? 'bg-success bg-opacity-10' : 'bg-light'}`}>
                <div className="fw-semibold small">
                  {stat.name}
                  {stat.teamName && <small className="d-block text-muted">{stat.teamName}</small>}
                </div>
                <div className="d-flex align-items-center justify-content-center gap-1">
                  <span className="h5 mb-0">{stat.totalScore}</span>
                  <small className="text-muted">pts</small>
                </div>
                <small className="text-muted d-block">
                  ~{stat.scorePerRound} pts/round
                </small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScoreContributionStats;