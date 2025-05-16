// client/pages/RamiPage.jsx - Full clean version with modifications
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../src/hooks/useAuth';
import useSocket from '../src/hooks/useSocket';
import { 
  GameCard, 
  LoadingSpinner, 
  StatusAlert, 
  PageHeader, 
  SectionCard, 
  EmptyState
} from '../src/components';
import { 
  GameTypeSelector,
  PlayerSelector,
  InvitationWaiting,
  ActiveGame
} from '../src/components/GameSetup';
import { gameAPI, handleApiError } from '../src/utils/api';

export default function RamiPage() {
  const [user] = useAuth();
  const socket = useSocket();
  
  // Game state
  const [gameState, setGameState] = useState(null);
  const [gameCreatedAt, setGameCreatedAt] = useState(null);
  const [gameTime, setGameTime] = useState(new Date()); 
  const [gameType, setGameType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [roundScores, setRoundScores] = useState({});
  const [roundInputError, setRoundInputError] = useState(null);
  const [showRoundDetails, setShowRoundDetails] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingActiveGame, setLoadingActiveGame] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  
  // Player selection state
  const [numberOfPlayers, setNumberOfPlayers] = useState(3);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [teamPlayers, setTeamPlayers] = useState({
    team1: { player1: '', player2: '' },
    team2: { player1: '', player2: '' }
  });
  const [customPlayerInputs, setCustomPlayerInputs] = useState({
    team1: { player1: false, player2: false },
    team2: { player1: false, player2: false }
  });
  const [chkanPlayers, setChkanPlayers] = useState({});
  const [chkanCustomInputs, setChkanCustomInputs] = useState({});
  
  // Invitation system state
  const [playerAcceptanceStatus, setPlayerAcceptanceStatus] = useState({});
  const [currentGameId, setCurrentGameId] = useState(null);
  const [allInvitationsAccepted, setAllInvitationsAccepted] = useState(false);
  
  // History state
  const [scores, setScores] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scoresPerPage = 5;

  // Socket event handlers - Only for invitation responses (not receiving invitations)
  useEffect(() => {
    if (!socket) return;

    socket.on('invitation_response', (data) => {
      const { gameId, playerName, teamSlot, response } = data;
      
      if (gameId === currentGameId) {
        setPlayerAcceptanceStatus(prev => ({
          ...prev,
          [teamSlot]: response === 'accepted'
        }));
        
        setStatus({
          type: response === 'accepted' ? 'success' : 'info',
          message: `${playerName} has ${response} the game invitation`
        });
        
        checkAllInvitationsAccepted(gameId);
      }
    });

    return () => {
      socket.off('invitation_response');
    };
  }, [socket, currentGameId]);

  // Time tracking for active games
  useEffect(() => {
    let interval;
    if (gameCreatedAt) {
      interval = setInterval(() => {
        setGameTime(new Date());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameCreatedAt]);

  // Initial data loading
  useEffect(() => {
    fetchScores();
    fetchRegisteredUsers();
    if (user) {
      checkForActiveGame();
    } else {
      setLoadingActiveGame(false);
    }
  }, [user]);

  // Load more scores when page changes
  useEffect(() => {
    if (page > 1) {
      fetchScores();
    }
  }, [page]);

  // Helper functions
  const initializeChkanPlayerStates = (numPlayers) => {
    const players = {};
    const customInputs = {};
    
    for (let i = 0; i < numPlayers; i++) {
      players[i] = '';
      customInputs[i] = false;
    }
    
    setChkanPlayers(players);
    setChkanCustomInputs(customInputs);
  };

  const initializeRoundScores = (state) => {
    const newRoundScores = {};
    if (state.type === 'chkan') {
      state.players.forEach((_, index) => {
        newRoundScores[`player-${index}`] = '';
      });
    } else {
      newRoundScores['team-0'] = '';
      newRoundScores['team-1'] = '';
    }
    setRoundScores(newRoundScores);
  };

  const resetGameState = () => {
    setGameState(null);
    setGameType('');
    setGameCreatedAt(null);
    setShowForm(false);
    setRoundScores({});
    setShowRoundDetails(false);
    setCurrentGameId(null);
    setPlayerAcceptanceStatus({});
    setAllInvitationsAccepted(false);
    
    // Reset S7ab states
    setTeamPlayers({
      team1: { player1: '', player2: '' },
      team2: { player1: '', player2: '' }
    });
    setCustomPlayerInputs({
      team1: { player1: false, player2: false },
      team2: { player1: false, player2: false }
    });
    
    // Reset Chkan states
    setChkanPlayers({});
    setChkanCustomInputs({});
  };

  // API calls
  const fetchRegisteredUsers = async () => {
    try {
      const response = await fetch('http://192.168.0.12:5000/api/users', {
        credentials: 'include'
      });
      if (response.ok) {
        const users = await response.json();
        setRegisteredUsers(users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchScores = async () => {
    try {
      setLoading(true);
      const data = await gameAPI.getScores(page, scoresPerPage);
      
      if (data.length < scoresPerPage) {
        setHasMore(false);
      }
      
      setScores(prev => page === 1 ? data : [...prev, ...data]);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching scores:', err);
      setError('Failed to load recent games. Please try again later.');
      setLoading(false);
    }
  };

  const checkForActiveGame = async () => {
    try {
      setLoadingActiveGame(true);
      const data = await gameAPI.getActiveGame();
      
      if (data.hasActiveGame) {
        setGameState(data.gameState);
        setGameType(data.gameType);
        setGameCreatedAt(data.createdAt);
        setShowForm(true);
        initializeRoundScores(data.gameState);
      }
    } catch (err) {
      console.error('Error checking for active game:', err);
    } finally {
      setLoadingActiveGame(false);
    }
  };

  const checkAllInvitationsAccepted = async (gameId) => {
    try {
      const response = await fetch(`http://192.168.0.12:5000/api/game-invitations/${gameId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const invitations = await response.json();
        const allAccepted = invitations.every(inv => inv.status === 'accepted');
        setAllInvitationsAccepted(allAccepted);
      }
    } catch (error) {
      console.error('Error checking invitation status:', error);
    }
  };

  const saveGameState = async (state) => {
    if (!user) return;
    
    try {
      await gameAPI.saveActiveGame(state, gameType);
    } catch (err) {
      console.error('Error saving game state:', err);
    }
  };

  // Event handlers
  const handleSelectGameType = (type) => {
    setGameType(type);
    if (type === 'chkan') {
      initializeChkanPlayerStates(numberOfPlayers);
    }
  };

  const handlePlayerSelection = (team, playerSlot, value) => {
    setTeamPlayers(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [playerSlot]: value
      }
    }));
  };

  const handleToggleCustomInput = (team, playerSlot) => {
    setCustomPlayerInputs(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [playerSlot]: !prev[team][playerSlot]
      }
    }));
    
    if (!customPlayerInputs[team][playerSlot]) {
      setTeamPlayers(prev => ({
        ...prev,
        [team]: {
          ...prev[team],
          [playerSlot]: ''
        }
      }));
    }
  };

  const handleChkanPlayerSelection = (playerIndex, value) => {
    setChkanPlayers(prev => ({
      ...prev,
      [playerIndex]: value
    }));
  };

  const handleToggleChkanCustomInput = (playerIndex) => {
    setChkanCustomInputs(prev => ({
      ...prev,
      [playerIndex]: !prev[playerIndex]
    }));
    
    if (!chkanCustomInputs[playerIndex]) {
      setChkanPlayers(prev => ({
        ...prev,
        [playerIndex]: ''
      }));
    }
  };

  const handleSendInvitations = async () => {
    setRoundInputError(null);
    
    let selectedPlayers;
    
    if (gameType === 'chkan') {
      selectedPlayers = Object.values(chkanPlayers)
        .filter(p => p.trim() !== '')
        .map(username => ({ username }));
      
      if (selectedPlayers.length !== numberOfPlayers) {
        setRoundInputError(`Veuillez sélectionner tous les ${numberOfPlayers} joueurs`);
        return;
      }
    } else {
      const team1Players = [teamPlayers.team1.player1, teamPlayers.team1.player2].filter(p => p);
      const team2Players = [teamPlayers.team2.player1, teamPlayers.team2.player2].filter(p => p);
      
      if (team1Players.length === 0 || team2Players.length === 0) {
        setRoundInputError('Veuillez sélectionner au moins un joueur pour chaque équipe');
        return;
      }
      
      selectedPlayers = [...team1Players, ...team2Players].map(username => ({ username }));
    }
    
    // Send invitations to registered players
    const gameId = await sendGameInvitations(gameType, selectedPlayers);
    if (!gameId) return;
    
    setShowForm(true);
  };

  const sendGameInvitations = async (gameType, selectedPlayers) => {
    const gameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCurrentGameId(gameId);
    
    // Determine which players are registered
    const playersWithRegistrationStatus = selectedPlayers.map((player, index) => {
      const isRegistered = registeredUsers.some(u => u.username === player.username);
      let teamSlot;
      
      if (gameType === 'chkan') {
        teamSlot = `player-${index}`;
      } else {
        const teamIndex = Math.floor(index / 2);
        const playerIndex = index % 2;
        teamSlot = `team${teamIndex + 1}-player${playerIndex + 1}`;
      }
      
      return {
        ...player,
        isRegistered,
        teamSlot
      };
    });
    
    try {
      const response = await fetch('http://192.168.0.12:5000/api/game-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          gameType,
          players: playersWithRegistrationStatus,
          gameId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Initialize acceptance status for registered players
        const initialStatus = {};
        playersWithRegistrationStatus.forEach(player => {
          if (player.isRegistered && player.username !== user?.username) {
            initialStatus[player.teamSlot] = false;
          } else if (!player.isRegistered || player.username === user?.username) {
            // Non-registered players and self are automatically "accepted"
            initialStatus[player.teamSlot] = true;
          }
        });
        
        setPlayerAcceptanceStatus(initialStatus);
        
        if (data.invitationsSent > 0) {
          setStatus({
            type: 'info',
            message: `Invitations sent to ${data.invitationsSent} player(s). Waiting for responses...`
          });
        } else {
          // No invitations needed, can start immediately
          setAllInvitationsAccepted(true);
        }
        
        return gameId;
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      setStatus({
        type: 'error',
        message: 'Failed to send game invitations'
      });
    }
    
    return null;
  };

  const handleStartGameAfterAcceptance = () => {
    let initialState;
    
    if (gameType === 'chkan') {
      const selectedPlayers = Object.values(chkanPlayers).filter(p => p.trim() !== '');
      const players = selectedPlayers.map((playerName, index) => ({
        name: playerName,
        scores: []
      }));
      
      initialState = {
        type: gameType,
        players,
        currentRound: 1
      };
    } else {
      const team1Players = [teamPlayers.team1.player1, teamPlayers.team1.player2].filter(p => p);
      const team2Players = [teamPlayers.team2.player1, teamPlayers.team2.player2].filter(p => p);
      
      initialState = {
        type: gameType,
        teams: [
          { 
            name: `Équipe 1`, 
            players: team1Players,
            scores: [] 
          },
          { 
            name: `Équipe 2`, 
            players: team2Players,
            scores: [] 
          }
        ],
        currentRound: 1
      };
    }
    
    setGameState(initialState);
    setGameCreatedAt(new Date().toISOString());
    initializeRoundScores(initialState);
    setAllInvitationsAccepted(false);
  };

  const handlePlayerNameChange = (index, newName) => {
    const updatedState = { ...gameState };
    updatedState.players[index].name = newName;
    setGameState(updatedState);
    saveGameState(updatedState);
  };

  const handleTeamNameChange = (index, newName) => {
    const updatedState = { ...gameState };
    updatedState.teams[index].name = newName;
    setGameState(updatedState);
    saveGameState(updatedState);
  };

  const handleRoundScoreChange = (key, value) => {
    setRoundScores({ ...roundScores, [key]: value });
    setRoundInputError(null);
  };

  const handleAddRound = async () => {
    setRoundInputError(null);
    
    // Validate all scores are entered
    const scores = Object.values(roundScores);
    if (scores.some(score => score === '' || score === null)) {
      setRoundInputError('Please enter scores for all players/teams');
      return;
    }

    // Validate scores are numbers
    const numericScores = scores.map(score => parseInt(score));
    if (numericScores.some(score => isNaN(score) || score < 0)) {
      setRoundInputError('Scores must be positive numbers');
      return;
    }

    const updatedState = { ...gameState };

    if (gameType === 'chkan') {
      updatedState.players.forEach((player, index) => {
        const scoreKey = `player-${index}`;
        player.scores.push(parseInt(roundScores[scoreKey]));
      });
    } else {
      updatedState.teams.forEach((team, index) => {
        const scoreKey = `team-${index}`;
        team.scores.push(parseInt(roundScores[scoreKey]));
      });
    }

    updatedState.currentRound += 1;
    setGameState(updatedState);
    
    // Clear round scores
    const clearedScores = {};
    Object.keys(roundScores).forEach(key => {
      clearedScores[key] = '';
    });
    setRoundScores(clearedScores);

    // Save the game state
    await saveGameState(updatedState);
    
    // Auto-expand round details after first round
    if (updatedState.currentRound === 2) {
      setShowRoundDetails(true);
    }
  };

  const handleFinishGame = async () => {
    try {
      setLoading(true);
      
      // Calculate final scores and determine winner(s)
      let gameData;
      
      if (gameType === 'chkan') {
        const playersWithTotals = gameState.players.map(player => ({
          ...player,
          totalScore: player.scores.reduce((sum, score) => sum + score, 0)
        }));
        
        // Sort by total score for winners determination
        const sortedPlayers = [...playersWithTotals].sort((a, b) => a.totalScore - b.totalScore);
        const winners = sortedPlayers.filter(p => p.totalScore < 701);
        const losers = sortedPlayers.filter(p => p.totalScore >= 701);
        
        gameData = {
          type: 'chkan',
          winners: winners.map(p => p.name).join(', ') || 'None',
          losers: losers.map(p => p.name).join(', ') || 'None',
          player_scores: playersWithTotals.map(p => `${p.name}: ${p.totalScore}`).join(', '),
          created_at: gameCreatedAt,
          game_data: {
            ...gameState,
            players: playersWithTotals,
            winners: winners.map(p => p.name),
            losers: losers.map(p => p.name)
          }
        };
      } else {
        // S7ab game with individual player tracking
        const teamsWithTotals = gameState.teams.map(team => ({
          ...team,
          totalScore: team.scores.reduce((sum, score) => sum + score, 0)
        }));
        
        const sortedTeams = [...teamsWithTotals].sort((a, b) => a.totalScore - b.totalScore);
        
        gameData = {
          type: 's7ab',
          team1: teamsWithTotals[0].name,
          team2: teamsWithTotals[1].name,
          score1: teamsWithTotals[0].totalScore,
          score2: teamsWithTotals[1].totalScore,
          created_at: gameCreatedAt,
          game_data: {
            ...gameState,
            teams: teamsWithTotals,
            winner: sortedTeams[0].name,
            // Store individual players for each team
            team1Players: teamsWithTotals[0].players,
            team2Players: teamsWithTotals[1].players
          }
        };
      }

      await gameAPI.saveGame(gameData);
      await gameAPI.deleteActiveGame();
      
      setStatus({ type: 'success', message: 'Game completed successfully!' });
      
      // Reset game state
      resetGameState();
      
      // Refresh scores list
      setPage(1);
      setHasMore(true);
      fetchScores();
      
      setTimeout(() => setStatus(null), 5000);
    } catch (err) {
      console.error('Error finishing game:', err);
      setStatus({ type: 'error', message: 'Failed to save game. Please try again.' });
      setTimeout(() => setStatus(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelGame = async () => {
    try {
      await gameAPI.deleteActiveGame();
      resetGameState();
      setStatus({ type: 'info', message: 'Game cancelled.' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error('Error cancelling game:', err);
    }
  };

  const handleToggleRoundDetails = () => {
    setShowRoundDetails(!showRoundDetails);
  };

  const handleGoBack = () => {
    setGameType('');
    setRoundInputError(null);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  // Determine which component to render for game setup
  const renderGameSetup = () => {
    // If we have a game state, show the active game component
    if (gameState) {
      return (
        <ActiveGame
          gameType={gameType}
          gameState={gameState}
          roundScores={roundScores}
          roundInputError={roundInputError}
          showRoundDetails={showRoundDetails}
          loading={loading}
          gameCreatedAt={gameCreatedAt}
          gameTime={gameTime}
          onRoundScoreChange={handleRoundScoreChange}
          onPlayerNameChange={handlePlayerNameChange}
          onTeamNameChange={handleTeamNameChange}
          onAddRound={handleAddRound}
          onToggleRoundDetails={handleToggleRoundDetails}
          onFinishGame={handleFinishGame}
          onCancelGame={handleCancelGame}
        />
      );
    }

    // If waiting for invitations
    if (currentGameId && Object.keys(playerAcceptanceStatus).length > 0) {
      return (
        <InvitationWaiting
          gameType={gameType}
          playerAcceptanceStatus={playerAcceptanceStatus}
          chkanPlayers={chkanPlayers}
          teamPlayers={teamPlayers}
          allInvitationsAccepted={allInvitationsAccepted}
          onStartGame={handleStartGameAfterAcceptance}
          onCancel={handleCancelGame}
        />
      );
    }

    // If game type is selected but no game state yet
    if (gameType) {
      return (
        <PlayerSelector
          gameType={gameType}
          numberOfPlayers={numberOfPlayers}
          registeredUsers={registeredUsers}
          teamPlayers={teamPlayers}
          setTeamPlayers={setTeamPlayers}
          customPlayerInputs={customPlayerInputs}
          setCustomPlayerInputs={setCustomPlayerInputs}
          chkanPlayers={chkanPlayers}
          setChkanPlayers={setChkanPlayers}
          chkanCustomInputs={chkanCustomInputs}
          setChkanCustomInputs={setChkanCustomInputs}
          playerAcceptanceStatus={playerAcceptanceStatus}
          onPlayerSelection={handlePlayerSelection}
          onToggleCustomInput={handleToggleCustomInput}
          onChkanPlayerSelection={handleChkanPlayerSelection}
          onToggleChkanCustomInput={handleToggleChkanCustomInput}
          error={roundInputError}
          onGoBack={handleGoBack}
          onSendInvitations={handleSendInvitations}
        />
      );
    }

    // Default: show game type selector
    return (
      <GameTypeSelector
        numberOfPlayers={numberOfPlayers}
        setNumberOfPlayers={setNumberOfPlayers}
        onSelectType={handleSelectGameType}
      />
    );
  };

  return (
    <div className="container-fluid px-3 mt-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          {/* Main Header */}
          <PageHeader
            title="Section Rami"
            subtitle="Créez et suivez les scores de jeu Rami entre 5boz"
            icon="♠️"
            gradient={true}
          />

          {/* Score Entry Section */}
          <SectionCard
            title="Gestion des jeux"
            subtitle="Créez de nouveaux jeux"
            icon="bi-controller"
          >
            <StatusAlert status={status} className="mb-4" />

            {user ? (
              <div>
                {loadingActiveGame ? (
                  <LoadingSpinner text="Vérification de la partie sauvegardée..." className="py-5" />
                ) : !showForm ? (
                  <EmptyState
                    icon="bi-controller"
                    title="Prêt à commencer une nouvelle partie de Rami ?"
                    description="Choisissez entre Chkan (individuel) ou S7ab (équipe)"
                    action={
                      <button 
                        className="btn btn-primary btn-lg px-4"
                        onClick={() => setShowForm(true)}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Démarrer le jeu
                      </button>
                    }
                  />
                ) : (
                  renderGameSetup()
                )}
              </div>
            ) : (
              <EmptyState
                icon="bi-lock-fill"
                title="Login Required"
                description="You need to be logged in to start new Rami games and save your progress."
                action={
                  <Link to="/login" className="btn btn-primary btn-lg">
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Connectez-vous pour démarrer les jeux
                  </Link>
                }
              />
            )}
          </SectionCard>

          {/* History Section */}
          <SectionCard
            title="Jeux récents"
            subtitle="Derniers résultats et classements des matchs"
            icon="bi-clock-history"
            actions={
              <Link to="/rami/history" className="btn btn-outline-primary">
                <i className="bi bi-clock-history me-1"></i>
                Voir tout l'historique
              </Link>
            }
          >
            {error ? (
              <StatusAlert status={{ type: 'error', message: error }} />
            ) : scores.length === 0 && !loading ? (
              <EmptyState
                icon="bi-calendar-x"
                title="Aucune partie ajoutée pour le moment"
                description="Commencez à jouer pour voir vos jeux ici !"
              />
            ) : (
              <>
                <div className="row g-3">
                  {scores.map(game => (
                    <div key={game.id} className="col-12 col-md-6 col-lg-4">
                      <GameCard game={game} />
                    </div>
                  ))}
                </div>
                
                {loading && (
                  <LoadingSpinner text="Chargement des parties..." className="my-4" />
                )}
                
                {hasMore && !loading && scores.length > 0 && (
                  <div className="text-center mt-4">
                    <button 
                      className="btn btn-outline-primary btn-lg px-4"
                      onClick={loadMore}
                    >
                      <i className="bi bi-arrow-down-circle me-2"></i>
                      Charger plus de parties
                    </button>
                  </div>
                )}
              </>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}