import { useState, useEffect } from 'react';
import { FormInput, StatusAlert, LoadingOverlay } from '../src/components/';
import { API_BASE_URL } from '../src/utils/api';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState({
    username: '',
    loading: true,
    error: null
  });
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [status, setStatus] = useState(null);

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/me`, {
          credentials: 'include'
        });
        
        if (!res.ok) {
          setUser(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to load profile data'
          }));
          return;
        }
        
        const data = await res.json();
        
        if (data.loggedIn) {
          setUser({
            username: data.username,
            loading: false,
            error: null
          });
        } else {
          setUser(prev => ({
            ...prev,
            loading: false,
            error: 'User is not logged in'
          }));
        }
      } catch (err) {
        setUser(prev => ({
          ...prev,
          loading: false,
          error: 'Network error while loading profile'
        }));
      }
    };
    
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    
    // Password validation
    if (form.newPassword !== form.confirmNewPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }
    
    if (form.newPassword.length < 6) {
      setStatus({ type: 'error', message: 'Password should contain at least 6 characters' });
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword
        }),
        credentials: 'include'
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus({ type: 'success', message: 'Password updated successfully' });
        setForm({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
        setIsEditing(false);
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to update password' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error. Please try again later.' });
    }

    // Hide the alert after 5 seconds
    setTimeout(() => setStatus(null), 5000);
  };

  if (user.loading) {
    return <LoadingOverlay text="Loading profile..." />;
  }

  if (user.error) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <StatusAlert status={{ type: 'error', message: user.error }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-5 px-3">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8 col-xl-6">
          <div className="card border-0 shadow-lg">
            {/* Header */}
            <div className="card-header bg-primary text-white border-0 p-4">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center" 
                       style={{ width: '60px', height: '60px', fontSize: '1.8rem' }}>
                    <i className="bi bi-person-fill"></i>
                  </div>
                </div>
                <div>
                  <h2 className="h3 mb-1 fw-bold">Profile</h2>
                  <p className="mb-0 opacity-75">Manage your account settings</p>
                </div>
              </div>
            </div>

            <div className="card-body p-4">
              {/* Status Messages */}
              <StatusAlert status={status} className="mb-4" />

              {/* Profile Section */}
              <div className="row">
                <div className="col-12 col-md-4 text-center mb-4 mb-md-0">
                  <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" 
                       style={{ width: '120px', height: '120px', fontSize: '3rem' }}>
                    <i className="bi bi-person text-muted"></i>
                  </div>
                  <h3 className="h4 fw-bold">{user.username}</h3>
                  <p className="text-muted">5BOZ Player</p>
                </div>

                <div className="col-12 col-md-8">
                  <h4 className="h5 fw-bold mb-3 text-dark">Account Details</h4>
                  
                  {/* Username Display */}
                  <div className="card bg-light border-0 mb-4">
                    <div className="card-body p-3">
                      <label className="form-label fw-semibold text-muted small">USERNAME</label>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-person-badge text-primary me-2"></i>
                        <span className="h5 mb-0">{user.username}</span>
                      </div>
                    </div>
                  </div>

                  {/* Password Section */}
                  {!isEditing ? (
                    <div className="card bg-light border-0">
                      <div className="card-body p-3">
                        <label className="form-label fw-semibold text-muted small">PASSWORD</label>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <i className="bi bi-shield-lock text-primary me-2"></i>
                            <span className="text-muted">••••••••</span>
                          </div>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => setIsEditing(true)}
                          >
                            <i className="bi bi-pencil-square me-1"></i>
                            Change Password
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-light border-0">
                        <h5 className="mb-0">
                          <i className="bi bi-shield-lock me-2"></i>
                          Change Password
                        </h5>
                      </div>
                      <div className="card-body p-4">
                        <form onSubmit={handleSubmit}>
                          <FormInput
                            label="Current Password"
                            type="password"
                            name="currentPassword"
                            value={form.currentPassword}
                            onChange={handleChange}
                            placeholder="Enter current password"
                            required
                            icon="bi-lock"
                          />
                          
                          <FormInput
                            label="New Password"
                            type="password"
                            name="newPassword"
                            value={form.newPassword}
                            onChange={handleChange}
                            placeholder="Enter new password"
                            required
                            icon="bi-key"
                            helpText="At least 6 characters required"
                          />
                          
                          <FormInput
                            label="Confirm New Password"
                            type="password"
                            name="confirmNewPassword"
                            value={form.confirmNewPassword}
                            onChange={handleChange}
                            placeholder="Confirm new password"
                            required
                            icon="bi-check-circle"
                            className="mb-4"
                          />
                          
                          <div className="d-flex gap-3">
                            <button type="submit" className="btn btn-success flex-grow-1">
                              <i className="bi bi-check-circle me-2"></i>
                              Save Changes
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-outline-secondary"
                              onClick={() => {
                                setIsEditing(false);
                                setForm({
                                  currentPassword: '',
                                  newPassword: '',
                                  confirmNewPassword: ''
                                });
                                setStatus(null);
                              }}
                            >
                              <i className="bi bi-x-circle me-1"></i>
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}