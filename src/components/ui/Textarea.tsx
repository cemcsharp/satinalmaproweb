import React, { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className = "", label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5 ml-0.5">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={`
            w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            disabled:bg-slate-50 disabled:text-slate-500
            transition-all duration-200 resize-y min-h-[80px]
            ${error ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}
            ${className}
          `}
                    {...props}
                />
                {error && <p className="mt-1 text-xs text-red-500 font-medium ml-0.5">{error}</p>}
            </div>
        );
    }
);

Textarea.displayName = "Textarea";

export default Textarea;
