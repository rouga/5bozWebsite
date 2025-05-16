// client/src/components/SectionCard.jsx
import React from 'react';

const SectionCard = ({ 
  title, 
  subtitle, 
  icon, 
  headerClassName = '',
  bodyClassName = '',
  className = '',
  children,
  actions
}) => {
  return (
    <div className={`card border-0 shadow-sm mb-4 ${className}`}>
      <div className={`card-header bg-white border-bottom-0 p-4 ${headerClassName}`}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="h4 fw-bold text-dark mb-1">
              {icon && <i className={`bi ${icon} me-2`}></i>}
              {title}
            </h2>
            {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </div>
      <div className={`card-body p-4 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default SectionCard;