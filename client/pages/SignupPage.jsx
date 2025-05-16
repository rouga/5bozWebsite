import { useState } from 'react';
import { FormInput, StatusAlert } from '../src/components';

export default function SignupPage() {
  const [form, setForm] = useState({ username: '', password: '', code: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    
    try {
      const res = await fetch('http://192.168.0.12:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: data.message });
        setForm({ username: '', password: '', code: '' });
      } else {
        setStatus({ type: 'error', message: data.error || 'Unknown error occurred' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error. Try again later.' });
    } finally {
      setLoading(false);
    }
    
    // Hide the alert after 3 seconds
    setTimeout(() => setStatus(null), 3000);
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
                <h1 className="h3 fw-bold text-dark mb-1">Create Account</h1>
                <p className="text-muted">Join the 5BOZ gaming community</p>
              </div>

              {/* Status Messages */}
              <StatusAlert status={status} className="mb-4" />

              {/* Signup Form */}
              <form onSubmit={handleSubmit}>
                <FormInput
                  label="Username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  required
                  autoComplete="username"
                  icon="bi-person"
                  size="large"
                  helpText="Max 20 characters, cannot start with a number"
                />

                <FormInput
                  label="Password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                  autoComplete="new-password"
                  icon="bi-lock"
                  size="large"
                  helpText="At least 6 characters"
                />

                <FormInput
                  label="Secret Code"
                  type="password"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="Enter invitation code"
                  required
                  autoComplete="off"
                  icon="bi-key"
                  size="large"
                  helpText="You need an invitation code to create an account"
                />

                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg w-100 mb-4"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating account...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-2"></i>
                      Create Account
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="text-center">
                <p className="text-muted mb-0">
                  Already have an account? 
                  <a href="/login" className="text-decoration-none ms-1 fw-semibold">
                    Sign in here
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