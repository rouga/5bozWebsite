import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

function HomePage() {
  const [scores, setScores] = useState([]);

  const location = useLocation();
  const welcomeMessage = location.state?.welcome;
  const logoutMessage = location.state?.logout;

  useEffect(() => {
    fetch('http://192.168.0.12:5000/api/scores')
      .then(res => res.json())
      .then(setScores);
  }, []);

  return (
    <div>
      {welcomeMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <img src="/favIcon.svg" className="me-1" width={25} alt="bread logo" /> {welcomeMessage}
        </div>
      )}
      {logoutMessage && (
        <div className="alert alert-info alert-dismissible fade show" role="alert"> {logoutMessage} </div> )}
      <h2 className="mb-4">Game Scores</h2>
      <ul className="list-group">
        {scores.map(game => (
          <li key={game.id} className="list-group-item">
            {game.team1} {game.score1} - {game.score2} {game.team2}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default HomePage;