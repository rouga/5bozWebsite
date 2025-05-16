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

      // Wait for connection before emitting user_login
      socketRef.current.on('connect', () => {
        socketRef.current.emit('user_login', user.id);
      });

      // Handle connection errors
      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [user]);

  return socketRef.current;
}