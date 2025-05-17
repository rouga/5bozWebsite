// client/src/games/rami/utils/gameRules.js

/**
 * Utility functions for Rami game rules and validation
 */
const gameRules = {
  /**
   * Constants
   */
  CHKAN: {
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 4,
    WINNING_THRESHOLD: 701 // Player wins if score is below this
  },
  
  S7AB: {
    TEAMS: 2, // Always 2 teams
    MIN_PLAYERS_PER_TEAM: 1,
    MAX_PLAYERS_PER_TEAM: 2,
    // Lower score wins
  },

  /**
   * Check if a player has won in Chkan
   * @param {number} score - Player's score
   * @returns {boolean} - True if player has won
   */
  isChkanWinner: (score) => {
    return score < gameRules.CHKAN.WINNING_THRESHOLD;
  },

  /**
   * Determine the winners in a Chkan game
   * @param {Array} players - Array of player objects with scores
   * @returns {Array} - Array of winning player objects
   */
  getChkanWinners: (players) => {
    return players.filter(player => {
      const totalScore = Array.isArray(player.scores) 
        ? player.scores.reduce((sum, score) => sum + score, 0)
        : player.totalScore || 0;
      
      return totalScore < gameRules.CHKAN.WINNING_THRESHOLD;
    });
  },

  /**
   * Determine the winning team in S7ab
   * @param {Array} teams - Array of team objects with scores
   * @returns {Object|null} - Winning team or null if tie
   */
  getS7abWinner: (teams) => {
    if (!teams || teams.length < 2) return null;
    
    const teamScores = teams.map(team => ({
      ...team,
      totalScore: Array.isArray(team.scores) 
        ? team.scores.reduce((sum, score) => sum + score, 0)
        : team.totalScore || 0
    }));
    
    // Sort by lowest score
    teamScores.sort((a, b) => a.totalScore - b.totalScore);
    
    // Check for tie
    if (teamScores[0].totalScore === teamScores[1].totalScore) {
      return null; // Tie
    }
    
    return teamScores[0]; // Team with lowest score
  },

  /**
   * Initialize a new Chkan game
   * @param {Array} playerNames - Array of player names
   * @returns {Object} - Initial game state
   */
  createChkanGame: (playerNames) => {
    if (!Array.isArray(playerNames) || playerNames.length < gameRules.CHKAN.MIN_PLAYERS) {
      throw new Error(`Chkan requires at least ${gameRules.CHKAN.MIN_PLAYERS} players`);
    }
    
    const players = playerNames.map(name => ({
      name,
      scores: []
    }));
    
    return {
      type: 'chkan',
      players,
      currentRound: 1,
      createdAt: new Date().toISOString()
    };
  },

  /**
   * Initialize a new S7ab game
   * @param {Object} teamData - Object with team1 and team2 arrays of player names
   * @returns {Object} - Initial game state
   */
  createS7abGame: (teamData) => {
    const { team1, team2 } = teamData;
    
    if (!Array.isArray(team1) || !Array.isArray(team2)) {
      throw new Error('Both teams must be arrays');
    }
    
    if (team1.length < gameRules.S7AB.MIN_PLAYERS_PER_TEAM || 
        team2.length < gameRules.S7AB.MIN_PLAYERS_PER_TEAM) {
      throw new Error(`Each team must have at least ${gameRules.S7AB.MIN_PLAYERS_PER_TEAM} player`);
    }
    
    return {
      type: 's7ab',
      teams: [
        {
          name: 'Équipe 1',
          players: team1,
          scores: []
        },
        {
          name: 'Équipe 2',
          players: team2,
          scores: []
        }
      ],
      currentRound: 1,
      createdAt: new Date().toISOString()
    };
  },

  /**
   * Add a round of scores to a Chkan game
   * @param {Object} gameState - Current game state
   * @param {Object} roundScores - Object with scores keyed by player index
   * @returns {Object} - Updated game state
   */
  addChkanRound: (gameState, roundScores) => {
    if (!gameState || !gameState.players) {
      throw new Error('Invalid game state');
    }
    
    const updatedState = { ...gameState };
    
    updatedState.players.forEach((player, index) => {
      const scoreKey = `player-${index}`;
      const score = parseInt(roundScores[scoreKey]);
      
      if (isNaN(score)) {
        throw new Error(`Invalid score for player ${index}`);
      }
      
      player.scores.push(score);
    });
    
    updatedState.currentRound += 1;
    return updatedState;
  },

  /**
   * Add a round of scores to an S7ab game
   * @param {Object} gameState - Current game state
   * @param {Object} roundScores - Object with scores keyed by team index
   * @returns {Object} - Updated game state
   */
  addS7abRound: (gameState, roundScores) => {
    if (!gameState || !gameState.teams) {
      throw new Error('Invalid game state');
    }
    
    const updatedState = { ...gameState };
    
    updatedState.teams.forEach((team, index) => {
      const scoreKey = `team-${index}`;
      const score = parseInt(roundScores[scoreKey]);
      
      if (isNaN(score)) {
        throw new Error(`Invalid score for team ${index}`);
      }
      
      team.scores.push(score);
    });
    
    updatedState.currentRound += 1;
    return updatedState;
  },

  /**
   * Calculate duration of a game
   * @param {string} createdAt - ISO datetime string when game started
   * @param {string|Date} currentTime - Current time (optional, defaults to now)
   * @returns {string} - Formatted duration string
   */
  calculateDuration: (createdAt, currentTime = new Date()) => {
    if (!createdAt) return '';
    
    const startTime = new Date(createdAt);
    const now = currentTime instanceof Date ? currentTime : new Date(currentTime);
    const diffMs = now - startTime;
    
    if (diffMs <= 0) return '0s';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
};

export default gameRules;