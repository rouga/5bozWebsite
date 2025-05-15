import { useState } from 'react';

export default function RamiPage() {

  const [form, setForm] = useState({
    team1: '',
    team2: '',
    score1: '',
    score2: ''
  });

  const [status, setStatus] = useState(null); // 'success' | 'error' | null

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
    <div className="container mt-5">
      <h2 className="mb-4">Add New Score</h2>

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
          <button type="submit" className="btn btn-primary">Submit Score</button>
        </div>
      </form>
    </div>
  );
}