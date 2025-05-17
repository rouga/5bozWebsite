// client/src/games/rami/hooks/useGameHistory.js

import { useState, useEffect } from 'react';
import { gameAPI } from '../../../utils/api';

/**
 * Custom hook to manage game history data
 * @param {number} initialLimit - Number of games to load per page
 */
export default function useGameHistory(initialLimit = 5) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedGame, setExpandedGame] = useState(null);
  const scoresPerPage = initialLimit;

  // Load initial data on mount
  useEffect(() => {
    fetchScores();
  }, []);

  // Load more scores when page changes
  useEffect(() => {
    if (page > 1) {
      fetchScores();
    }
  }, [page]);

  /**
   * Fetch game scores from the API
   */
  const fetchScores = async () => {
    try {
      setLoading(true);
      const data = await gameAPI.getScores(page, scoresPerPage);
      
      if (data.length < scoresPerPage) {
        setHasMore(false);
      }
      
      setScores(prev => page === 1 ? data : [...prev, ...data]);
      setError(null);
    } catch (err) {
      console.error('Error fetching scores:', err);
      setError('Failed to load games. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh game history data (reset to page 1)
   */
  const refreshScores = () => {
    setPage(1);
    setHasMore(true);
    fetchScores();
  };

  /**
   * Load more scores (increment page)
   */
  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  /**
   * Toggle expanded view for a game
   * @param {string|number} gameId - ID of the game to toggle
   */
  const toggleExpanded = (gameId) => {
    setExpandedGame(expandedGame === gameId ? null : gameId);
  };

  /**
   * Get detailed information about a game
   * @param {Object} game - Game object from API
   * @returns {Object|null} - Game details object or null
   */
  const getGameDetails = (game) => {
    if (game.type === 'chkan' && game.game_data) {
      const gameData = typeof game.game_data === 'string' ? JSON.parse(game.game_data) : game.game_data;
      return {
        rounds: gameData.currentRound - 1,
        players: gameData.players?.map(p => `${p.name}: ${p.scores.reduce((a, b) => a + b, 0)}`).join(', ')
      };
    } else if (game.game_data) {
      const gameData = typeof game.game_data === 'string' ? JSON.parse(game.game_data) : game.game_data;
      return {
        rounds: gameData.currentRound - 1,
        teams: `${gameData.teams?.[0]?.name}: ${gameData.teams?.[0]?.scores?.reduce((a, b) => a + b, 0) || game.score1}, ${gameData.teams?.[1]?.name}: ${gameData.teams?.[1]?.scores?.reduce((a, b) => a + b, 0) || game.score2}`
      };
    }
    return null;
  };

  return {
    scores,
    loading,
    error,
    hasMore,
    page,
    expandedGame,
    fetchScores,
    refreshScores,
    loadMore,
    toggleExpanded,
    getGameDetails
  };
}