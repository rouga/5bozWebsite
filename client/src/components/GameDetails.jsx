// client/src/components/GameDetails.jsx
import React from 'react';

const GameDetails = ({ game }) => {
  if (!game || !game.game_data) return null;
  
  const gameData = typeof game.game_data === 'string' ? JSON.parse(game.game_data) : game.game_data;
  
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
                      {player.scores[roundIndex] || '–'}
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
                  <th key={i} className="text-center fw-semibold">R{i + 1}</th>
                ))}
                <th className="text-center fw-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr key={index}>
                  <td className="fw-medium">{team.name}</td>
                  {Array.from({ length: maxRounds }, (_, roundIndex) => (
                    <td key={roundIndex} className="text-center">
                      {team.scores[roundIndex] || '–'}
                    </td>
                  ))}
                  <td className="text-center fw-bold bg-primary text-white">
                    {team.totalScore || team.scores.reduce((a, b) => a + b, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
};

export default GameDetails;