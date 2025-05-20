import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useAuth from './useAuth';

export default function useSocket() {
  const [user] = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    // Clear any existing timeout on cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (user && user.id) {
      // Clean up existing socket if it exists
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      // Connect to socket with retry mechanism
      const connectSocket = () => {
        try {
          socketRef.current = io('http://192.168.0.12:5000', {
            withCredentials: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000
          });

          // Connection events
          socketRef.current.on('connect', () => {
            setIsConnected(true);
            socketRef.current.emit('user_login', user.id);
          });

          socketRef.current.on('disconnect', (reason) => {
            setIsConnected(false);
          });

          // Handle connection errors with backoff
          socketRef.current.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
          });
        } catch (error) {
          console.error('Socket initialization error:', error);
        }
      };

      connectSocket();

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          setIsConnected(false);
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
    }
  }, [user]);

  return socketRef.current;
}