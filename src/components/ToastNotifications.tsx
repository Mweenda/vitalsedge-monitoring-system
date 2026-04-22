import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: ToastAction[];
}

interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => string;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? (toast.type === 'error' ? 0 : 5000),
    };

    setToasts(prev => [...prev, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }

    return id;
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  useEffect(() => {
    const handleAppError = (event: CustomEvent) => {
      showToast({
        type: 'error',
        title: 'Error',
        message: event.detail.message,
        persistent: true,
      });
    };

    const handleSessionWarning = (event: CustomEvent) => {
      showToast({
        type: 'warning',
        title: 'Session Warning',
        message: event.detail.message,
        duration: 10000,
        actions: [
          {
            label: 'Extend Session',
            onClick: () => {
              window.dispatchEvent(new CustomEvent('extend-session'));
            },
            variant: 'primary',
          },
        ],
      });
    };

    const handleNetworkStatus = (event: CustomEvent) => {
      if (event.detail.online) {
        showToast({
          type: 'success',
          title: 'Connection Restored',
          message: 'Your internet connection has been restored.',
        });
      } else {
        showToast({
          type: 'error',
          title: 'Connection Lost',
          message: 'You are currently offline. Some features may not be available.',
          persistent: true,
        });
      }
    };

    window.addEventListener('app-error', handleAppError as EventListener);
    window.addEventListener('session-warning', handleSessionWarning as EventListener);
    window.addEventListener('network-status', handleNetworkStatus as EventListener);

    return () => {
      window.removeEventListener('app-error', handleAppError as EventListener);
      window.removeEventListener('session-warning', handleSessionWarning as EventListener);
      window.removeEventListener('network-status', handleNetworkStatus as EventListener);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, clearAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} onHideToast={hideToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onHideToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onHideToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onHide={() => onHideToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onHide: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onHide }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBackgroundClass = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTitleClass = () => {
    switch (toast.type) {
      case 'success':
        return 'text-emerald-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-amber-800';
      case 'info':
        return 'text-blue-800';
    }
  };

  const getMessageClass = () => {
    switch (toast.type) {
      case 'success':
        return 'text-emerald-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-amber-600';
      case 'info':
        return 'text-blue-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={`
        border rounded-lg shadow-lg p-4 backdrop-blur-sm
        ${getBackgroundClass()}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm ${getTitleClass()}`}>
            {toast.title}
          </h4>
          
          {toast.message && (
            <p className={`text-sm mt-1 ${getMessageClass()}`}>
              {toast.message}
            </p>
          )}
          
          {toast.actions && toast.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {toast.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`
                    px-3 py-1 text-xs font-medium rounded transition-colors
                    ${action.variant === 'primary' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={onHide}
          className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </motion.div>
  );
};

export const ToastHelpers = {
  success: (title: string, message?: string) => {
    const { showToast } = useToast();
    return showToast({ type: 'success', title, message });
  },
  
  error: (title: string, message?: string) => {
    const { showToast } = useToast();
    return showToast({ type: 'error', title, message, persistent: true });
  },
  
  warning: (title: string, message?: string) => {
    const { showToast } = useToast();
    return showToast({ type: 'warning', title, message });
  },
  
  info: (title: string, message?: string) => {
    const { showToast } = useToast();
    return showToast({ type: 'info', title, message });
  },
  
  loading: (title: string, message?: string) => {
    const { showToast } = useToast();
    return showToast({ 
      type: 'info', 
      title, 
      message, 
      persistent: true,
      actions: [
        {
          label: 'Dismiss',
          onClick: () => {},
          variant: 'secondary',
        },
      ],
    });
  },
};
