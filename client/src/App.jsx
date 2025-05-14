import { BrowserRouter, Routes, Route, Link, NavLink , useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import HomePage from './../pages/HomePage';
import RamiPage from '../pages/RamiPage';
import JakiPage from '../pages/JakiPage';
import LudoPage from '../pages/LudoPage';
import SignupPage from '../pages/SignupPage';
import LoginPage from '../pages/LoginPage';
import useAuth from './hooks/useAuth';

function App() {

  const [user, setUser] = useAuth();
  const collapseRef = useRef(null);
  const handleNavItemClick = () => {
    const collapse = window.bootstrap.Collapse.getInstance(collapseRef.current);
    if (collapse) collapse.hide();
  };

  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column min-vh-100">
    <div className="container">
      <nav className="navbar  navbar-expand-md py-3 mb-4 border-bottom">
        <a href="/" className="navbar-brand d-flex align-items-center">
          <img src="/favIcon.svg" className="me-2" width={40} alt="bread logo" />
          <span className="fs-1 lobster-regular title-color">5BOZ</span>
        </a>

        {/* Toggle button for mobile */}
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible nav content */}
        <div className="collapse navbar-collapse justify-content-end" id="mainNavbar">
          <ul className="navbar-nav">
            <li className="nav-item fw-semibold fs-5 me-1">
              <NavLink onClick={handleNavItemClick} to="/" end className={({ isActive }) => `nav-link d-inline-flex align-items-center title-color  ${isActive ? 'text-primary' : ''}`}>
                Accueil
              </NavLink>
            </li>
            <li className="nav-item fw-semibold fs-5 me-1">
              <NavLink onClick={handleNavItemClick}  to="/rami" className={({ isActive }) => `nav-link d-inline-flex align-items-center title-color ${isActive ? 'text-primary ' : ''}`}>
                <span className="me-1">♠️</span> Rami
              </NavLink>
            </li>
            <li className="nav-item fw-semibold fs-5 me-1">
              <NavLink onClick={handleNavItemClick} to="/jaki" className={({ isActive }) => `nav-link d-inline-flex align-items-center title-color ${isActive ? 'text-primary ' : ''}`}>
                <span className="me-1">🎲</span> Jaki
              </NavLink>
            </li>
            <li className="nav-item fw-semibold fs-5 me-1">
              <NavLink onClick={handleNavItemClick} to="/ludo" className={({ isActive }) => `nav-link d-inline-flex align-items-center title-color ${isActive ? 'text-primary ' : ''}`}>
                <img className="me-2" src="/ludo.png" width={15} alt="ludo" /> <span className="me-1">Ludo</span>
              </NavLink>
            </li>
            {user === null ? null : user ? (
              <>
              <li className="nav-item fw-semibold fs-5 me-1">
                <span className="nav-link title-color">{user.username}</span>
              </li>
              <li className="nav-item fw-semibold fs-5 me-1">
                <a href="#" className="nav-link title-color" onClick={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await fetch('http://localhost:5000/api/logout', {
                    method: 'POST',
                    credentials: 'include'
                  });
                   const data = await res.json();
                  setUser(false);
                  navigate('/', { state: { logout: '✅ Logout successful!' } });
                } catch (err) {
                  console.error('Logout failed:', err);
                  navigate('/', { state: { logout: '❌ Logout failed. Try again.' } });
                 }
                }}>Logout</a>
              </li>
              </>
          ) : (
            <>
            <li className="nav-item fw-semibold fs-5 me-1">
              <NavLink onClick={handleNavItemClick} to="/login" className={({ isActive }) => `nav-link title-color ${isActive ? 'text-primary' : ''}`}>
                Connexion
              </NavLink>
            </li>
            <li className="nav-item fw-semibold fs-5 me-1">
              <NavLink onClick={handleNavItemClick} to="/signup" className={({ isActive }) => `nav-link text-nowrap title-color ${isActive ? 'text-primary' : ''}`}>
                Nouveau Compte
              </NavLink>
            </li>
            </>
          )}
          </ul>
        </div>
      </nav>
    </div>
      <div className="container mt-4 flex-grow-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rami" element={<RamiPage />} />
          <Route path="/jaki" element={<JakiPage />} />
          <Route path="/ludo" element={<LudoPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </div>

    <footer className="bg-light text-center py-3 border-top">
      <div className="container">
        <p className="mb-0">&copy; {new Date().getFullYear()} 5BOZ. All rights reserved.</p>
      </div>
    </footer>
   </div>

  );
}

export default App;

