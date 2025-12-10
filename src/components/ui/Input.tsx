"use client";
import React from "react";

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'rows' | 'size'> & {
  label?: string;
  error?: string;
  hint?: string;
  description?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  multiline?: boolean;
  rows?: number;
  size?: "sm" | "md" | "lg";
};

export default React.forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(function Input({
  label,
  error,
  hint,
  description,
  success,
  leftIcon,
  rightIcon,
  className = "",
  id,
  required,
  disabled,
  multiline = false,
  rows = 3,
  size = "md",
  ...props
}, ref) {
  const generatedId = React.useId();
  const inputId = id || `input-${generatedId}`;

  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2.5 text-base",
  }[size];

  const baseInputStyles = `
    w-full
    ${sizeStyles}
    bg-white
    text-slate-800
    border rounded-lg
    transition-colors
    placeholder:text-slate-400
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50
    ${leftIcon ? "pl-10" : ""}
    ${rightIcon ? "pr-10" : ""}
    ${error
      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
      : success
        ? "border-green-300 focus:ring-green-500 focus:border-green-500"
        : "border-slate-300 hover:border-slate-400"
    }
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={`
            block text-sm font-medium mb-1.5
            text-slate-700
            ${required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}
          `}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && !multiline && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </div>
        )}
        {multiline ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={inputId}
            disabled={disabled}
            rows={rows}
            className={`${baseInputStyles} resize-y min-h-[80px]`}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            id={inputId}
            disabled={disabled}
            className={baseInputStyles}
            {...props}
          />
        )}
        {rightIcon && !multiline && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
      {success && !error && (
        <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </p>
      )}
      {description && !error && !success && (
        <p className="mt-1.5 text-xs text-slate-500">{description}</p>
      )}
      {hint && !error && !success && !description && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
});
