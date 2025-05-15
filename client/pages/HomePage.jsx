import { useEffect, useState } from 'react';

function HomePage() {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    fetch('http://192.168.0.12:5000/api/scores')
      .then(res => res.json())
      .then(setScores);
  }, []);

  return (
    <div>
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