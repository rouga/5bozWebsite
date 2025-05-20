// Updated App.jsx with Jaki Game Routes
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import HomePage from './../pages/HomePage';
import RamiPage from '../pages/RamiPage';
import RamiHistoryPage from '../pages/RamiHistoryPage';
import JakiPage from '../pages/JakiPage';
import JakiHistoryPage from '../pages/JakiHistoryPage';
import LudoPage from '../pages/LudoPage';
import SignupPage from '../pages/SignupPage';
import LoginPage from '../pages/LoginPage';
import ProfilePage from '../pages/ProfilePage';
import useAuth from './hooks/useAuth';
import useSocket from './hooks/useSocket';
import { InvitationNotificationBadge } from './components';
import GlobalInvitationHandler from './components/GlobalInvitationHandler';

function App() {
  const [user, setUser, refreshUser] = useAuth();
  const socket = useSocket();
  const navCollapseRef = useRef(null);
  const navigate = useNavigate();

  const handleNavItemClick = () => {
    const collapseElement = document.getElementById('mainNavbar');
    if (collapseElement) {
      const bsCollapse = window.bootstrap?.Collapse.getInstance(collapseElement);
      if (bsCollapse) bsCollapse.hide();
    }
  };

  // Handle logout
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://192.168.0.12:5000/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUser(false); // Clear session
        navigate('/'); // Redirect to home page
      } else {
        console.error('Logout failed:', data.error);
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Debug user state changes
  useEffect(() => {
    console.log("Auth state updated:", user);
  }, [user]);

  // Render loading state while authentication is being checked
  if (user === null) {
    return <div className="d-flex justify-content-center mt-5">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Global Invitation Handler */}
      <GlobalInvitationHandler />
      
      <div className="container">
        <nav className="navbar navbar-expand-md py-3 mb-4 border-bottom">
          <a href="/" className="navbar-brand d-flex align-items-center">
            <img src="/favIcon.svg" className="me-2" width={40} alt="bread logo" />
            <span className="fs-1 lobster-regular title-color">5BOZ</span>
          </a>

          {/* Toggle button for mobile */}
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Collapsible nav content */}
          <div className="collapse navbar-collapse justify-content-end" id="mainNavbar" ref={navCollapseRef}>
            <ul className="navbar-nav">
              <li className="nav-item fw-semibold fs-5 me-1">
                <NavLink onClick={handleNavItemClick} to="/" end className={({ isActive }) => `nav-link d-inline-flex align-items-center title-color  ${isActive ? 'text-primary' : ''}`}>
                  Accueil
                </NavLink>
              </li>
              <li className="nav-item fw-semibold fs-5 me-1">
                <NavLink onClick={handleNavItemClick} to="/rami" className={({ isActive }) => `nav-link d-inline-flex align-items-center title-color position-relative ${isActive ? 'text-primary ' : ''}`}>
                  <span className="me-1">♠️</span> Rami
                  <InvitationNotificationBadge />
                </NavLink>
              </li>
              <li className="nav-item fw-semibold fs-5 me-1">
                <NavLink onClick={handleNavItemClick} to="/jaki" className={({ isActive }) => `nav-link d-inline-flex align-items-center title-color position-relative ${isActive ? 'text-primary ' : ''}`}>
                  <span className="me-1">🎲</span> Jaki
                  <InvitationNotificationBadge />
                </NavLink>
              </li>
              <li className="nav-item fw-semibold fs-5 me-1">
                <NavLink onClick={handleNavItemClick} to="/ludo" className={({ isActive }) => `nav-link d-inline-flex align-items-center title-color ${isActive ? 'text-primary ' : ''}`}>
                  <img className="me-2" src="./ludo.png" width={15} alt="ludo" /> <span className="me-1">Ludo</span>
                </NavLink>
              </li>
              
              {user ? (
                <li className="nav-item dropdown fw-semibold fs-5 me-1">
                  <a 
                    className="nav-link dropdown-toggle title-color" 
                    href="#" 
                    id="userDropdown" 
                    role="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    {user.username}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li>
                      <NavLink to="/profile" className="dropdown-item">
                        Profile
                      </NavLink>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <a className="dropdown-item" href="#" onClick={handleLogout}>
                        Logout
                      </a>
                    </li>
                  </ul>
                </li>
              ) : (
                <li className="nav-item dropdown fw-semibold fs-5 me-1">
                  <a 
                    className="nav-link dropdown-toggle title-color" 
                    href="#" 
                    id="authDropdown" 
                    role="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    Compte
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="authDropdown">
                    <li>
                      <NavLink onClick={handleNavItemClick} to="/login" className="dropdown-item">
                        Connexion
                      </NavLink>
                    </li>
                    <li>
                      <NavLink onClick={handleNavItemClick} to="/signup" className="dropdown-item">
                        Nouveau Compte
                      </NavLink>
                    </li>
                  </ul>
                </li>
              )}
            </ul>
          </div>
        </nav>
      </div>
      
      <div className="container mt-4 flex-grow-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rami" element={<RamiPage />} />
          <Route path="/rami/history" element={<RamiHistoryPage />} />
          <Route path="/jaki" element={<JakiPage />} />
          <Route path="/jaki/history" element={<JakiHistoryPage />} />
          <Route path="/ludo" element={<LudoPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage refreshUser={refreshUser} />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>

      <footer className="bg-light text-center py-3 border-top">
        <div className="container">
          <p className="mb-0">&copy; {new Date().getFullYear()} 5BOZ. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}