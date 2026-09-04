"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface PWAContextType {
    isInstallable: boolean;
    isInstalled: boolean;
    isIOS: boolean;
    showIOSPrompt: boolean;
    setShowIOSPrompt: (show: boolean) => void;
    installApp: () => Promise<boolean>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // 1. Check if already installed or running in standalone window
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true ||
            document.referrer.includes("android-app://");

        if (isStandalone) {
            setIsInstalled(true);
            setIsInstallable(false);
            return;
        }

        // 2. Detect iOS Safari
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIPhoneOrIPad = /iphone|ipad|ipod/.test(userAgent);
        const isSafari = /safari/.test(userAgent) && !/crios|fxios|edgios|chrome/.test(userAgent);
        const isIOSSafari = isIPhoneOrIPad && isSafari;
        setIsIOS(isIOSSafari);

        if (isIOSSafari && !isStandalone) {
            setIsInstallable(true);
        }

        // 3. Listen for Chromium / Android beforeinstallprompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            console.log("[PWA] Captured beforeinstallprompt event");
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        // 4. Listen for appinstalled
        const handleAppInstalled = () => {
            console.log("[PWA] App installed successfully");
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
            setShowIOSPrompt(false);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        // Also listen for display-mode change
        const mediaQuery = window.matchMedia("(display-mode: standalone)");
        const handleDisplayModeChange = (e: MediaQueryListEvent) => {
            if (e.matches) {
                setIsInstalled(true);
                setIsInstallable(false);
            }
        };
        try {
            mediaQuery.addEventListener("change", handleDisplayModeChange);
        } catch {
            mediaQuery.addListener(handleDisplayModeChange);
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
            try {
                mediaQuery.removeEventListener("change", handleDisplayModeChange);
            } catch {
                mediaQuery.removeListener(handleDisplayModeChange);
            }
        };
    }, []);

    const installApp = useCallback(async (): Promise<boolean> => {
        if (isIOS) {
            setShowIOSPrompt(true);
            return true;
        }

        if (!deferredPrompt) {
            console.warn("[PWA] No deferredPrompt available yet");
            return false;
        }

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`[PWA] User response to installation: ${outcome}`);
            if (outcome === "accepted") {
                setIsInstalled(true);
                setIsInstallable(false);
                setDeferredPrompt(null);
                return true;
            }
            return false;
        } catch (err) {
            console.error("[PWA] Error calling prompt():", err);
            return false;
        }
    }, [deferredPrompt, isIOS]);

    return (
        <PWAContext.Provider
            value={{
                isInstallable,
                isInstalled,
                isIOS,
                showIOSPrompt,
                setShowIOSPrompt,
                installApp,
            }}
        >
            {children}
        </PWAContext.Provider>
    );
}

export function usePWA() {
    const context = useContext(PWAContext);
    if (!context) {
        throw new Error("usePWA must be used within a PWAProvider");
    }
    return context;
}
