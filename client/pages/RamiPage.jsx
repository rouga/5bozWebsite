  // Update player/team name
  const updateName = (index, name) => {
    setGameState(prev => {
      if (prev.type === 'chkan') {
        const newPlayers = [...prev.players];
        newPlayers[index].name = name;
        return { ...prev, players: newPlayers };
      } else {
        const newTeams = [...prev.teams];
        newTeams[index].name = name;
        return { ...prev, teams: newTeams };
      }
    });
  };

  // Update round score input
  const handleRoundScoreChange = (index, value) => {
    setRoundScores(prev => ({
      ...prev,
      [index]: value
    }));
    setRoundInputError(null);
  };

  // Add round scores
  const submitRound = () => {
    setRoundInputError(null);
    
    // Validate inputs
    const entities = gameState.type === 'chkan' ? gameState.players : gameState.teams;
    const hasEmptyScores = entities.some((_, index) => !roundScores[index] && roundScores[index] !== '0');
    
    if (hasEmptyScores) {
      setRoundInputError('Please fill in all scores for this round');
      return;
    }

    // Validate names are filled
    const hasEmptyNames = entities.some(entity => !entity.name.trim());
    if (hasEmptyNames) {
      setRoundInputError('Please fill in all player/team names before adding scores');
      return;
    }

    // Convert scores to numbers and validate
    const scores = entities.map((_, index) => {
      const score = parseInt(roundScores[index]);
      if (isNaN(score) || score < 0) {
        setRoundInputError('All scores must be valid positive numbers');
        return null;
      }
      return score;
    });

    if (scores.includes(null)) return;

    // Add scores to game state
    setGameState(prev => {
      if (prev.type === 'chkan') {
        const newPlayers = prev.players.map((player, index) => {
          const newScores = [...player.scores, scores[index]];
          return {
            ...player,
            scores: newScores,
            totalScore: newScores.reduce((sum, score) => sum + score, 0)
          };
        });
        return {
          ...prev,
          players: newPlayers,
          currentRound: prev.currentRound + 1
        };
      } else {
        const newTeams = prev.teams.map((team, index) => {
          const newScores = [...team.scores, scores[index]];
          return {
            ...team,
            scores: newScores,
            totalScore: newScores.reduce((sum, score) => sum + score, 0)
          };
        });
        return {
          ...prev,
          teams: newTeams,
          currentRound: prev.currentRound + 1
        };
      }
    });

    // Clear round scores for next round
    setRoundScores({});
  };

  // Finish game and determine winners
  const finishGame = async () => {
    if (!gameState) return;

    // Check if game has any rounds
    const entities = gameState.type === 'chkan' ? gameState.players : gameState.teams;
    if (!entities[0].scores.length) {
      setRoundInputError('Cannot finish game without any completed rounds');
      return;
    }

    let gameResult;
    
    if (gameState.type === 'chkan') {
      // In Chkan, players below 701 win
      const playersWithTotals = gameState.players.map(player => ({
        name: player.name,
        total: player.totalScore,
        scores: player.scores
      }));
      
      const winners = playersWithTotals.filter(player => player.total < 701);
      const losers = playersWithTotals.filter(player => player.total >= 701);
      
      gameResult = {
        type: 'chkan',
        winners: winners.length > 0 ? winners.map(w => w.name).join(', ') : 'No Winners',
        losers: losers.length > 0 ? losers.map(l => l.name).join(', ') : 'All Players',
        player_scores: playersWithTotals.map(p => `${p.name}: ${p.total}`).join(', '),
        game_data: gameState
      };
      
      console.log('Chkan game result:', gameResult); // Debug log
    } else {
      // In S7ab, team with lowest score wins
      const teamsWithTotals = gameState.teams.map(team => ({
        name: team.name,
        total: team.totalScore,
        scores: team.scores
      }));
      
      const sortedTeams = [...teamsWithTotals].sort((a, b) => a.total - b.total);
      
      gameResult = {
        type: 's7ab',
        team1: sortedTeams[0].name,
        score1: sortedTeams[0].total,
        team2: sortedTeams[1].name,
        score2: sortedTeams[1].total,
        game_data: gameState
      };
      
      console.log('S7ab game result:', gameResult); // Debug log
    }

    // Submit to backend
    try {
      const res = await fetch('http://192.168.0.12:5000/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameResult),
        credentials: 'include'
      });

      if (res.ok) {
        const savedGame = await res.json();
        console.log('Game saved successfully:', savedGame); // Debug log
        setStatus({ type: 'success', message: 'Game completed successfully!' });
        
        // Delete active game after completion
        await deleteActiveGame();
        
        setGameState(null);
        setShowForm(false);
        setGameType('');
        setRoundScores({});
        
        // Refresh the scores list
        setPage(1);
        setHasMore(true);
        fetchScores();
      } else {
        const errorData = await res.json();
        console.error('Save game error:', errorData); // Debug log
        setStatus({ type: 'error', message: `Failed to save game: ${errorData.error || 'Unknown error'}` });
      }
    } catch (err) {
      console.error('Network error saving game:', err);
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    }

    // Hide the alert after 3 seconds
    setTimeout(() => setStatus(null), 3000);
  };

  // Cancel game
  const cancelGame = async () => {
    // Delete active game when cancelled
    await deleteActiveGame();
    
    setGameState(null);
    setShowForm(false);
    setGameType('');
    setRoundScores({});
    setRoundInputError(null);
  };

  // Check if game has started (at least one round completed)
  const gameHasStarted = () => {
    if (!gameState) return false;
    const entities = gameState.type === 'chkan' ? gameState.players : gameState.teams;
    return entities[0] && entities[0].scores && entities[0].scores.length > 0;
  };

  // Check if all names are filled
  const allNamesProvided = () => {
    if (!gameState) return false;
    const entities = gameState.type === 'chkan' ? gameState.players : gameState.teams;
    return entities.every(entity => entity.name.trim());
  };

  // Check if current round has any scores entered
  const hasRoundScoresEntered = () => {
    return Object.keys(roundScores).length > 0 && Object.values(roundScores).some(score => score !== '');
  };

  // Render round input form
  const renderRoundInput = () => {
    if (!gameState || !allNamesProvided()) return null;

    const entities = gameState.type === 'chkan' ? gameState.players : gameState.teams;

    return (
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            <i className="bi bi-dice-3 me-2"></i>
            Round {gameState.currentRound} Scores
          </h5>
        </div>
        <div className="card-body p-4">
          {roundInputError && (
            <div className="alert alert-danger d-flex align-items-center mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {roundInputError}
            </div>
          )}
          
          <div className="row g-3">
            {entities.map((entity, index) => (
              <div key={index} className="col-12 col-sm-6 col-lg-3">
                <label className="form-label fw-semibold text-dark">{entity.name}</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-trophy"></i>
                  </span>
                  <input
                    type="number"
                    className="form-control form-control-lg"
                    value={roundScores[index] || ''}
                    onChange={(e) => handleRoundScoreChange(index, e.target.value)}
                    placeholder="Enter score"
                    min="0"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="d-flex gap-3 mt-4">
            <button 
              className="btn btn-primary btn-lg flex-grow-1"
              onClick={submitRound}
              disabled={!roundScores || Object.keys(roundScores).length === 0}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Add Round {gameState.currentRound}
            </button>
            
            {entities[0].scores.length > 0 && (
              <button className="btn btn-success btn-lg" onClick={finishGame}>
                <i className="bi bi-check-circle me-2"></i>
                Finish Game
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render score table
  const renderScoreTable = () => {
    if (!gameState) return null;
    
    const entities = gameState.type === 'chkan' ? gameState.players : gameState.teams;
    const hasScores = entities[0] && entities[0].scores && entities[0].scores.length > 0;
    
    if (!hasScores) return null;

    const maxRounds = Math.max(...entities.map(entity => entity.scores.length));

    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">
            <i className="bi bi-table me-2"></i>
            Score Progress
          </h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-dark text-white">
                <tr>
                  <th className="py-3">{gameState.type === 'chkan' ? 'Player' : 'Team'}</th>
                  {Array.from({ length: maxRounds }, (_, i) => (
                    <th key={i} className="text-center py-3">R{i + 1}</th>
                  ))}
                  <th className="text-center py-3 fw-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {entities.map((entity, index) => (
                  <tr key={index}>
                    <td className="fw-semibold py-3">{entity.name}</td>
                    {entity.scores.map((score, roundIndex) => (
                      <td key={roundIndex} className="text-center py-3">
                        <span className="badge bg-secondary">{score}</span>
                      </td>
                    ))}
                    {/* Fill empty cells if this entity has fewer rounds */}
                    {entity.scores.length < maxRounds && 
                      Array.from({ length: maxRounds - entity.scores.length }, (_, i) => (
                        <td key={`empty-${i}`} className="text-center py-3">–</td>
                      ))
                    }
                    <td className="text-center py-3">
                      <span className="badge bg-primary fs-6 fw-bold">
                        {entity.totalScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render game setup
  const renderGameSetup = () => {
    if (!gameType) {
      return (
        <div className="text-center">
          <h3 className="mb-4 fw-bold text-dark">Choose Game Type</h3>
          <div className="row justify-content-center g-4">
            <div className="col-12 col-md-6 col-lg-5">
              <div className="card border-0 shadow-sm h-100 game-type-card" onClick={() => initializeGame('chkan')} style={{ cursor: 'pointer' }}>
                <div className="card-body text-center p-4">
                  <div className="mb-3">
                    <span style={{ fontSize: '4rem' }}>🎯</span>
                  </div>
                  <h4 className="card-title fw-bold">Chkan</h4>
                  <p className="card-text text-muted">Individual play (2-4 players)</p>
                  <div className="small text-muted mb-3">
                    <i className="bi bi-info-circle me-1"></i>
                    Winners: Players below 701 points
                  </div>
                  <button className="btn btn-primary btn-lg">
                    Start Chkan Game
                  </button>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-5">
              <div className="card border-0 shadow-sm h-100 game-type-card" onClick={() => initializeGame('s7ab')} style={{ cursor: 'pointer' }}>
                <div className="card-body text-center p-4">
                  <div className="mb-3">
                    <span style={{ fontSize: '4rem' }}>🤝</span>
                  </div>
                  <h4 className="card-title fw-bold">S7ab</h4>
                  <p className="card-text text-muted">Team play (2 teams)</p>
                  <div className="small text-muted mb-3">
                    <i className="bi bi-info-circle me-1"></i>
                    Winner: Team with lowest total score
                  </div>
                  <button className="btn btn-primary btn-lg">
                    Start S7ab Game
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!gameState) return null;

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0 fw-bold text-dark">
            {gameType === 'chkan' ? '🎯 Chkan Game' : '🤝 S7ab Game'}
            {gameHasStarted() && (
              <small className="text-success ms-2">
                <i className="bi bi-cloud-check me-1"></i>
                Auto-saved
              </small>
            )}
          </h3>
          <button className="btn btn-outline-danger" onClick={cancelGame}>
            <i className="bi bi-x-circle me-1"></i>
            Cancel Game
          </button>
        </div>

        {/* Player/Team Setup - Hide after game starts */}
        {!gameHasStarted() && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-people me-2"></i>
                {gameState.type === 'chkan' ? 'Players' : 'Teams'}
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                {gameState.type === 'chkan' ? (
                  gameState.players.map((player, index) => (
                    <div key={index} className="col-12 col-sm-6 col-lg-3">
                      <label className="form-label fw-semibold">Player {index + 1}</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-person"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          placeholder={`Player ${index + 1}`}
                          value={player.name}
                          onChange={(e) => updateName(index, e.target.value)}
                          maxLength={50}
                        />
                        {gameState.players.length > 2 && (
                          <button 
                            className="btn btn-outline-danger" 
                            onClick={() => removePlayer(index)}
                            type="button"
                            title="Remove player"
                          >
                            <i className="bi bi-person-dash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  gameState.teams.map((team, index) => (
                    <div key={index} className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Team {index + 1}</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-people"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          placeholder={`Team ${index + 1}`}
                          value={team.name}
                          onChange={(e) => updateName(index, e.target.value)}
                          maxLength={50}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {gameState.type === 'chkan' && gameState.players.length < 4 && (
                <div className="mt-3">
                  <button className="btn btn-outline-primary" onClick={addPlayer}>
                    <i className="bi bi-person-plus me-2"></i>
                    Add Player
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Score Table */}
        {renderScoreTable()}

        {/* Round Input */}
        {allNamesProvided() && renderRoundInput()}

        {/* Instructions */}
        {!allNamesProvided() && (
          <div className="alert alert-info d-flex align-items-center">
            <i className="bi bi-info-circle me-2"></i>
            <div>
              <strong>Instructions:</strong> Please fill in all {gameState.type === 'chkan' ? 'player' : 'team'} names before adding scores.
              {gameHasStarted() && (
                <div className="mt-2">
                  <small>✅ Your game progress is automatically saved. You can log out and resume later!</small>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Format game result for cards
  const formatGameResult = (game) => {
    if (game.type === 'chkan') {
      return (
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="badge bg-info rounded-pill">🎯 Chkan</span>
              <small className="text-muted">
                {new Date(game.played_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </small>
            </div>
            <div className="mt-2">
              <span className="text-success fw-medium small">WINNERS</span>
              <div className="fw-semibold text-dark mt-1">
                {game.winners || 'No winners'}
              </div>
            </div>
            <div className="small text-muted mt-2 border-top pt-2">
              {game.player_scores}
            </div>
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
                  day: 'numeric'
                })}
              </small>
            </div>
            <div className="row g-2">
              <div className="col-5">
                <div className="text-center p-2 bg-light rounded">
                  <div className="fw-bold small text-muted">TEAM 1</div>
                  <div className="fw-semibold small">{game.team1}</div>
                  <div className="h6 mb-0 text-primary">{game.score1}</div>
                </div>
              </div>
              <div className="col-2 d-flex align-items-center justify-content-center">
                <span className="text-muted fw-bold">VS</span>
              </div>
              <div className="col-5">
                <div className="text-center p-2 bg-light rounded">
                  <div className="fw-bold small text-muted">TEAM 2</div>
                  <div className="fw-semibold small">{game.team2}</div>
                  <div className="h6 mb-0 text-primary">{game.score2}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="container-fluid px-3 mt-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          {/* Score Entry Section */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-bottom-0 p-4">
              <h1 className="h2 fw-bold text-dark mb-1">
                <span className="me-2">♠️</span>
                Rami Scores
              </h1>
              <p className="text-muted mb-0">Create new games and track your progress</p>
            </div>
            <div className="card-body p-4">
              {status && (
                <div className={`alert alert-${status.type === 'success' ? 'success' : status.type === 'error' ? 'danger' : 'info'} d-flex align-items-center`}>
                  <i className={`bi ${status.type === 'success' ? 'bi-check-circle-fill' : status.type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'} me-2`}></i>
                  {status.message}
                </div>
              )}

              {user ? (
                <div>
                  {loadingActiveGame ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Checking for saved game...</span>
                      </div>
                      <p className="text-muted">Checking for saved game...</p>
                    </div>
                  ) : !showForm ? (
                    <div className="text-center py-5">
                      <div className="mb-3">
                        <i className="bi bi-controller text-muted" style={{ fontSize: '4rem' }}></i>
                      </div>
                      <h4 className="text-muted mb-3">Ready to start a new Rami game?</h4>
                      <button 
                        className="btn btn-primary btn-lg px-4"
                        onClick={() => setShowForm(true)}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Start New Game
                      </button>
                    </div>
                  ) : (
                    renderGameSetup()
                  )}
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <i className="bi bi-lock-fill text-muted" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h4 className="text-muted mb-3">Login Required</h4>
                  <p className="text-muted mb-3">
                    You need to be logged in to start new Rami games.
                  </p>
                  <Link to="/login" className="btn btn-primary btn-lg">
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Login to Start Games
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* History Section */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom-0 p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="h4 fw-bold text-dark mb-1">Recent Games</h2>
                  <p className="text-muted mb-0">Latest game results</p>
                </div>
                <Link to="/rami/history" className="btn btn-outline-primary">
                  <i className="bi bi-clock-history me-1"></i>
                  View All
                </Link>
              </div>
            </div>
            <div className="card-body p-4">
              {error ? (
                <div className="alert alert-danger d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              ) : scores.length === 0 && !loading ? (
                <div className="text-center py-4">
                  <div className="mb-3">
                    <i className="bi bi-calendar-x text-muted" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h5 className="text-muted">No games recorded yet</h5>
                  <p className="text-muted">Start playing to see your games here!</p>
                </div>
              ) : (
                <>
                  <div className="row g-3">
                    {scores.map(game => (
                      <div key={game.id} className="col-12 col-md-6 col-lg-4">
                        {formatGameResult(game)}
                      </div>
                    ))}
                  </div>
                  
                  {loading && (
                    <div className="text-center my-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  )}
                  
                  {hasMore && !loading && scores.length > 0 && (
                    <div className="text-center mt-4">
                      <button 
                        className="btn btn-outline-primary btn-lg"
                        onClick={loadMore}
                      >
                        <i className="bi bi-arrow-down-circle me-2"></i>
                        Load More
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}