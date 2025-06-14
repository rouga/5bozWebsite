// client/src/utils/api.js

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Generic API call helper
const apiCall = async (endpoint, options = {}) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    credentials: 'include',
    ...options
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Auth API calls
export const authAPI = {
  login: (credentials) => apiCall('/api/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  
  signup: (userData) => apiCall('/api/signup', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  
  logout: () => apiCall('/api/logout', { method: 'POST' }),
  
  getMe: () => apiCall('/api/me'),
  
  changePassword: (passwordData) => apiCall('/api/change-password', {
    method: 'POST',
    body: JSON.stringify(passwordData)
  })
};

// Game API calls
export const gameAPI = {
  getScores: (page = 1, limit = 10) => apiCall(`/api/scores?page=${page}&limit=${limit}`),
  
  getScoresCount: () => apiCall('/api/scores/count'),
  
  saveGame: (gameData) => apiCall('/api/scores', {
    method: 'POST',
    body: JSON.stringify(gameData)
  }),
  
  getActiveGame: () => apiCall('/api/active-game'),
  
  saveActiveGame: (gameState, gameType) => apiCall('/api/active-game', {
    method: 'POST',
    body: JSON.stringify({ gameState, gameType })
  }),
  
  deleteActiveGame: () => apiCall('/api/active-game', { method: 'DELETE' }),
  
  getActiveGames: () => apiCall('/api/active-games'),
  
  // Jaki-specific API calls
  jakiAPI: {
    getGames: (page = 1, limit = 10) => apiCall(`/api/jaki/games?page=${page}&limit=${limit}`),
    
    getActiveGame: () => apiCall('/api/jaki/active-game'),
    
    saveActiveGame: (gameState) => apiCall('/api/jaki/active-game', {
      method: 'POST',
      body: JSON.stringify({ gameState })
    }),
    
    deleteActiveGame: () => apiCall('/api/jaki/active-game', { method: 'DELETE' }),
    
    saveGame: (gameData) => apiCall('/api/jaki/games', {
      method: 'POST',
      body: JSON.stringify(gameData)
    })
  }
};

// Error handler utility
export const handleApiError = (error, setStatus) => {
  console.error('API Error:', error);
  const message = error.message || 'An unexpected error occurred';
  setStatus({ type: 'error', message });
};

export default { authAPI, gameAPI, handleApiError };