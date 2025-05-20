import React from 'react';
import { GameTypeCard } from '../index';

const GameTypeSelector = ({ onSelectType }) => {
  return (
    <div className="text-center">
      <h3 className="mb-4 fw-bold text-dark">Choose game type</h3>
      <div className="row justify-content-center g-4">
        <div className="col-12 col-md-8 col-lg-6">
          <GameTypeCard
            title="Jaki"
            icon="🎲"
            description="Two-player game with Mrass option"
            onClick={() => onSelectType('jaki')}
          >
            <div className="small text-muted mb-3">
              <i className="bi bi-info-circle me-1"></i>
              First player to reach the target score wins. Mrass wins count as 2 points!
            </div>
            <button className="btn btn-primary btn-lg">
              <i className="bi bi-play-circle me-2"></i>
              Setup Jaki Game
            </button>
          </GameTypeCard>
        </div>
      </div>
    </div>
  );
};

export default GameTypeSelector;