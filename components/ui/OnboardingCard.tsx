"use client";

import React from "react";

interface Step {
    title: string;
    description: string;
    actionLabel: string;
    href: string;
    completed: boolean;
}

interface OnboardingCardProps {
    role: string;
    steps: Step[];
}

export default function OnboardingCard({ role, steps }: OnboardingCardProps) {
    const progress = Math.round((steps.filter(s => s.completed).length / steps.length) * 100);

    return (
        <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-3xl p-8 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-2xl border border-blue-500/20">
                        ✨
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Getting Started as {role}</h2>
                        <p className="text-white/40 text-sm">Follow these steps to complete your profile.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all border-l-4 border-l-transparent group">
                            <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${step.completed ? "bg-green-500 border-green-500" : "border-white/20 group-hover:border-blue-400"}`}>
                                {step.completed && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className={`text-sm font-bold ${step.completed ? "text-white/40" : "text-white"}`}>{step.title}</h3>
                                <p className="text-white/30 text-xs mt-1">{step.description}</p>
                                {!step.completed && (
                                    <a href={step.href} className="inline-block mt-3 text-xs font-bold text-blue-400 hover:text-blue-300 transition">
                                        {step.actionLabel} →
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex items-center gap-4">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs font-bold text-white/40">{progress}% COMPLETE</span>
                </div>
            </div>

            {/* Background elements */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
                </svg>
            </div>
        </div>
    );
}
