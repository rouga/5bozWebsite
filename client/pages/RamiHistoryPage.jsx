import { useState, useEffect } from 'react';

export default function RamiHistoryPage() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scoresPerPage = 10;

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://192.168.0.12:5000/api/scores?page=${page}&limit=${scoresPerPage}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch scores');
      }
      
      const data = await res.json();
      
      if (data.length < scoresPerPage) {
        setHasMore(false);
      }
      
      setScores(prev => page === 1 ? data : [...prev, ...data]);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching scores:', err);
      setError('Failed to load scores. Please try again later.');
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    if (page > 1) {
      fetchScores();
    }
  }, [page]);

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card shadow">
            <div className="card-header bg-light">
              <h2 className="mb-0">
                <span className="me-2">♠️</span>
                Historique Complet Rami
              </h2>
            </div>
            <div className="card-body">
              {scores.length === 0 && !loading ? (
                <p className="text-muted text-center">Aucun score disponible</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Équipe 1</th>
                        <th>Score</th>
                        <th>Équipe 2</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scores.map(game => (
                        <tr key={game.id}>
                          <td>{new Date(game.played_at).toLocaleDateString()}</td>
                          <td className="fw-bold">{game.team1}</td>
                          <td className="text-center">
                            <span className="badge bg-primary rounded-pill">{game.score1}</span>
                          </td>
                          <td className="fw-bold">{game.team2}</td>
                          <td className="text-center">
                            <span className="badge bg-primary rounded-pill">{game.score2}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {loading && (
                <div className="text-center my-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              
              {hasMore && !loading && scores.length > 0 && (
                <div className="text-center mt-3">
                  <button 
                    className="btn btn-outline-primary" 
                    onClick={loadMore}
                  >
                    Charger Plus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}