export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  context?: string;
}

export class ErrorHandler {
  private static errors: AppError[] = [];
  private static maxErrors = 100;

  private static omitUndefined<T extends Record<string, unknown>>(payload: T): Record<string, unknown> {
    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
  }

  static handle(error: Error | AppError, context?: string, userId?: string): AppError {
    const appError: AppError = {
      code: this.getErrorCode(error),
      message: error.message,
      details: error instanceof Error ? error.stack : undefined,
      timestamp: new Date(),
      userId,
      context,
    };

    this.logError(appError);
    this.storeError(appError);
    this.notifyUser(appError);

    return appError;
  }

  static async logErrorToFirebase(error: AppError): Promise<void> {
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      const { db, auth } = await import('../firebase');

      if (!auth.currentUser) {
        return;
      }
      
      await addDoc(collection(db, 'system_errors'), this.omitUndefined({
        ...error,
        timestamp: error.timestamp.toISOString(),
        userId: error.userId ?? auth.currentUser.uid,
      }));
    } catch (logError) {
      console.error('Failed to log error to Firebase:', logError);
    }
  }

  private static getErrorCode(error: Error | AppError): string {
    if ('code' in error) return error.code;
    
    if (error.message.includes('auth/')) return error.message.split('/')[1]?.split(')')[0] || 'AUTH_ERROR';
    if (error.message.includes('firestore/')) return error.message.split('/')[1]?.split(')')[0] || 'FIRESTORE_ERROR';
    if (error.message.includes('network')) return 'NETWORK_ERROR';
    if (error.message.includes('permission')) return 'PERMISSION_ERROR';
    if (error.message.includes('validation')) return 'VALIDATION_ERROR';
    
    return 'UNKNOWN_ERROR';
  }

  private static logError(error: AppError): void {
    console.group(`🚨 Application Error [${error.code}]`);
    console.error('Message:', error.message);
    console.error('Context:', error.context);
    console.error('User ID:', error.userId);
    console.error('Timestamp:', error.timestamp.toISOString());
    if (error.details) {
      console.error('Stack Trace:', error.details);
    }
    console.groupEnd();

    this.logErrorToFirebase(error);
  }

  private static storeError(error: AppError): void {
    this.errors.unshift(error);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }
  }

  private static notifyUser(error: AppError): void {
    const userMessage = this.getUserFriendlyMessage(error);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-error', {
        detail: {
          message: userMessage,
          code: error.code,
          context: error.context,
        },
      }));
    }
  }

  private static getUserFriendlyMessage(error: AppError): string {
    const friendlyMessages: Record<string, string> = {
      'NETWORK_ERROR': 'Network connection lost. Please check your internet connection and try again.',
      'PERMISSION_ERROR': 'You don\'t have permission to perform this action. Please contact your administrator.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'AUTH_ERROR': 'Authentication failed. Please sign in again.',
      'user-not-found': 'No account found with this email address.',
      'wrong-password': 'Incorrect password. Please try again.',
      'too-many-requests': 'Too many attempts. Please wait a moment and try again.',
      'popup-blocked': 'Popup was blocked. Please allow popups and try again.',
      'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again or contact support.',
    };

    return friendlyMessages[error.code] || friendlyMessages['UNKNOWN_ERROR'];
  }

  static getErrors(): AppError[] {
    return [...this.errors];
  }

  static clearErrors(): void {
    this.errors = [];
  }

  static getErrorStats(): { total: number; byCode: Record<string, number> } {
    const byCode: Record<string, number> = {};
    
    this.errors.forEach(error => {
      byCode[error.code] = (byCode[error.code] || 0) + 1;
    });

    return {
      total: this.errors.length,
      byCode,
    };
  }
}

export class SessionManager {
  private static sessionTimeout: NodeJS.Timeout | null = null;
  private static readonly WARNING_TIME = 5 * 60 * 1000; // 5 minutes
  private static readonly TIMEOUT_TIME = 15 * 60 * 1000; // 15 minutes

  static startSession(userId: string): void {
    this.clearSession();
    
    this.sessionTimeout = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.TIMEOUT_TIME);

    setTimeout(() => {
      this.showSessionWarning();
    }, this.WARNING_TIME);

    this.setupActivityListeners();
  }

  static extendSession(): void {
    this.clearSession();
    this.startSession(this.getCurrentUserId() || '');
  }

  static clearSession(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
    this.removeActivityListeners();
  }

  private static setupActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, this.handleActivity, { passive: true });
    });
  }

  private static removeActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.removeEventListener(event, this.handleActivity);
    });
  }

  private static handleActivity = (): void => {
    this.extendSession();
  };

  private static handleSessionTimeout(): void {
    ErrorHandler.handle(
      new Error('Session timed out due to inactivity'),
      'SESSION_TIMEOUT',
      this.getCurrentUserId()
    );

    this.signOutUser();
  }

  private static showSessionWarning(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('session-warning', {
        detail: {
          message: 'Your session will expire in 5 minutes due to inactivity.',
          timeRemaining: this.WARNING_TIME,
        },
      }));
    }
  }

  private static getCurrentUserId(): string | null {
    try {
      const { auth } = require('../firebase');
      return auth.currentUser?.uid || null;
    } catch {
      return null;
    }
  }

  private static async signOutUser(): Promise<void> {
    try {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('../firebase');
      await signOut(auth);
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      ErrorHandler.handle(error as Error, 'SIGN_OUT_ERROR');
    }
  }
}

export class NetworkMonitor {
  private static isOnline = navigator.onLine;
  private static retryAttempts = 0;
  private static readonly MAX_RETRY_ATTEMPTS = 3;

  static initialize(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  static cleanup(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  private static handleOnline = (): void => {
    this.isOnline = true;
    this.retryAttempts = 0;
    
    window.dispatchEvent(new CustomEvent('network-status', {
      detail: { online: true },
    }));
  };

  private static handleOffline = (): void => {
    this.isOnline = false;
    
    ErrorHandler.handle(
      new Error('Network connection lost'),
      'NETWORK_OFFLINE'
    );

    window.dispatchEvent(new CustomEvent('network-status', {
      detail: { online: false },
    }));
  };

  static async retryOperation<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    if (!this.isOnline) {
      throw new Error('No network connection available');
    }

    try {
      const result = await operation();
      this.retryAttempts = 0;
      return result;
    } catch (error) {
      if (this.retryAttempts < this.MAX_RETRY_ATTEMPTS && this.isRetryableError(error)) {
        this.retryAttempts++;
        
        await this.delay(Math.pow(2, this.retryAttempts) * 1000);
        
        return this.retryOperation(operation, context);
      }
      
      throw error;
    }
  }

  private static isRetryableError(error: any): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'timeout',
      'unavailable',
      'deadline-exceeded',
    ];
    
    return retryableCodes.some(code => 
      error.message?.includes(code) || error.code === code
    );
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static getConnectionStatus(): { online: boolean; retryAttempts: number } {
    return {
      online: this.isOnline,
      retryAttempts: this.retryAttempts,
    };
  }
}

export const initializeErrorHandling = (): void => {
  NetworkMonitor.initialize();
  
  window.addEventListener('unhandledrejection', (event) => {
    ErrorHandler.handle(
      new Error(event.reason),
      'UNHANDLED_PROMISE_REJECTION'
    );
  });

  window.addEventListener('error', (event) => {
    ErrorHandler.handle(
      event.error || new Error(event.message),
      'GLOBAL_ERROR'
    );
  });
};

export const cleanupErrorHandling = (): void => {
  NetworkMonitor.cleanup();
  SessionManager.clearSession();
};
