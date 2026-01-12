import React from "react";

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    // Register pages use standalone layout without portal sidebar
    return <>{children}</>;
}
