"use client";

import React from "react";

interface LoaderProps {
    message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message = "Synchronizing Institutional Artifacts..." }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 animate-in fade-in duration-700">
            <div className="relative w-20 h-20">
                {/* Advanced Multi-Layer Spinner */}
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin [animation-duration:1s]" />
                <div className="absolute inset-4 border-4 border-t-blue-500 rounded-full animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
                <div className="absolute inset-8 bg-indigo-600/10 rounded-full animate-pulse" />
            </div>
            
            <div className="text-center space-y-2">
                <p className="text-base font-black uppercase tracking-[0.2em] bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
                    {message}
                </p>
                <div className="flex items-center justify-center gap-1.5 grayscale opacity-40">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
};

export default Loader;
