"use client";
import React from "react";

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  label?: string;
  error?: string;
  hint?: string;
  options?: SelectOption[];
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

export default React.forwardRef<HTMLSelectElement, SelectProps>(function Select({
  label,
  error,
  hint,
  options,
  children,
  className = "",
  id,
  required,
  disabled,
  size = "md",
  ...props
}, ref) {
  const generatedId = React.useId();
  const selectId = id || `select-${generatedId}`;

  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2.5 text-base",
  }[size];

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
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
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`
            w-full ${sizeStyles}
            bg-white
            text-slate-800
            border rounded-lg
            appearance-none
            cursor-pointer
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50
            ${error
              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
              : "border-slate-300 hover:border-slate-400"
            }
            ${className}
          `}
          {...props}
        >
          {options ? (
            options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          ) : (
            children
          )}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
});