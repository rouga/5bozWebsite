import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuth from './useAuth';

export default function useSocket() {
  const [user] = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (user && user.id) {
      // Connect to socket
      socketRef.current = io('http://192.168.0.12:5000', {
        withCredentials: true
      });

      // Emit user login to associate socket with user ID
      socketRef.current.emit('user_login', user.id);

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [user]);

  return socketRef.current;
}