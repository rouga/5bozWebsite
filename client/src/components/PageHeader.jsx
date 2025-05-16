// client/src/components/PageHeader.jsx
import React from 'react';

const PageHeader = ({ 
  title, 
  subtitle, 
  icon, 
  gradient = false,
  className = '',
  children 
}) => {
  const cardStyle = gradient 
    ? { background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }
    : {};

  return (
    <div className={`card border-0 shadow-sm mb-4 ${className}`} style={cardStyle}>
      <div className="card-body p-4 text-center">
        {icon && (
          <div className="mb-3">
            {typeof icon === 'string' ? (
              <span style={{ fontSize: '3rem' }}>{icon}</span>
            ) : (
              icon
            )}
          </div>
        )}
        <h1 className={gradient ? 'display-4 lobster-regular title-color mb-3' : 'display-5 fw-bold title-color mb-2'}>
          {title}
        </h1>
        {subtitle && (
          <p className="lead text-muted mb-0">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
};

export default PageHeader;