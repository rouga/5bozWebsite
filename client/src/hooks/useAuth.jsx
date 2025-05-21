
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../utils/api';

export default function useAuth() {
  // Using explicit states: null = loading, false = not logged in, object = logged in
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/me`, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        setUser(false);
        return;
      }
      
      const data = await res.json();
      
      if (data.loggedIn) {
        setUser({ id: data.userId, username: data.username });
      } else {
        setUser(false);
      }
    } catch (err) {
      console.error("Error fetching auth status:", err);
      setUser(false);
    }
  };

  // Function to manually update user state after login/logout
  const updateUser = (userData) => {
    setUser(userData);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return [user, updateUser, fetchUser];
}