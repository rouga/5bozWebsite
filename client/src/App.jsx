import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import HomePage from './../pages/HomePage';
import RamiPage from '../pages/RamiPage';
import JakiPage from '../pages/JakiPage';
import LudoPage from '../pages/LudoPage';
import SignupPage from '../pages/SignupPage';

function App() {
  return (
    <BrowserRouter>
    <div className="container">
      <nav className="navbar navbar-expand-md py-3 mb-4 border-bottom">
        <a href="/" className="navbar-brand d-flex align-items-center">
          <img src="/favIcon.svg" className="me-2" width={40} alt="logo" />
          <span className="fs-1">5BOZ</span>
        </a>

        {/* Toggle button for mobile */}
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible nav content */}
        <div className="collapse navbar-collapse justify-content-end" id="mainNavbar">
          <ul className="navbar-nav">
            <li className="nav-item fw-semibold"><a href="/" className="nav-link d-inline-flex align-items-center">Accueil</a></li>
            <li className="nav-item fw-semibold"><a href="/rami" className="nav-link d-inline-flex align-items-center"><span className="me-1">♠️</span> Rami</a></li>
            <li className="nav-item fw-semibold"><a href="/jaki" className="nav-link d-inline-flex align-items-center"><span className="me-1">🎲</span>  Jaki</a></li>
            <li className="nav-item fw-semibold">
              <a href="/ludo" className="nav-link d-inline-flex align-items-center">
                <img className="me-2" src="/ludo.png" width={15} alt="ludo" /> <span className="me-1">Ludo</span>
              </a>
            </li>
            <li className="nav-item fw-semibold"><a href="/login" className="nav-link">Connexion</a></li>
            <li className="nav-item fw-semibold"><a href="/signup" className="nav-link text-nowrap">Nouveau Compte</a></li>
          </ul>
        </div>
      </nav>
    </div>
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rami" element={<RamiPage />} />
          <Route path="/jaki" element={<JakiPage />} />
          <Route path="/ludo" element={<LudoPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

