import React from 'react';

const FormInput = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  maxLength,
  min,
  icon,
  helpText,
  error,
  size = 'default',
  className = '',
  inputClassName = '',
  disabled = false
}) => {
  const sizeClass = size === 'large' ? 'input-group-lg' : '';
  const inputSizeClass = size === 'large' ? 'form-control-lg' : '';

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label fw-semibold">
          {label}
        </label>
      )}
      <div className={`input-group ${sizeClass}`}>
        {icon && (
          <span className="input-group-text bg-light border-end-0">
            <i className={`bi ${icon} text-muted`}></i>
          </span>
        )}
        <input
          type={type}
          className={`form-control ${inputSizeClass} ${icon ? 'border-start-0' : ''} ${inputClassName}`}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          min={min}
          disabled={disabled}
        />
      </div>
      {helpText && (
        <div className="form-text">
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            {helpText}
          </small>
        </div>
      )}
      {error && (
        <div className="form-text text-danger">
          <small>
            <i className="bi bi-exclamation-triangle me-1"></i>
            {error}
          </small>
        </div>
      )}
    </div>
  );
};

export default FormInput;