// client/src/components/GameSetup/GameTypeSelector.jsx
import React from 'react';
import { GameTypeCard } from '../index';

const GameTypeSelector = ({ 
  numberOfPlayers, 
  setNumberOfPlayers, 
  onSelectType 
}) => {
  return (
    <div className="text-center">
      <h3 className="mb-4 fw-bold text-dark">Choisissez le type de jeu</h3>
      <div className="row justify-content-center g-4">
        <div className="col-12 col-md-6 col-lg-5">
          <GameTypeCard
            title="Chkan"
            icon="🧍‍♂️"
            description="Jeu individuel"
            onClick={() => onSelectType('chkan')}
          >
            <div className="mb-3">
              <label className="form-label fw-semibold">Nombre de joueurs</label>
              <select 
                className="form-select form-select-sm w-auto mx-auto"
                value={numberOfPlayers}
                onChange={(e) => setNumberOfPlayers(parseInt(e.target.value))}
                onClick={(e) => e.stopPropagation()}
              >
                <option value={2}>2 Joueurs</option>
                <option value={3}>3 Joueurs</option>
                <option value={4}>4 Joueurs</option>
              </select>
            </div>
            
            <div className="small text-muted mb-3">
              <i className="bi bi-info-circle me-1"></i>
              Gagnants : joueurs avec moins de 701 points
            </div>
            <button className="btn btn-primary btn-lg">
              <i className="bi bi-play-circle me-2"></i>
              Configurer partie Chkan
            </button>
          </GameTypeCard>
        </div>
        <div className="col-12 col-md-6 col-lg-5">
          <GameTypeCard
            title="S7ab"
            icon="👬"
            description="Jeu en équipe (2 équipes)"
            onClick={() => onSelectType('s7ab')}
          >
            <div className="small text-muted mb-3">
              <i className="bi bi-info-circle me-1"></i>
              Gagnant : Équipe avec le score total le plus bas
            </div>
            <button className="btn btn-primary btn-lg">
              <i className="bi bi-play-circle me-2"></i>
              Configurer partie S7ab
            </button>
          </GameTypeCard>
        </div>
      </div>
    </div>
  );
};

export default GameTypeSelector;