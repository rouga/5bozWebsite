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
        <div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="badge bg-info me-2">Chkan</span>
            <small className="text-muted">
              {new Date(game.played_at).toLocaleDateString()}
            </small>
          </div>
          <div className="mt-1">
            <strong>Winners:</strong> {game.winners || 'No winners'}
          </div>
          <div className="small text-muted">
            {game.player_scores}
          </div>
        </div>
      );
    } else {
      // S7ab game (legacy format)
      return (
        <div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="badge bg-success me-2">S7ab</span>
            <small className="text-muted">
              {new Date(game.played_at).toLocaleDateString()}
            </small>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-1">
            <div>
              <span className="fw-bold me-2">{game.team1}</span>
              <span className="badge bg-primary rounded-pill">{game.score1}</span>
            </div>
            <span className="mx-2">vs</span>
            <div>
              <span className="badge bg-primary rounded-pill">{game.score2}</span>
              <span className="fw-bold ms-2">{game.team2}</span>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card shadow-sm mb-4">
            <div className="card-body py-2 text-center">
              <h1 className="lobster-regular title-color display-4 mb-3">Bienvenue à 5BOZ</h1>
              <p className="lead">
                La plateforme pour suivre les scores de jeux entre 5boz, incluant les deux sans pate 👩🏻‍🍳, chaya7 🥵, et le célèbre Mrass ✋🏻⛔️.
              </p>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'rami' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rami')}
                  >
                    <span className="me-1">♠️</span> Rami
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'jaki' ? 'active' : ''}`}
                    onClick={() => setActiveTab('jaki')}
                    disabled
                  >
                    <span className="me-1">🎲</span> Jaki
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'ludo' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ludo')}
                    disabled
                  >
                    <img className="me-1" src="/ludo.png" width={15} alt="ludo" /> Ludo
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {activeTab === 'rami' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="card-title mb-0">Latest Rami Games</h3>
                    <Link to="/rami/history" className="btn btn-outline-primary btn-sm">
                      Voir tout l'historique
                    </Link>
                  </div>
                  {latestScores.length === 0 ? (
                    <p className="text-muted">No games recorded yet</p>
                  ) : (
                    <div className="list-group list-group-flush">
                      {latestScores.map(game => (
                        <div key={game.id} className="list-group-item">
                          {formatGameResult(game)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'jaki' && (
                <div className="text-center py-4">
                  <p className="text-muted">Jaki scores coming soon!</p>
                </div>
              )}
              {activeTab === 'ludo' && (
                <div className="text-center py-4">
                  <p className="text-muted">Ludo scores coming soon!</p>
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