"use client";

import { useEffect } from "react";

export default function PWARegister() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            const registerSW = async () => {
                try {
                    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
                    console.log("[PWA] Service Worker registered successfully: Scope =", reg.scope);

                    // Check for updates periodically
                    if (reg.waiting) {
                        reg.waiting.postMessage({ type: "SKIP_WAITING" });
                    }
                    reg.onupdatefound = () => {
                        const installingWorker = reg.installing;
                        if (installingWorker) {
                            installingWorker.onstatechange = () => {
                                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                                    console.log("[PWA] New content is available; please refresh.");
                                }
                            };
                        }
                    };
                } catch (err) {
                    console.error("[PWA] Service Worker registration failed:", err);
                }
            };

            // Register immediately or on window load
            if (document.readyState === "complete") {
                registerSW();
            } else {
                window.addEventListener("load", registerSW);
                return () => window.removeEventListener("load", registerSW);
            }
        }
    }, []);

    return null;
}
