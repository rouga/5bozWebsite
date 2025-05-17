// client/pages/RamiPage.jsx (refactored)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../src/hooks/useAuth';
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

// Import our custom hooks
import useRamiGame from '../src/games/rami/hooks/useRamiGame';
import useGameHistory from '../src/games/rami/hooks/useGameHistory';

export default function RamiPage() {
  const [user] = useAuth();
  
  // Use our custom hooks
  const {
    // Game state
    gameState,
    gameCreatedAt,
    gameTime,
    gameType,
    showForm,
    setShowForm,
    roundScores,
    roundInputError,
    showRoundDetails,
    
    // UI state
    loading: gameLoading,
    loadingActiveGame,
    error: gameError,
    status,
    setStatus,
    
    // Player selection state
    numberOfPlayers,
    setNumberOfPlayers,
    registeredUsers,
    teamPlayers,
    customPlayerInputs,
    chkanPlayers,
    chkanCustomInputs,
    
    // Invitation state
    playerAcceptanceStatus,
    currentGameId,
    allInvitationsAccepted,
    
    // Functions
    handleSelectGameType,
    handlePlayerSelection,
    handleToggleCustomInput,
    handleChkanPlayerSelection,
    handleToggleChkanCustomInput,
    handleSendInvitations,
    handleStartGameAfterAcceptance,
    handlePlayerNameChange,
    handleTeamNameChange,
    handleRoundScoreChange,
    handleAddRound,
    handleFinishGame,
    handleCancelGame,
    handleToggleRoundDetails,
    hasValidationErrors
  } = useRamiGame();
  
  // Use the game history hook
  const {
    scores,
    loading: historyLoading,
    error: historyError,
    hasMore,
    expandedGame,
    loadMore,
    toggleExpanded,
    getGameDetails,
    refreshScores
  } = useGameHistory(5); // Initial 5 scores per page
  
  // Callback for when game finishes to refresh scores
  const handleGameCompleted = async () => {
    const success = await handleFinishGame();
    if (success) {
      refreshScores();
    }
  };

  // Handle go back to game type selector
  const handleGoBack = () => {
    setStatus(null);
    handleSelectGameType('');
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
          loading={gameLoading}
          gameCreatedAt={gameCreatedAt}
          gameTime={gameTime}
          onRoundScoreChange={handleRoundScoreChange}
          onPlayerNameChange={handlePlayerNameChange}
          onTeamNameChange={handleTeamNameChange}
          onAddRound={handleAddRound}
          onToggleRoundDetails={handleToggleRoundDetails}
          onFinishGame={handleGameCompleted}
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
          customPlayerInputs={customPlayerInputs}
          chkanPlayers={chkanPlayers}
          chkanCustomInputs={chkanCustomInputs}
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
            {historyError ? (
              <StatusAlert status={{ type: 'error', message: historyError }} />
            ) : scores.length === 0 && !historyLoading ? (
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
                
                {historyLoading && (
                  <LoadingSpinner text="Chargement des parties..." className="my-4" />
                )}
                
                {hasMore && !historyLoading && scores.length > 0 && (
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