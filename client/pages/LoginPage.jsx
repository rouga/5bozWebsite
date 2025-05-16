import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../src/hooks/useAuth';
import useStatus from '../src/hooks/useStatus';
import { FormInput, StatusAlert } from '../src/components';
import { authAPI, handleApiError } from '../src/utils/api';

export default function LoginPage({ refreshUser }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [_, setUser] = useAuth();
  const navigate = useNavigate();
  const { status, showSuccess, showError } = useStatus();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Login
      const loginData = await authAPI.login(form);
      showSuccess(loginData.message);
      
      // Get user info after successful login
      const userData = await authAPI.getMe();
      
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
    } catch (error) {
      handleApiError(error, (errStatus) => showError(errStatus.message));
    } finally {
      setLoading(false);
      // Clear password field
      setForm(prev => ({ ...prev, password: '' }));
    }
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
                <h1 className="h3 fw-bold text-dark mb-1">Mar7ba ya 5obza</h1>
                <p className="text-muted">Connectez-vous à votre compte 5BOZ</p>
              </div>

              {/* Status Messages */}
              <StatusAlert status={status} className="mb-4" />

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <FormInput
                  label="Nom d'utilisateur"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Entrer nom d'utilisateur"
                  required
                  autoComplete="username"
                  icon="bi-person"
                  size="large"
                />

                <FormInput
                  label="Mot de passe"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Entrer mot de passe"
                  required
                  autoComplete="current-password"
                  icon="bi-lock"
                  size="large"
                />

                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg w-100 mb-4"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Connexion...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Se connecter
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="text-center">
                <p className="text-muted mb-0">
                  Ma 3endekch compte ?
                  <a href="/signup" className="text-decoration-none ms-1 fw-semibold">
                    T3ala mena
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