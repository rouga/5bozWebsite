// client/src/games/common/hooks/useGameState.js

import { useState, useEffect } from 'react';
import { gameAPI } from '../../../utils/api';

/**
 * Generic hook for managing game state across different game types
 * @param {string} gameType - Type of game (e.g., 'rami', 'jaki', 'ludo')
 * @param {Function} initializeGameState - Function to initialize game state
 * @param {Function} validateGame - Function to validate game state before saving/finishing
 */
export default function useGameState(gameType, initializeGameState, validateGame) {
  const [gameState, setGameState] = useState(null);
  const [gameCreatedAt, setGameCreatedAt] = useState(null);
  const [gameTime, setGameTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [loadingActiveGame, setLoadingActiveGame] = useState(true);
  const [error, setError] = useState(null);

  // Update game time every second if game is active
  useEffect(() => {
    let interval;
    if (gameCreatedAt) {
      interval = setInterval(() => {
        setGameTime(new Date());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameCreatedAt]);

  /**
   * Check for an active game of the specified type
   */
  const checkForActiveGame = async () => {
    try {
      setLoadingActiveGame(true);
      const data = await gameAPI.getActiveGame();
      
      if (data.hasActiveGame && data.gameType === gameType) {
        setGameState(data.gameState);
        setGameCreatedAt(data.createdAt);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`Error checking for active ${gameType} game:`, err);
      setError(`Failed to check for active game: ${err.message}`);
      return false;
    } finally {
      setLoadingActiveGame(false);
    }
  };

  /**
   * Save the current game state
   * @param {Object} state - Game state to save (optional, defaults to current state)
   */
  const saveGameState = async (state = gameState) => {
    if (!state) return false;
    
    try {
      await gameAPI.saveActiveGame(state, gameType);
      return true;
    } catch (err) {
      console.error(`Error saving ${gameType} game state:`, err);
      setError(`Failed to save game state: ${err.message}`);
      return false;
    }
  };

  /**
   * Start a new game with the provided configuration
   * @param {Object} config - Game configuration
   */
  const startGame = async (config) => {
    try {
      setLoading(true);
      
      // Initialize the game state using the provided function
      const initialState = initializeGameState(config);
      
      // Set the state and created time
      setGameState(initialState);
      setGameCreatedAt(new Date().toISOString());
      
      // Save to server
      await saveGameState(initialState);
      
      return true;
    } catch (err) {
      console.error(`Error starting ${gameType} game:`, err);
      setError(`Failed to start game: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update the game state
   * @param {Object|Function} updater - New state object or function that receives the current state and returns a new one
   */
  const updateGameState = async (updater) => {
    try {
      setLoading(true);
      
      // Apply the updater
      const newState = typeof updater === 'function' 
        ? updater(gameState)
        : updater;
      
      // Validate the new state if a validation function was provided
      if (validateGame) {
        const validationResult = validateGame(newState);
        if (!validationResult.isValid) {
          setError(validationResult.error || 'Invalid game state');
          return false;
        }
      }
      
      // Update state and save
      setGameState(newState);
      await saveGameState(newState);
      
      return true;
    } catch (err) {
      console.error(`Error updating ${gameType} game state:`, err);
      setError(`Failed to update game: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Finish the current game
   * @param {Function} finalizeGame - Function to prepare the game data for final save
   */
  const finishGame = async (finalizeGame) => {
    try {
      setLoading(true);
      
      // Validate the game state
      if (validateGame) {
        const validationResult = validateGame(gameState);
        if (!validationResult.isValid) {
          setError(validationResult.error || 'Cannot finish game - invalid state');
          return false;
        }
      }
      
      // Finalize the game data
      const gameData = finalizeGame ? finalizeGame(gameState, gameCreatedAt) : {
        type: gameType,
        game_data: gameState,
        created_at: gameCreatedAt
      };
      
      // Save the finalized game
      await gameAPI.saveGame(gameData);
      await gameAPI.deleteActiveGame();
      
      // Reset the state
      setGameState(null);
      setGameCreatedAt(null);
      
      return true;
    } catch (err) {
      console.error(`Error finishing ${gameType} game:`, err);
      setError(`Failed to finish game: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel the current game
   */
  const cancelGame = async () => {
    try {
      setLoading(true);
      await gameAPI.deleteActiveGame();
      
      // Reset the state
      setGameState(null);
      setGameCreatedAt(null);
      
      return true;
    } catch (err) {
      console.error(`Error cancelling ${gameType} game:`, err);
      setError(`Failed to cancel game: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    gameState,
    gameCreatedAt,
    gameTime,
    loading,
    loadingActiveGame,
    error,
    checkForActiveGame,
    saveGameState,
    startGame,
    updateGameState,
    finishGame,
    cancelGame,
    setGameState,
    setError
  };
}