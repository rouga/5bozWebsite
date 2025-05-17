// client/src/games/rami/services/ramiApi.js

import { gameAPI, handleApiError } from '../../../utils/api';

/**
 * Game-specific API functions for Rami games
 */
const ramiApi = {
  /**
   * Saves a completed game to the database
   * @param {string} gameType - 'chkan' or 's7ab'
   * @param {Object} gameState - Current game state
   * @param {string} gameCreatedAt - ISO string of when the game was created
   * @returns {Promise<Object>} - API response
   */
  saveCompletedGame: async (gameType, gameState, gameCreatedAt) => {
    try {
      // Prepare the game data based on the game type
      let gameData;
      
      if (gameType === 'chkan') {
        const playersWithTotals = gameState.players.map(player => ({
          ...player,
          totalScore: player.scores.reduce((sum, score) => sum + score, 0)
        }));
        
        // Sort by total score for winners determination
        const sortedPlayers = [...playersWithTotals].sort((a, b) => a.totalScore - b.totalScore);
        const winners = sortedPlayers.filter(p => p.totalScore < 701);
        const losers = sortedPlayers.filter(p => p.totalScore >= 701);
        
        gameData = {
          type: 'chkan',
          winners: winners.map(p => p.name).join(', ') || 'None',
          losers: losers.map(p => p.name).join(', ') || 'None',
          player_scores: playersWithTotals.map(p => `${p.name}: ${p.totalScore}`).join(', '),
          created_at: gameCreatedAt,
          game_data: {
            ...gameState,
            players: playersWithTotals,
            winners: winners.map(p => p.name),
            losers: losers.map(p => p.name)
          }
        };
      } else {
        // S7ab game
        const teamsWithTotals = gameState.teams.map(team => ({
          ...team,
          totalScore: team.scores.reduce((sum, score) => sum + score, 0)
        }));
        
        const sortedTeams = [...teamsWithTotals].sort((a, b) => a.totalScore - b.totalScore);
        
        gameData = {
          type: 's7ab',
          team1: teamsWithTotals[0].name,
          team2: teamsWithTotals[1].name,
          score1: teamsWithTotals[0].totalScore,
          score2: teamsWithTotals[1].totalScore,
          created_at: gameCreatedAt,
          game_data: {
            ...gameState,
            teams: teamsWithTotals,
            winner: sortedTeams[0].name,
            // Store individual players for each team
            team1Players: teamsWithTotals[0].players,
            team2Players: teamsWithTotals[1].players
          }
        };
      }

      // Save the game and clear active game
      const result = await gameAPI.saveGame(gameData);
      await gameAPI.deleteActiveGame();
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error saving completed game:', error);
      return {
        success: false,
        error: error.message || 'Failed to save game'
      };
    }
  },
  
  /**
   * Validates round scores input
   * @param {Object} roundScores - Object with scores keyed by player/team
   * @returns {Object} - Validation result with isValid and error properties
   */
  validateRoundScores: (roundScores) => {
    // Check if all scores are entered
    const scores = Object.values(roundScores);
    if (scores.some(score => score === '' || score === null)) {
      return { 
        isValid: false, 
        error: 'Please enter scores for all players/teams' 
      };
    }

    // Validate scores are positive numbers
    const numericScores = scores.map(score => parseInt(score));
    if (numericScores.some(score => isNaN(score) || score < 0)) {
      return { 
        isValid: false, 
        error: 'Scores must be positive numbers' 
      };
    }

    return { isValid: true };
  },

  /**
   * Calculates team scores from game state
   * @param {Object} gameState - Current game state
   * @returns {Array} - Array of team scores
   */
  calculateTeamScores: (gameState) => {
    if (!gameState || !gameState.teams) return [];
    
    return gameState.teams.map(team => ({
      name: team.name,
      players: team.players || [],
      totalScore: team.scores.reduce((sum, score) => sum + score, 0),
      rounds: team.scores.length
    }));
  },

  /**
   * Calculates player scores from game state
   * @param {Object} gameState - Current game state
   * @returns {Array} - Array of player scores
   */
  calculatePlayerScores: (gameState) => {
    if (!gameState || !gameState.players) return [];
    
    return gameState.players.map(player => ({
      name: player.name,
      totalScore: player.scores.reduce((sum, score) => sum + score, 0),
      rounds: player.scores.length,
      isWinner: player.scores.reduce((sum, score) => sum + score, 0) < 701
    }));
  }
};

export default ramiApi;