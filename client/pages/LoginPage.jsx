import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../src/hooks/useAuth';

export default function LoginPage({ refreshUser }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [_, setUser] = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    
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
    } finally {
      setLoading(false);
    }
    
    // Clear password field
    setForm(prev => ({ ...prev, password: '' }));
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center py-5" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <div className="row justify-content-center w-100">
        <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-4">
          <div className="card border-0 shadow-lg">
            <div className="card-body p-4 p-md-5">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="mb-3">
                  <img src="/favIcon.svg" alt="5BOZ Logo" width={60} height={60} />
                </div>
                <h1 className="h3 fw-bold text-dark mb-1">Welcome Back</h1>
                <p className="text-muted">Sign in to your 5BOZ account</p>
              </div>

              {/* Status Messages */}
              {status && (
                <div className={`alert alert-${status.type === 'success' ? 'success' : 'danger'} d-flex align-items-center mb-4`}>
                  <i className={`bi ${status.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                  {status.message}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="username" className="form-label fw-semibold">Username</label>
                  <div className="input-group input-group-lg">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-person text-muted"></i>
                    </span>
                    <input 
                      type="text" 
                      className="form-control border-start-0" 
                      id="username"
                      name="username" 
                      value={form.username} 
                      onChange={handleChange} 
                      placeholder="Enter your username"
                      required 
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="form-label fw-semibold">Password</label>
                  <div className="input-group input-group-lg">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-lock text-muted"></i>
                    </span>
                    <input 
                      type="password" 
                      className="form-control border-start-0" 
                      id="password"
                      name="password" 
                      value={form.password} 
                      onChange={handleChange} 
                      placeholder="Enter your password"
                      required 
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg w-100 mb-4"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="text-center">
                <p className="text-muted mb-0">
                  Don't have an account? 
                  <a href="/signup" className="text-decoration-none ms-1 fw-semibold">
                    Create one here
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}