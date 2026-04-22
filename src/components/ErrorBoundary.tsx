// @ts-nocheck
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { ErrorHandler } from '../utils/errorHandling';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private readonly errorId: string;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.errorId = this.generateErrorId();
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
      errorId: this.errorId,
    });

    try {
      ErrorHandler.handle(error, 'REACT_ERROR_BOUNDARY');
    } catch (e) {
      // Silently fail if error handler not available
    }

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private generateErrorId = (): string => {
    return `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  };

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  private handleContactSupport = (): void => {
    const { errorId, error } = this.state;
    const subject = `Error Report - ${errorId}`;
    const body = `Error ID: ${errorId}\n\nError: ${error?.message}\n\nStack Trace:\n${error?.stack}`;
    window.location.href = `mailto:support@vitalsedge.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  render(): React.ReactNode {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { fallback, children } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-6 font-sans">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-white border border-[#141414] p-8 text-center shadow-2xl"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="font-serif italic text-2xl mb-4">Something Went Wrong</h1>
            
            <p className="text-sm opacity-60 mb-6 leading-relaxed">
              We apologize for the inconvenience. An unexpected error has occurred.
            </p>

            {import.meta.env.DEV && error && (
              <details className="mb-6 text-left">
                <summary className="text-xs font-bold uppercase tracking-widest opacity-50 cursor-pointer mb-2">
                  Error Details (Development)
                </summary>
                <div className="bg-red-50 border border-red-200 p-4 rounded text-xs font-mono">
                  <p className="font-bold mb-2">Error ID: {errorId}</p>
                  <p className="mb-2">{error?.message}</p>
                  <pre className="whitespace-pre-wrap opacity-70">
                    {error?.stack}
                  </pre>
                </div>
              </details>
            )}

            <div className="space-y-3">
              <button 
                onClick={this.handleRetry}
                className="w-full bg-[#141414] text-[#E4E3E0] py-3 px-4 font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={this.handleGoHome}
                  className="bg-gray-100 text-[#141414] py-3 px-4 font-bold uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>

                <button 
                  onClick={this.handleContactSupport}
                  className="bg-gray-100 text-[#141414] py-3 px-4 font-bold uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Support
                </button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[#141414]/10 text-[10px] uppercase tracking-widest opacity-40">
              Error ID: {errorId}
            </div>
          </motion.div>
        </div>
      );
    }

    return children;
  }
}

export const ErrorFallback: React.FC<{ 
  message?: string; 
  onRetry?: () => void; 
  showContact?: boolean;
}> = ({ 
  message = 'An error occurred while loading this component.',
  onRetry,
  showContact = true 
}) => {
  const handleContactSupport = () => {
    window.location.href = 'mailto:support@vitalsedge.com?subject=Component Error Report';
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-red-800 mb-2">Component Error</h3>
      <p className="text-red-600 mb-4">{message}</p>
      
      <div className="flex gap-3 justify-center">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
        
        {showContact && (
          <button 
            onClick={handleContactSupport}
            className="bg-white text-red-600 border border-red-300 px-4 py-2 rounded hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </button>
        )}
      </div>
    </div>
  );
};

export const AsyncErrorBoundary: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleAsyncError = (event: CustomEvent) => {
      setHasError(true);
      setError(event.detail.error);
      ErrorHandler.handle(event.detail.error, 'ASYNC_COMPONENT_ERROR');
    };

    window.addEventListener('async-component-error', handleAsyncError as EventListener);
    
    return () => {
      window.removeEventListener('async-component-error', handleAsyncError as EventListener);
    };
  }, []);

  if (hasError) {
    return fallback || <ErrorFallback message={error?.message} />;
  }

  return <>{children}</>;
};
