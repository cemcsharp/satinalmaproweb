"use client";
import React, { useEffect } from "react";

type ToastProps = {
  message: string;
  variant?: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose: () => void;
};

export default function Toast({
  message,
  variant = "info",
  duration = 5000,
  onClose
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const variantStyles = {
    success: "border-l-[var(--status-success)]",
    error: "border-l-[var(--status-error)]",
    warning: "border-l-[var(--status-warning)]",
    info: "border-l-[var(--status-info)]",
  }[variant];

  const iconColors = {
    success: "text-[var(--status-success)]",
    error: "text-[var(--status-error)]",
    warning: "text-[var(--status-warning)]",
    info: "text-[var(--status-info)]",
  }[variant];

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div className={`
      flex items-start gap-3
      min-w-[300px] max-w-md
      p-4
      bg-[var(--card-bg)]
      border border-[var(--card-border)]
      border-l-4 ${variantStyles}
      rounded-lg
      shadow-[var(--shadow-lg)]
      animate-toast-in
    `}>
      <div className={iconColors}>
        {icons[variant]}
      </div>
      <p className="flex-1 text-sm text-[var(--text-primary)]">{message}</p>
      <button
        onClick={onClose}
        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      <style jsx>{`
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-toast-in {
          animation: toast-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Toast Container
export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-6 right-6 z-[1100] flex flex-col gap-3">
      {children}
    </div>
  );
}

// Toast Provider Context
type ToastType = {
  id: string;
  message: string;
  variant: "success" | "error" | "warning" | "info";
  title?: string;
  description?: string;
};

type ShowToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastType["variant"];
  message?: string;
};

type ToastContextType = {
  toasts: ToastType[];
  addToast: (message: string, variant?: ToastType["variant"]) => void;
  removeToast: (id: string) => void;
  show: (options: ShowToastOptions) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastType[]>([]);

  const addToast = React.useCallback((message: string, variant: ToastType["variant"] = "info") => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, variant }]);
  }, []);

  const show = React.useCallback((options: ShowToastOptions) => {
    const id = Math.random().toString(36).substring(7);
    const message = options.message || options.title || "";
    const variant = options.variant || "info";
    setToasts(prev => [...prev, { id, message, variant, title: options.title, description: options.description }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, show }}>
      {children}
      <ToastContainer>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.description ? `${toast.title}: ${toast.description}` : toast.message}
            variant={toast.variant}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}