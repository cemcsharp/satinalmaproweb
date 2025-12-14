"use client";
import React from "react";
import Button from "@/components/ui/Button";

type IconName = "edit" | "check" | "eye" | "trash" | "clipboard" | "power";

type IconButtonProps = Omit<React.ComponentProps<typeof Button>, "children" | "size"> & {
  icon: IconName;
  label?: string; // optional - used for aria-label and title
  tone?: "default" | "info" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "outline" | "glass";
};

const SvgIcon = ({ name, size = 18, className = "" }: { name: IconName; size?: number; className?: string }) => {
  // Explicit pixel size for style to ensure visibility
  const style = { width: size, height: size, minWidth: size, minHeight: size };

  switch (name) {
    case "edit":
      return (
        <svg style={style} className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
        </svg>
      );
    case "check":
      return (
        <svg style={style} className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
        </svg>
      );
    case "eye":
      return (
        <svg style={style} className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
          <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
        </svg>
      );
    case "trash":
      return (
        <svg style={style} className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
        </svg>
      );
    case "clipboard":
      return (
        <svg style={style} className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.135-.845-2.091-1.976-2.192a48.424 48.424 0 00-3.498 0 2.25 2.25 0 00-2.176 2.654M12.75 2.25a2.25 2.25 0 00-2.176 2.654M12.75 2.25c0 1.105-.846 2.046-1.916 2.193a48.424 48.424 0 00-3.498 0 2.25 2.25 0 00-1.976 2.192V19.5a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6.108c0-1.135.845-2.091 1.976-2.192a48.424 48.424 0 013.498 0 2.25 2.25 0 012.176 2.654z" clipRule="evenodd" />
        </svg>
      );
    case "power":
      return (
        <svg style={style} className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v9a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM6.166 5.106a.75.75 0 010 1.06 8.25 8.25 0 1011.668 0 .75.75 0 111.06-1.06c3.808 3.807 3.808 9.98 0 13.788-3.807 3.808-9.98 3.808-13.788 0-3.808-3.807-3.808-9.98 0-13.788a.75.75 0 011.06 0z" clipRule="evenodd" />
        </svg>
      );
    default:
      return <span className="text-xs font-bold">?</span>;
  }
};

export default function IconButton({ icon, label, size = "sm", variant = "outline", tone = "default", className = "", ...props }: IconButtonProps) {
  // Consistent icon sizing
  const iconSize = size === "lg" ? 20 : size === "md" ? 18 : 16;

  // Base classes for the button
  const baseClasses = "inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  // Size classes
  const sizeClasses = size === "lg" ? "p-3" : size === "md" ? "p-2.5" : "p-2";

  // Tone/Variant classes
  // Tone/Variant classes
  let variantClasses = "";

  if (variant === "ghost") {
    const ghostTones = {
      default: "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
      info: "text-blue-600 hover:text-blue-700 hover:bg-blue-50",
      success: "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50",
      warning: "text-amber-600 hover:text-amber-700 hover:bg-amber-50",
      danger: "text-red-600 hover:text-red-700 hover:bg-red-50",
    };
    variantClasses = ghostTones[tone] || ghostTones.default;
  } else if (variant === "glass") {
    variantClasses = "bg-white/50 backdrop-blur-sm border border-white/20 text-slate-700 hover:bg-white/80 shadow-sm";
    if (tone === "danger") variantClasses += " text-red-600 hover:text-red-700";
    else if (tone === "info") variantClasses += " text-blue-600 hover:text-blue-700";
    else if (tone === "success") variantClasses += " text-emerald-600 hover:text-emerald-700";
    else if (tone === "warning") variantClasses += " text-amber-600 hover:text-amber-700";
  } else {
    // Default / Outline
    const outlineTones = {
      default: "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200",
      info: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200",
      success: "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200",
      warning: "text-amber-600 hover:text-amber-700 hover:bg-amber-50 border border-amber-200",
      danger: "text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200",
    };
    variantClasses = outlineTones[tone] || outlineTones.default;
  }

  return (
    <button
      type="button"
      className={[baseClasses, sizeClasses, variantClasses, className].join(" ")}
      aria-label={label}
      title={label}
      {...props}
    >
      <SvgIcon name={icon} size={iconSize} />
    </button>
  );
}