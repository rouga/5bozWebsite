import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../src/hooks/useAuth';

export default function LoginPage({ refreshUser }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [status, setStatus] = useState(null);
  const [_, setUser] = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    
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
        
        // Get user info after successful login
        try {
          const userRes = await fetch('http://192.168.0.12:5000/api/me', {
            credentials: 'include'
          });
          
          const userData = await userRes.json();
          
          if (userData.loggedIn) {
            console.log("User logged in:", userData);
            
            // Update user state with the logged-in user data
            setUser({ 
              id: userData.userId, 
              username: userData.username 
            });
            
            // Call the refreshUser function passed from App
            if (refreshUser) {
              await refreshUser();
            }
            
            // Redirect to homepage after a short delay
            setTimeout(() => {
              navigate('/');
            }, 500);
          }
        } catch (userErr) {
          console.error("Failed to fetch user data:", userErr);
        }
      } else {
        setStatus({ type: 'error', message: data.error || 'Login failed' });
      }
    } catch (err) {
      console.error('Login error:', err);
      setStatus({ type: 'error', message: 'Network error. Try again later.' });
    }
    
    // Clear password field
    setForm(prev => ({ ...prev, password: '' }));
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
          <input 
            type="text" 
            className="form-control" 
            id="username"
            name="username" 
            value={form.username} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input 
            type="password" 
            className="form-control" 
            id="password"
            name="password" 
            value={form.password} 
            onChange={handleChange} 
            required 
          />
        </div>

        <button type="submit" className="btn btn-primary">Login</button>
      </form>
    </div>
  );
}