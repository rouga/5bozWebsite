// This is a partial refactor of RamiPage.jsx focusing on the duplicated components
// The formatGameResult function would be replaced with the GameCard component

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../src/hooks/useAuth';
import { 
  GameCard, 
  LoadingSpinner, 
  LoadingOverlay, 
  StatusAlert, 
  PageHeader, 
  SectionCard, 
  EmptyState,
  GameTypeCard,
  FormInput
} from '../src/components';

export default function RamiPage() {
  // ... (keeping all the same state and effect logic as before)
  const [user] = useAuth();
  const [gameState, setGameState] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingActiveGame, setLoadingActiveGame] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [gameType, setGameType] = useState('');
  const [roundScores, setRoundScores] = useState({});
  const [roundInputError, setRoundInputError] = useState(null);
  const [status, setStatus] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [numberOfPlayers, setNumberOfPlayers] = useState(3);
  const scoresPerPage = 5;

  // ... (keeping all the existing useEffect hooks and functions)

  // Updated formatGameResult function - replace with GameCard component
  const renderGameCards = () => (
    <div className="row g-3">
      {scores.map(game => (
        <div key={game.id} className="col-12 col-md-6 col-lg-4">
          <GameCard game={game} />
        </div>
      ))}
    </div>
  );

  // Game type selection section with GameTypeCard
  const renderGameSetup = () => {
    if (!gameType) {
      return (
        <div className="text-center">
          <h3 className="mb-4 fw-bold text-dark">Choose Game Type</h3>
          <div className="row justify-content-center g-4">
            <div className="col-12 col-md-6 col-lg-5">
              <GameTypeCard
                title="Chkan"
                icon="🎯"
                description="Individual play"
                onClick={() => initializeGame('chkan', numberOfPlayers)}
              >
                {/* Player count selection */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Number of Players</label>
                  <select 
                    className="form-select form-select-sm w-auto mx-auto"
                    value={numberOfPlayers}
                    onChange={(e) => setNumberOfPlayers(parseInt(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value={2}>2 Players</option>
                    <option value={3}>3 Players</option>
                    <option value={4}>4 Players</option>
                  </select>
                </div>
                
                <div className="small text-muted mb-3">
                  <i className="bi bi-info-circle me-1"></i>
                  Winners: Players below 701 points
                </div>
                <button className="btn btn-primary btn-lg">
                  <i className="bi bi-play-circle me-2"></i>
                  Start Chkan Game
                </button>
              </GameTypeCard>
            </div>
            <div className="col-12 col-md-6 col-lg-5">
              <GameTypeCard
                title="S7ab"
                icon="🤝"
                description="Team play (2 teams)"
                onClick={() => initializeGame('s7ab')}
              >
                <div className="small text-muted mb-3">
                  <i className="bi bi-info-circle me-1"></i>
                  Winner: Team with lowest total score
                </div>
                <button className="btn btn-primary btn-lg">
                  <i className="bi bi-play-circle me-2"></i>
                  Start S7ab Game
                </button>
              </GameTypeCard>
            </div>
          </div>
        </div>
      );
    }

    // ... (rest of the game setup logic remains the same)
  };

  return (
    <div className="container-fluid px-3 mt-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          {/* Main Header */}
          <PageHeader
            title="Rami Game Center"
            subtitle="Track your Rami game scores and compete with friends"
            icon="♠️"
            gradient={true}
          />

          {/* Score Entry Section */}
          <SectionCard
            title="Game Management"
            subtitle="Create new games and track your progress"
            icon="bi-controller"
          >
            <StatusAlert status={status} className="mb-4" />

            {user ? (
              <div>
                {loadingActiveGame ? (
                  <LoadingSpinner text="Checking for saved game..." className="py-5" />
                ) : !showForm ? (
                  <EmptyState
                    icon="bi-controller"
                    title="Ready to start a new Rami game?"
                    description="Choose between Chkan (individual) or S7ab (team) gameplay"
                    action={
                      <button 
                        className="btn btn-primary btn-lg px-4"
                        onClick={() => setShowForm(true)}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Start New Game
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
                    Login to Start Games
                  </Link>
                }
              />
            )}
          </SectionCard>

          {/* History Section */}
          <SectionCard
            title="Recent Games"
            subtitle="Latest game results and standings"
            icon="bi-clock-history"
            actions={
              <Link to="/rami/history" className="btn btn-outline-primary">
                <i className="bi bi-clock-history me-1"></i>
                View All History
              </Link>
            }
          >
            {error ? (
              <StatusAlert status={{ type: 'error', message: error }} />
            ) : scores.length === 0 && !loading ? (
              <EmptyState
                icon="bi-calendar-x"
                title="No games recorded yet"
                description="Start playing to see your games here!"
              />
            ) : (
              <>
                {renderGameCards()}
                
                {loading && (
                  <LoadingSpinner text="Loading games..." className="my-4" />
                )}
                
                {hasMore && !loading && scores.length > 0 && (
                  <div className="text-center mt-4">
                    <button 
                      className="btn btn-outline-primary btn-lg px-4"
                      onClick={loadMore}
                    >
                      <i className="bi bi-arrow-down-circle me-2"></i>
                      Load More Games
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