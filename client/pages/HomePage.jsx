import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  const [scores, setScores] = useState([]);
  const [activeTab, setActiveTab] = useState('rami');

  useEffect(() => {
    fetchScores();
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

  // Get only the 5 most recent scores
  const latestScores = scores.slice(0, 5);

  // Function to format game result for display
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
          {/* Hero Section */}
          <div className="card border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
            <div className="card-body p-4 text-center">
              <h1 className="display-4 lobster-regular title-color mb-3">Bienvenue à 5BOZ</h1>
              <p className="lead text-muted mb-0">
                La plateforme pour suivre les scores de jeux entre 5boz, incluant<br/>
                <span className="fw-medium">les deux sans pate 👩🏻‍🍳, chaya7 🥵, et le célèbre Mrass ✋🏻⛔️</span>
              </p>
            </div>
          </div>

          {/* Games Section */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom-0 p-4">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center">
                <h2 className="h4 mb-3 mb-sm-0 fw-bold text-dark">Derniers Jeux</h2>
                
                {/* Modern Tab Pills */}
                <div className="btn-group" role="group" aria-label="Game tabs">
                  <input
                    type="radio"
                    className="btn-check"
                    name="gameOptions"
                    id="ramiOption"
                    autoComplete="off"
                    checked={activeTab === 'rami'}
                    onChange={() => setActiveTab('rami')}
                  />
                  <label className="btn btn-outline-primary" htmlFor="ramiOption">
                    <span className="me-1">♠️</span> Rami
                  </label>

                  <input
                    type="radio"
                    className="btn-check"
                    name="gameOptions"
                    id="jakiOption"
                    autoComplete="off"
                    checked={activeTab === 'jaki'}
                    onChange={() => setActiveTab('jaki')}
                    disabled
                  />
                  <label className="btn btn-outline-secondary" htmlFor="jakiOption">
                    <span className="me-1">🎲</span> Jaki
                  </label>

                  <input
                    type="radio"
                    className="btn-check"
                    name="gameOptions"
                    id="ludoOption"
                    autoComplete="off"
                    checked={activeTab === 'ludo'}
                    onChange={() => setActiveTab('ludo')}
                    disabled
                  />
                  <label className="btn btn-outline-secondary" htmlFor="ludoOption">
                    <img className="me-1" src="/ludo.png" width={15} alt="ludo" /> Ludo
                  </label>
                </div>
              </div>
            </div>
            
            <div className="card-body p-4">
              {activeTab === 'rami' && (
                <div>
                  {latestScores.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="mb-3">
                        <i className="bi bi-dice-1 text-muted" style={{ fontSize: '3rem' }}></i>
                      </div>
                      <h5 className="text-muted">Aucun jeu enregistré</h5>
                      <p className="text-muted mb-3">Commencez à jouer pour voir vos parties ici!</p>
                      <Link to="/rami" className="btn btn-primary">
                        <span className="me-2">♠️</span>
                        Commencer une partie
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="row g-3">
                        {latestScores.map(game => (
                          <div key={game.id} className="col-12 col-md-6 col-lg-4">
                            {formatGameResult(game)}
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
                <div className="text-center py-5">
                  <div className="mb-3">
                    <span style={{ fontSize: '4rem' }}>🎲</span>
                  </div>
                  <h5 className="text-muted">Jaki bientôt disponible!</h5>
                  <p className="text-muted">Cette section sera ajoutée prochainement.</p>
                </div>
              )}
              
              {activeTab === 'ludo' && (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <img src="/ludo.png" width={60} alt="ludo" className="opacity-50" />
                  </div>
                  <h5 className="text-muted">Ludo bientôt disponible!</h5>
                  <p className="text-muted">Cette section sera ajoutée prochainement.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;