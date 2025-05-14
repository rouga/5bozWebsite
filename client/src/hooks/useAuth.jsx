import { useEffect, useState } from 'react';

export default function useAuth() {
  const [user, setUser] = useState(); // null = unknown, false = guest, object = logged in

  useEffect(() => {
    fetch('http://192.168.0.12:5000/api/me', {
        credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          setUser({ id: data.userId, username: data.username });
        } else {
          setUser(false);
        }
      });
  }, []);
  return [user, setUser];
}