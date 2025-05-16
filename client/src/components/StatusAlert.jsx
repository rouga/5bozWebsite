// client/src/components/StatusAlert.jsx
import React from 'react';

const StatusAlert = ({ status, onDismiss, className = '' }) => {
  if (!status) return null;

  const getAlertClass = () => {
    switch (status.type) {
      case 'success':
        return 'alert-success';
      case 'error':
        return 'alert-danger';
      case 'warning':
        return 'alert-warning';
      case 'info':
        return 'alert-info';
      default:
        return 'alert-primary';
    }
  };

  const getIcon = () => {
    switch (status.type) {
      case 'success':
        return 'bi-check-circle-fill';
      case 'error':
        return 'bi-exclamation-triangle-fill';
      case 'warning':
        return 'bi-exclamation-triangle';
      case 'info':
        return 'bi-info-circle-fill';
      default:
        return 'bi-info-circle';
    }
  };

  return (
    <div className={`alert ${getAlertClass()} d-flex align-items-center ${className}`}>
      <i className={`bi ${getIcon()} me-2`}></i>
      <div className="flex-grow-1">{status.message}</div>
      {onDismiss && (
        <button 
          type="button" 
          className="btn-close" 
          aria-label="Close"
          onClick={onDismiss}
        ></button>
      )}
    </div>
  );
};

export default StatusAlert;