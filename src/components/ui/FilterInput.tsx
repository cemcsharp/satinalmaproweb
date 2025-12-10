"use client";
import React, { InputHTMLAttributes, useId } from "react";

interface FilterInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export default function FilterInput({ label, error, className = "", id, ...props }: FilterInputProps) {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    return (
        <div className="flex flex-col gap-1.5 group">
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wide transition-colors group-focus-within:text-blue-600"
                >
                    {label}
                </label>
            )}
            <input
                id={inputId}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className={`
                    flex h-10 w-full rounded-xl
                    border border-slate-200/60
                    bg-white/50 backdrop-blur-sm px-3 py-2 text-sm
                    text-slate-700 font-medium
                    placeholder:text-slate-400
                    hover:border-blue-300/50 hover:bg-white/80
                    focus:outline-none focus:border-blue-500/50
                    focus:ring-4 focus:ring-blue-500/10
                    disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-100/50
                    transition-all duration-200
                    shadow-sm
                    ${error ? "border-red-300/50 focus:border-red-500/50 focus:ring-red-500/10 bg-red-50/30" : ""}
                    ${className}
                `}
                {...props}
            />
            {error && (
                <span
                    id={errorId}
                    role="alert"
                    className="text-xs font-medium text-red-500 ml-1 flex items-center gap-1"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </span>
            )}
        </div>
    );
}
