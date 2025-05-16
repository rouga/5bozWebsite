// client/src/hooks/useStatus.jsx
import { useState } from 'react';

export default function useStatus() {
  const [status, setStatus] = useState(null);

  const showStatus = (type, message, duration = 3000) => {
    setStatus({ type, message });
    
    if (duration > 0) {
      setTimeout(() => {
        setStatus(null);
      }, duration);
    }
  };

  const showSuccess = (message, duration) => showStatus('success', message, duration);
  const showError = (message, duration) => showStatus('error', message, duration);
  const showWarning = (message, duration) => showStatus('warning', message, duration);
  const showInfo = (message, duration) => showStatus('info', message, duration);

  const clearStatus = () => setStatus(null);

  return {
    status,
    showStatus,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearStatus
  };
}