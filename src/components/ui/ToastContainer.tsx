// ============================================
// TOAST CONTAINER COMPONENT
// Displays toast notifications
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

// ============================================
// TOAST TYPES
// ============================================

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// ============================================
// TOAST ICONS
// ============================================

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-success" />,
  error: <XCircle className="w-5 h-5 text-danger" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning" />,
  info: <Info className="w-5 h-5 text-info" />,
};

// ============================================
// TOAST STYLES
// ============================================

const toastStyles: Record<ToastType, string> = {
  success: 'bg-success/10 border-success/20 text-success',
  error: 'bg-danger/10 border-danger/20 text-danger',
  warning: 'bg-warning/10 border-warning/20 text-warning',
  info: 'bg-info/10 border-info/20 text-info',
};

// ============================================
// TOAST CONTAINER COMPONENT
// ============================================

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // ============================================
  // ADD TOAST
  // ============================================

  const addToast = (type: ToastType, message: string, duration: number = 5000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  // ============================================
  // REMOVE TOAST
  // ============================================

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right',
            toastStyles[toast.type]
          )}
          onClick={() => removeToast(toast.id)}
        >
          {toastIcons[toast.type]}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            className="ml-auto text-text-muted hover:text-text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
          >
            <span className="sr-only">Dismiss</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================
// TOAST HOOK
// ============================================

import { createContext, useContext, useCallback } from 'react';

interface ToastContextType {
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration: number = 5000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right',
              toastStyles[toast.type]
            )}
            onClick={() => removeToast(toast.id)}
          >
            {toastIcons[toast.type]}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              className="ml-auto text-text-muted hover:text-text-primary transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
