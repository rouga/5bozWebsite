// client/src/components/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ 
  size = 'default',
  text = 'Loading...',
  centered = true,
  className = '',
  showText = true
}) => {
  const sizeClass = size === 'small' ? 'spinner-border-sm' : '';
  const containerClass = centered ? 'text-center' : '';
  
  return (
    <div className={`${containerClass} ${className}`}>
      <div className={`spinner-border ${sizeClass} text-primary`} role="status">
        <span className="visually-hidden">{text}</span>
      </div>
      {showText && (
        <p className="text-muted mt-2 mb-0">{text}</p>
      )}
    </div>
  );
};

// Loading overlay component for full-page loading
export const LoadingOverlay = ({ text = 'Loading...' }) => (
  <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
    <LoadingSpinner text={text} />
  </div>
);

export default LoadingSpinner;