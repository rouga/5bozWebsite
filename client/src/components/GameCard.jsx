import React from 'react';

const GameCard = ({ game }) => {
  if (game.type === 'chkan') {
    // Parse player scores
    const playerScores = game.player_scores ? game.player_scores.split(', ') : [];
    const players = playerScores.map(scoreStr => {
      const parts = scoreStr.split(': ');
      return {
        name: parts[0],
        score: parseInt(parts[1]) || 0
      };
    });
    
    // Sort players by score (lowest first)
    players.sort((a, b) => a.score - b.score);
    
    // Determine winners (below 701)
    const winners = players.filter(p => p.score < 701);
    const hasWinners = winners.length > 0;
    
    return (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="badge bg-info rounded-pill">🎯 Chkan</span>
            <small className="text-muted">
              {new Date(game.played_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </small>
          </div>
          
          {/* Player scores grid */}
          <div className="row g-2 mb-3">
            {players.map((player, index) => {
              const isWinner = hasWinners ? player.score < 701 : index === 0;
              return (
                <div key={index} className="col-6">
                  <div className={`text-center p-2 rounded ${isWinner ? 'bg-success bg-opacity-10 border-success' : 'bg-light'}`}>
                    <div className="fw-bold small text-muted">
                      {isWinner && hasWinners ? 'WINNER' : `PLAYER ${index + 1}`}
                    </div>
                    <div className="fw-semibold small">{player.name}</div>
                    <div className={`h6 mb-0 ${isWinner ? 'text-success' : 'text-primary'}`}>
                      {player.score}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Winners summary */}
          {hasWinners && (
            <div className="border-top pt-2">
              <div className="text-center">
                <span className="text-success fw-medium small">
                  🏆 {winners.length} Winner{winners.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    // S7ab game (legacy format)
    return (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="badge bg-success rounded-pill">🤝 S7ab</span>
            <small className="text-muted">
              {new Date(game.played_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </small>
          </div>
          <div className="row g-2">
            <div className="col-5">
              <div className="text-center p-2 bg-light rounded">
                <div className="fw-bold small text-muted">TEAM 1</div>
                <div className="fw-semibold small">{game.team1}</div>
                <div className="h5 mb-0 text-primary">{game.score1}</div>
              </div>
            </div>
            <div className="col-2 d-flex align-items-center justify-content-center">
              <span className="text-muted fw-medium">VS</span>
            </div>
            <div className="col-5">
              <div className="text-center p-2 bg-light rounded">
                <div className="fw-bold small text-muted">TEAM 2</div>
                <div className="fw-semibold small">{game.team2}</div>
                <div className="h5 mb-0 text-primary">{game.score2}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default GameCard;