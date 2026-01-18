"use client";
import { useState, createContext, useContext, ReactNode, useCallback } from "react";
import DemoRequestModal from "./DemoRequestModal";

interface DemoContextType {
    openModal: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const useDemoModal = () => {
    const context = useContext(DemoContext);
    if (!context) {
        throw new Error("useDemoModal must be used within a LandingProvider");
    }
    return context.openModal;
};

export default function LandingProvider({ children }: { children: ReactNode }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    return (
        <DemoContext.Provider value={{ openModal }}>
            {children}
            <DemoRequestModal
                isOpen={isModalOpen}
                onClose={closeModal}
            />
        </DemoContext.Provider>
    );
}

