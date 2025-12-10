"use client";
import React from "react";

type SearchInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    onSearch?: (value: string) => void;
    loading?: boolean;
};

export default function SearchInput({
    onSearch,
    loading = false,
    placeholder = "Ara...",
    className = "",
    defaultValue,
    value: propValue,
    ...props
}: SearchInputProps) {
    const [value, setValue] = React.useState<string>(
        (propValue as string) || (defaultValue as string) || ""
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        onSearch?.(e.target.value);
    };

    const handleClear = () => {
        setValue("");
        onSearch?.("");
    };

    return (
        <div className={`relative ${className}`}>
            {/* Search Icon */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                {loading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" className="opacity-25" />
                        <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="2" className="opacity-75" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                )}
            </div>

            {/* Input */}
            <input
                type="text"
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                className={`
          w-full
          pl-10 pr-10 py-2.5
          text-sm
          bg-[var(--input-bg)]
          text-[var(--text-primary)]
          border border-[var(--input-border)]
          rounded-lg
          transition-all duration-150
          placeholder:text-[var(--text-muted)]
          focus:outline-none focus:ring-2 focus:ring-offset-0
          focus:border-[var(--input-focus)] focus:ring-[var(--brand-primary)]/20
          hover:border-[var(--border-strong)]
        `}
                {...props}
            />

            {/* Clear Button */}
            {value && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            )}
        </div>
    );
}
