"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function LegacyResetRedirect() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            router.replace(`/reset-password/token?token=${encodeURIComponent(token)}`);
        } else {
            router.replace("/reset-password/request");
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 font-sans">
            <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-semibold">Redirecting to secure password reset...</span>
            </div>
        </div>
    );
}

export default function LegacyResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 font-sans">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-semibold">Loading...</span>
                </div>
            </div>
        }>
            <LegacyResetRedirect />
        </Suspense>
    );
}
