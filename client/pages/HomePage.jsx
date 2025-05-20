import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GameCard, PageHeader, SectionCard, EmptyState, LiveScoresCard } from '../src/components';
import { gameAPI } from '../src/utils/api';

function HomePage() {
  const [ramiScores, setRamiScores] = useState([]);
  const [jakiScores, setJakiScores] = useState([]);
  const [activeGames, setActiveGames] = useState([]);
  const [loadingActiveGames, setLoadingActiveGames] = useState(true);
  const [activeGamesError, setActiveGamesError] = useState(null);
  const [activeTab, setActiveTab] = useState('rami');

  useEffect(() => {
    fetchRamiScores();
    fetchJakiScores();
    fetchActiveGames();
    
    // Set up polling for active games (refresh every 30 seconds)
    const interval = setInterval(fetchActiveGames, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchRamiScores = async () => {
    try {
      const res = await fetch('http://192.168.0.12:5000/api/scores');
      if (res.ok) {
        const data = await res.json();
        setRamiScores(data);
      }
    } catch (error) {
      console.error('Error fetching Rami scores:', error);
    }
  };

  const fetchJakiScores = async () => {
    try {
      const res = await fetch('http://192.168.0.12:5000/api/jaki/games');
      if (res.ok) {
        const data = await res.json();
        setJakiScores(data);
      }
    } catch (error) {
      console.error('Error fetching Jaki scores:', error);
    }
  };

  const fetchActiveGames = async () => {
    try {
      setLoadingActiveGames(true);
      setActiveGamesError(null);
      
      // Fetch all active games from both Rami and Jaki
      const [ramiGamesResponse, jakiGamesResponse] = await Promise.all([
        fetch('http://192.168.0.12:5000/api/active-games', { credentials: 'include' }),
        fetch('http://192.168.0.12:5000/api/jaki/active-games', { credentials: 'include' })
      ]);
      
      if (!ramiGamesResponse.ok) {
        throw new Error('Failed to load Rami active games');
      }
      
      if (!jakiGamesResponse.ok) {
        throw new Error('Failed to load Jaki active games');
      }
      
      const ramiGames = await ramiGamesResponse.json();
      const jakiGames = await jakiGamesResponse.json();
      
      // Combine all active games
      const allGames = [...ramiGames, ...jakiGames];
      
      // Sort by updated time to show most recent first
      allGames.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      
      setActiveGames(allGames);
    } catch (error) {
      console.error('Error fetching active games:', error);
      setActiveGamesError('Failed to load active games');
    } finally {
      setLoadingActiveGames(false);
    }
  };

  // Get only the most recent scores for each game type
  const latestRamiScores = ramiScores.slice(0, 5);
  const latestJakiScores = jakiScores.slice(0, 5);

  const renderTabButton = (id, icon, label, active, disabled = false) => (
    <>
      <input
        type="radio"
        className="btn-check"
        name="gameOptions"
        id={id}
        autoComplete="off"
        checked={active}
        onChange={() => setActiveTab(id.replace('Option', ''))}
        disabled={disabled}
      />
      <label className={`btn ${disabled ? 'btn-outline-secondary' : 'btn-outline-primary'}`} htmlFor={id}>
        {typeof icon === 'string' && !icon.startsWith('/') ? (
          <span className="me-1">{icon}</span>
        ) : (
          <img className="me-1" src={icon} width={15} alt={label.toLowerCase()} />
        )}
        {label}
      </label>
    </>
  );

  // Render a Jaki game card
  const renderJakiGameCard = (game) => {
    const player1IsWinner = game.winner === game.player1;
    const player2IsWinner = game.winner === game.player2;
    
    // Extract authentication info from game_data
    const gameData = typeof game.game_data === 'string' ? JSON.parse(game.game_data) : game.game_data;
    const authenticatedPlayers = gameData?.authenticatedPlayers || [];
    const isPlayer1Authenticated = authenticatedPlayers.includes(game.player1);
    const isPlayer2Authenticated = authenticatedPlayers.includes(game.player2);
    
    return (
      <div className="card border-0 shadow-sm h-100">
        {/* ... existing card header ... */}
        
        <div className="row g-2">
          <div className="col-5">
            <div className={`text-center p-2 rounded ${player1IsWinner ? 'bg-success bg-opacity-10 border-success' : 'bg-light'}`}>
              <div className="fw-semibold small d-flex align-items-center justify-content-center gap-1">
                {game.player1}
                {isPlayer1Authenticated && (
                  <i className="bi bi-check-circle-fill text-success" 
                    title="Authenticated user" 
                    style={{ fontSize: '0.8rem' }}></i>
                )}
              </div>
              <div className={`h5 mb-0 ${player1IsWinner ? 'text-success' : 'text-primary'}`}>
                {game.score1}
              </div>
              {player1IsWinner && (
                <small className="text-success">
                  <i className="bi bi-trophy-fill me-1"></i>
                  Winner
                </small>
              )}
            </div>
          </div>
          <div className="col-2 d-flex align-items-center justify-content-center">
            <span className="text-muted fw-medium">VS</span>
          </div>
          <div className="col-5">
            <div className={`text-center p-2 rounded ${player2IsWinner ? 'bg-success bg-opacity-10 border-success' : 'bg-light'}`}>
              <div className="fw-semibold small d-flex align-items-center justify-content-center gap-1">
                {game.player2}
                {isPlayer2Authenticated && (
                  <i className="bi bi-check-circle-fill text-success" 
                    title="Authenticated user" 
                    style={{ fontSize: '0.8rem' }}></i>
                )}
              </div>
              <div className={`h5 mb-0 ${player2IsWinner ? 'text-success' : 'text-primary'}`}>
                {game.score2}
              </div>
              {player2IsWinner && (
                <small className="text-success">
                  <i className="bi bi-trophy-fill me-1"></i>
                  Winner
                </small>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid px-3 mt-2">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          {/* Hero Section */}
          <PageHeader
            title="Bienvenue à 5BOZ"
            subtitle={
              <>
                La plateforme pour suivre les scores de jeux entre 5boz, incluant<br/>
                <span className="fw-medium">les deux sans pate 👩🏻‍🍳, chaya7 🥵, et le célèbre Mrass ✋🏻⛔️</span>
              </>
            }
            gradient={true}
          />

          {/* Live Scores Section */}
          <SectionCard
            title="🔴 Jeux en direct"
            subtitle="Jeux en cours"
            className="mb-4"
          >
            <LiveScoresCard 
              activeGames={activeGames}
              loading={loadingActiveGames}
              error={activeGamesError}
            />
          </SectionCard>

          {/* Games Section */}
          <SectionCard
            title="Derniers Jeux"
            actions={
              <div className="btn-group" role="group" aria-label="Game tabs">
                {renderTabButton('ramiOption', '♠️', 'Rami', activeTab === 'rami')}
                {renderTabButton('jakiOption', '🎲', 'Jaki', activeTab === 'jaki')}
                {renderTabButton('ludoOption', '/ludo.png', 'Ludo', activeTab === 'ludo', true)}
              </div>
            }
          >
            {activeTab === 'rami' && (
              <div>
                {latestRamiScores.length === 0 ? (
                  <EmptyState
                    icon="bi-dice-1"
                    title="Aucun jeu enregistré"
                    description="Commencez à jouer pour voir vos parties ici!"
                    action={
                      <Link to="/rami" className="btn btn-primary">
                        <span className="me-2">♠️</span>
                        Commencer une partie
                      </Link>
                    }
                  />
                ) : (
                  <>
                    <div className="row g-3">
                      {latestRamiScores.map(game => (
                        <div key={game.id} className="col-12 col-md-6 col-lg-4">
                          <GameCard game={game} />
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-center mt-4">
                      <Link 
                        to="/rami/history" 
                        className="btn btn-outline-primary btn-lg"
                      >
                        <i className="bi bi-clock-history me-2"></i>
                        Voir tout l'historique
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {activeTab === 'jaki' && (
              <div>
                {latestJakiScores.length === 0 ? (
                  <EmptyState
                    icon="bi-dice-1"
                    title="Aucun jeu enregistré"
                    description="Commencez à jouer pour voir vos parties ici!"
                    action={
                      <Link to="/jaki" className="btn btn-primary">
                        <span className="me-2">🎲</span>
                        Commencer une partie
                      </Link>
                    }
                  />
                ) : (
                  <>
                    <div className="row g-3">
                      {latestJakiScores.map(game => (
                        <div key={game.id} className="col-12 col-md-6 col-lg-4">
                          {renderJakiGameCard(game)}
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-center mt-4">
                      <Link 
                        to="/jaki/history" 
                        className="btn btn-outline-primary btn-lg"
                      >
                        <i className="bi bi-clock-history me-2"></i>
                        Voir tout l'historique
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {activeTab === 'ludo' && (
              <EmptyState
                icon={<img src="/ludo.png" width={60} alt="ludo" className="opacity-50" />}
                title="Ludo bientôt disponible!"
                description="Cette section sera ajoutée prochainement."
              />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default HomePage;