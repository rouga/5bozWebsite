import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [status, setStatus] = useState(null);
const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://192.168.0.12:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include'
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: data.message });
        navigate('/', { state: { welcome: `Bienvenue, ${form.username}!` } });
      } else {
        setStatus({ type: 'error', message: data.error || 'Login failed' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error. Try again later.' });
    }
    setForm({ ...form,  password: ''});
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="container mt-5">
      <h2>Login</h2>
      {status?.type === 'success' && (
        <div className="alert alert-success">{status.message}</div>
      )}
      {status?.type === 'error' && (
        <div className="alert alert-danger">{status.message}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">Username</label>
          <input type="text" className="form-control" name="username" value={form.username} onChange={handleChange} required />
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input type="password" className="form-control" name="password" value={form.password} onChange={handleChange} required />
        </div>

        <button type="submit" className="btn btn-primary">Login</button>
      </form>
    </div>
  );
}