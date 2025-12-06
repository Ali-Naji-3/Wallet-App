import { useState } from 'react';

/**
 * Professional Action Button Component (Filament-like)
 * Handles actions with loading states, confirmations, and modals
 */
function ActionButton({
  label,
  icon,
  variant = 'default', // 'default', 'primary', 'danger', 'success', 'warning'
  size = 'medium', // 'small', 'medium', 'large'
  onClick,
  confirmMessage,
  loading = false,
  disabled = false,
  className = '',
  children,
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || isLoading || loading) return;

    // Show confirmation if needed
    if (confirmMessage) {
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    setIsLoading(true);
    try {
      await onClick?.(e);
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = disabled || isLoading || loading;

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`action-btn action-btn-${variant} action-btn-${size} ${isDisabled ? 'action-btn-disabled' : ''} ${className}`}
    >
      {isLoading || loading ? (
        <>
          <span className="action-btn-spinner">⏳</span>
          {label && <span>Loading...</span>}
        </>
      ) : (
        <>
          {icon && <span className="action-btn-icon">{icon}</span>}
          {label && <span>{label}</span>}
          {children}
        </>
      )}
    </button>
  );
}

/**
 * Modal Action - Opens a modal for complex actions
 */
export function ModalAction({
  trigger,
  title,
  children,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm?.();
      setIsOpen(false);
    } catch (err) {
      console.error('Modal action error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{trigger}</div>
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{title}</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="modal-close"
                disabled={loading}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">
              <button
                onClick={() => setIsOpen(false)}
                className="modal-btn secondary"
                disabled={loading}
              >
                {cancelLabel}
              </button>
              <button
                onClick={handleConfirm}
                className={`modal-btn ${variant}`}
                disabled={loading}
              >
                {loading ? 'Processing...' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ActionButton;


