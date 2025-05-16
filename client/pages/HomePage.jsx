import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GameCard, PageHeader, SectionCard, EmptyState, LiveScoresCard } from '../src/components';
import { gameAPI } from '../src/utils/api';

function HomePage() {
  const [scores, setScores] = useState([]);
  const [activeGames, setActiveGames] = useState([]);
  const [loadingActiveGames, setLoadingActiveGames] = useState(true);
  const [activeGamesError, setActiveGamesError] = useState(null);
  const [activeTab, setActiveTab] = useState('rami');

  useEffect(() => {
    fetchScores();
    fetchActiveGames();
    
    // Set up polling for active games (refresh every 30 seconds)
    const interval = setInterval(fetchActiveGames, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchScores = async () => {
    try {
      const res = await fetch('http://192.168.0.12:5000/api/scores');
      if (res.ok) {
        const data = await res.json();
        setScores(data);
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
    }
  };

  const fetchActiveGames = async () => {
    try {
      setLoadingActiveGames(true);
      setActiveGamesError(null);
      const data = await gameAPI.getActiveGames();
      setActiveGames(data);
    } catch (error) {
      console.error('Error fetching active games:', error);
      setActiveGamesError('Failed to load active games');
    } finally {
      setLoadingActiveGames(false);
    }
  };

  // Get only the 5 most recent scores
  const latestScores = scores.slice(0, 5);

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

  return (
    <div className="container-fluid px-3 mt-4">
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
            title="🔴 Live Games"
            subtitle="Games currently in progress"
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
                {renderTabButton('jakiOption', '🎲', 'Jaki', activeTab === 'jaki', true)}
                {renderTabButton('ludoOption', '/ludo.png', 'Ludo', activeTab === 'ludo', true)}
              </div>
            }
          >
            {activeTab === 'rami' && (
              <div>
                {latestScores.length === 0 ? (
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
                      {latestScores.map(game => (
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
              <EmptyState
                icon="🎲"
                title="Jaki bientôt disponible!"
                description="Cette section sera ajoutée prochainement."
              />
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