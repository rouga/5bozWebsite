import { useState } from 'react';

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
  useState(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('http://192.168.0.12:5000/api/me', {
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
      const res = await fetch('http://192.168.0.12:5000/api/change-password', {
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
  };

  if (user.loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (user.error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          {user.error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h3 className="card-title mb-0">Profile</h3>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-4">
                  <div className="text-center">
                    <div className="mb-3">
                      <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <h4>{user.username}</h4>
                  </div>
                </div>
                <div className="col-md-8">
                  <h5 className="border-bottom pb-2">Account Details</h5>
                  
                  <div className="mb-3">
                    <strong>Username:</strong> {user.username}
                  </div>
                  
                  {!isEditing ? (
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => setIsEditing(true)}
                    >
                      Change Password
                    </button>
                  ) : (
                    <div className="mt-3">
                      <h5 className="border-bottom pb-2">Change Password</h5>
                      
                      {status?.type === 'success' && (
                        <div className="alert alert-success">{status.message}</div>
                      )}
                      {status?.type === 'error' && (
                        <div className="alert alert-danger">{status.message}</div>
                      )}
                      
                      <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                          <label htmlFor="currentPassword" className="form-label">Current Password</label>
                          <input 
                            type="password" 
                            className="form-control" 
                            id="currentPassword"
                            name="currentPassword" 
                            value={form.currentPassword} 
                            onChange={handleChange} 
                            required 
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="newPassword" className="form-label">New Password</label>
                          <input 
                            type="password" 
                            className="form-control" 
                            id="newPassword"
                            name="newPassword" 
                            value={form.newPassword} 
                            onChange={handleChange} 
                            required 
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="confirmNewPassword" className="form-label">Confirm New Password</label>
                          <input 
                            type="password" 
                            className="form-control" 
                            id="confirmNewPassword"
                            name="confirmNewPassword" 
                            value={form.confirmNewPassword} 
                            onChange={handleChange} 
                            required 
                          />
                        </div>
                        
                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-primary">Save Changes</button>
                          <button 
                            type="button" 
                            className="btn btn-secondary"
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
                            Cancel
                          </button>
                        </div>
                      </form>
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