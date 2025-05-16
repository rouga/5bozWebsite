// client/src/components/GameTypeCard.jsx
import React from 'react';

const GameTypeCard = ({ 
  title, 
  icon, 
  description, 
  onClick, 
  children,
  disabled = false,
  className = ''
}) => {
  return (
    <div 
      className={`card border-0 shadow-sm h-100 game-type-card ${className}`} 
      onClick={disabled ? undefined : onClick} 
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div className="card-body text-center p-4">
        <div className="mb-3">
          <span style={{ fontSize: '4rem' }}>{icon}</span>
        </div>
        <h4 className="card-title fw-bold text-dark">{title}</h4>
        {description && <p className="card-text text-muted">{description}</p>}
        {children}
      </div>
    </div>
  );
};

export default GameTypeCard;