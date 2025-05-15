import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../src/hooks/useAuth';

export default function RamiPage() {
  const [user] = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    team1: '',
    team2: '',
    score1: '',
    score2: ''
  });

  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  
  // History state
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scoresPerPage = 10;

  // Fetch scores on component mount
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://192.168.0.12:5000/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include'
      });

      if (res.ok) {
        setStatus('success');
        setForm({ team1: '', team2: '', score1: '', score2: '' });
        setShowForm(false); // Hide form after successful submission
        
        // Refresh the scores list
        setPage(1);
        setHasMore(true);
        fetchScores();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }

    // Hide the alert after 3 seconds
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="container mt-2">
      <div className="row justify-content-center">
        <div className="col-md-10 pb-4">
          {/* Score Entry Section */}
          <div className="card shadow mb-4">
            <div className="card-header bg-light">
              <h2 className="mb-0">
                <span className="me-2">♠️</span>
                Rami Scores
              </h2>
            </div>
            <div className="card-body">
              {status === 'success' && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  ✅ Score submitted successfully!
                </div>
              )}

              {status === 'error' && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  ❌ Failed to submit score. Please try again.
                </div>
              )}

              {user ? (
                <div>
                  {!showForm ? (
                    <div className="text-center">
                      <p className="text-muted mb-3">Ready to add a new Rami score?</p>
                      <button 
                        className="btn btn-primary btn-lg"
                        onClick={() => setShowForm(true)}
                      >
                        <span className="me-2">+</span>
                        Add New Score
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h4 className="mb-0">Add New Rami Score</h4>
                        <button 
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setShowForm(false)}
                        >
                          Cancel
                        </button>
                      </div>
                      
                      <form onSubmit={handleSubmit} className="row g-3">
                        <div className="col-md-6">
                          <label htmlFor="team1" className="form-label">Team 1</label>
                          <input
                            type="text"
                            className="form-control"
                            id="team1"
                            name="team1"
                            value={form.team1}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        <div className="col-md-6">
                          <label htmlFor="score1" className="form-label">Score 1</label>
                          <input
                            type="number"
                            className="form-control"
                            id="score1"
                            name="score1"
                            value={form.score1}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        <div className="col-md-6">
                          <label htmlFor="team2" className="form-label">Team 2</label>
                          <input
                            type="text"
                            className="form-control"
                            id="team2"
                            name="team2"
                            value={form.team2}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        <div className="col-md-6">
                          <label htmlFor="score2" className="form-label">Score 2</label>
                          <input
                            type="number"
                            className="form-control"
                            id="score2"
                            name="score2"
                            value={form.score2}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        <div className="col-12 mt-3">
                          <button type="submit" className="btn btn-primary me-2">
                            Submit Score
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline-secondary"
                            onClick={() => setShowForm(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="mb-3">
                    <i className="bi bi-lock-fill text-muted" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h5 className="text-muted">Login Required</h5>
                  <p className="text-muted mb-3">
                    You need to be logged in to add new Rami scores.
                  </p>
                  <Link to="/login" className="btn btn-primary">
                    Login to Add Scores
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* History Section */}
          <div className="card shadow">
            <div className="card-header bg-light">
              <h3 className="mb-1">
                <span className="me-2">📋</span>
                Historique Complet
              </h3>
            </div>
            <div className="card-body">
              {error ? (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              ) : scores.length === 0 && !loading ? (
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