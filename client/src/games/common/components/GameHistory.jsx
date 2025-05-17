// client/src/games/common/components/GameHistory.jsx

import React from 'react';
import {
  LoadingSpinner,
  StatusAlert,
  EmptyState
} from '../../../components';

/**
 * Reusable game history component for all game types
 * Works with the useGameHistory hook
 */
const GameHistory = ({
  title = 'Game History',
  subtitle = 'Recent games',
  icon,
  historyHook,
  renderGameCard,
  renderGameDetails,
  emptyStateProps = {
    icon: 'bi-calendar-x',
    title: 'No games recorded yet',
    description: 'Start playing to see your game history here!'
  },
  actionButton = null,
  limit = 5,
  showAllAction = null,
  className = ''
}) => {
  const {
    scores,
    loading,
    error,
    hasMore,
    expandedGame,
    loadMore,
    toggleExpanded
  } = historyHook;

  return (
    <div className={className}>
      {/* Error display */}
      {error && (
        <StatusAlert status={{ type: 'error', message: error }} />
      )}
      
      {/* Empty state */}
      {scores.length === 0 && !loading ? (
        <EmptyState
          icon={emptyStateProps.icon}
          title={emptyStateProps.title}
          description={emptyStateProps.description}
          action={emptyStateProps.action}
        />
      ) : (
        <>
          {/* Game cards */}
          <div className="row g-3">
            {scores.map(game => (
              <div key={game.id} className="col-12 col-md-6 col-lg-4">
                <div 
                  className="card shadow-sm border-0 game-card"
                  onClick={() => toggleExpanded(game.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-body p-3">
                    {renderGameCard(game)}
                    
                    {/* Toggle button for expanded details */}
                    {renderGameDetails && (
                      <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                        <small className="text-muted">
                          <i className="bi bi-info-circle me-1"></i>
                          Click for details
                        </small>
                        <button 
                          className="btn btn-sm btn-outline-primary border-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(game.id);
                          }}
                        >
                          {expandedGame === game.id ? (
                            <>
                              <i className="bi bi-chevron-up me-1"></i>
                              Hide Details
                            </>
                          ) : (
                            <>
                              <i className="bi bi-chevron-down me-1"></i>
                              Show Details
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Expanded game details */}
                  {expandedGame === game.id && renderGameDetails && (
                    <div className="card-footer bg-light border-top-0 p-3">
                      {renderGameDetails(game)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Loading indicator */}
          {loading && (
            <LoadingSpinner text="Loading games..." className="my-4" />
          )}
          
          {/* Load more button */}
          {hasMore && !loading && scores.length > 0 && (
            <div className="text-center mt-4">
              <button 
                className="btn btn-outline-primary btn-lg px-4"
                onClick={loadMore}
              >
                <i className="bi bi-arrow-down-circle me-2"></i>
                Load More Games
              </button>
            </div>
          )}
          
          {/* Show all history action */}
          {showAllAction && scores.length >= limit && (
            <div className="text-center mt-4">
              {showAllAction}
            </div>
          )}
          
          {/* Optional action button */}
          {actionButton && (
            <div className="mt-4">
              {actionButton}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GameHistory;