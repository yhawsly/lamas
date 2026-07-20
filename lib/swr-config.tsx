"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";

/**
 * Global SWR configuration provider.
 *
 * - dedupingInterval: 30s — prevents duplicate requests within 30 seconds
 * - revalidateOnFocus: false — don't re-fetch when window regains focus (reduces API load)
 * - revalidateOnReconnect: true — re-fetch when coming back online
 * - errorRetryCount: 3 — retry failed requests up to 3 times
 * - errorRetryInterval: 5000 — wait 5s between retries
 * - fetcher: default JSON fetcher with error handling
 */

const globalFetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const error: any = new Error("An error occurred while fetching data.");
        try {
            error.info = await res.json();
        } catch {
            error.info = { error: res.statusText };
        }
        error.status = res.status;
        throw error;
    }
    return res.json();
};

export default function SWRProvider({ children }: { children: ReactNode }) {
    return (
        <SWRConfig
            value={{
                fetcher: globalFetcher,
                dedupingInterval: 30000,
                revalidateOnFocus: false,
                revalidateOnReconnect: true,
                errorRetryCount: 3,
                errorRetryInterval: 5000,
                shouldRetryOnError: (err: any) => {
                    // Don't retry on 4xx errors (client errors)
                    if (err?.status && err.status >= 400 && err.status < 500) return false;
                    return true;
                },
            }}
        >
            {children}
        </SWRConfig>
    );
}
