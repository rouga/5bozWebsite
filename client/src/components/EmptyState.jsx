// client/src/components/EmptyState.jsx
import React from 'react';

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action,
  className = ''
}) => {
  return (
    <div className={`text-center py-5 ${className}`}>
      {icon && (
        <div className="mb-3">
          {typeof icon === 'string' ? (
            <i className={`bi ${icon} text-muted`} style={{ fontSize: '3rem' }}></i>
          ) : (
            icon
          )}
        </div>
      )}
      <h5 className="text-muted">{title}</h5>
      {description && <p className="text-muted">{description}</p>}
      {action}
    </div>
  );
};

export default EmptyState;