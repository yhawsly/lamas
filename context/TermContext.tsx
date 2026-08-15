"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import useSWR from "swr";

export interface AcademicTerm {
    id: number;
    name: string;
    startDate: string | Date;
    endDate: string | Date;
    isActive: boolean;
    totalWeeks?: number;
}

interface TermContextType {
    activeTerm: AcademicTerm | null;
    allTerms: AcademicTerm[];
    selectedTerm: AcademicTerm | null;
    selectedTermId: number | null;
    isArchiveMode: boolean;
    setSelectedTermId: (termId: number) => void;
    isLoading: boolean;
    refreshTerms: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const TermContext = createContext<TermContextType | undefined>(undefined);

const STORAGE_KEY = "lamas_selected_workspace_term_id";

export function TermProvider({ children }: { children: React.ReactNode }) {
    const { data: activeTermData, isLoading: activeLoading, mutate: mutateActive } = useSWR<AcademicTerm>(
        "/api/active-term",
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 30000 }
    );

    const { data: allTermsData, isLoading: termsLoading, mutate: mutateAll } = useSWR<AcademicTerm[]>(
        "/api/terms",
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 30000 }
    );

    const activeTerm = useMemo(() => {
        if (!activeTermData || activeTermData.id <= 0) return null;
        return activeTermData;
    }, [activeTermData]);

    const allTerms = useMemo(() => {
        if (!Array.isArray(allTermsData)) return [];
        return allTermsData;
    }, [allTermsData]);

    const [selectedTermIdState, setSelectedTermIdState] = useState<number | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize selectedTermId on client side from storage or activeTerm
    useEffect(() => {
        if (typeof window === "undefined") return;

        const storedId = sessionStorage.getItem(STORAGE_KEY);
        if (storedId) {
            const parsed = parseInt(storedId, 10);
            if (!isNaN(parsed) && parsed > 0) {
                setSelectedTermIdState(parsed);
                setIsInitialized(true);
                return;
            }
        }

        if (activeTerm?.id) {
            setSelectedTermIdState(activeTerm.id);
            setIsInitialized(true);
        }
    }, [activeTerm]);

    const setSelectedTermId = (termId: number) => {
        setSelectedTermIdState(termId);
        if (typeof window !== "undefined") {
            sessionStorage.setItem(STORAGE_KEY, String(termId));
        }
    };

    const selectedTerm = useMemo(() => {
        if (!selectedTermIdState && activeTerm) return activeTerm;
        if (!selectedTermIdState) return null;
        
        const found = allTerms.find((t) => t.id === selectedTermIdState);
        if (found) return found;

        if (activeTerm && activeTerm.id === selectedTermIdState) return activeTerm;
        return activeTerm || null;
    }, [selectedTermIdState, allTerms, activeTerm]);

    const effectiveSelectedTermId = selectedTerm?.id || activeTerm?.id || null;

    const isArchiveMode = useMemo(() => {
        if (!selectedTerm) return false;
        if (!activeTerm) return !selectedTerm.isActive;
        return selectedTerm.id !== activeTerm.id || !selectedTerm.isActive;
    }, [selectedTerm, activeTerm]);

    const refreshTerms = () => {
        mutateActive();
        mutateAll();
    };

    return (
        <TermContext.Provider
            value={{
                activeTerm,
                allTerms,
                selectedTerm,
                selectedTermId: effectiveSelectedTermId,
                isArchiveMode,
                setSelectedTermId,
                isLoading: activeLoading || termsLoading || !isInitialized,
                refreshTerms,
            }}
        >
            {children}
        </TermContext.Provider>
    );
}

export function useTerm(): TermContextType {
    const context = useContext(TermContext);
    if (!context) {
        throw new Error("useTerm must be used within a TermProvider");
    }
    return context;
}

export default TermContext;
