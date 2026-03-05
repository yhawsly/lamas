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
        <div
            className="rounded-3xl p-8 relative overflow-hidden"
            style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(79,70,229,0.08) 100%)",
            }}
        >
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                        style={{
                            background: "rgba(99,102,241,0.15)",
                        }}
                    >
                        ✨
                    </div>
                    <div>
                        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                            Getting Started as {role}
                        </h2>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                            Follow these steps to complete your profile.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-4 p-4 rounded-2xl transition-all border-l-4 border-l-transparent group"
                            style={{
                                background: "var(--bg-surface)",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--bg-hover)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "var(--bg-surface)";
                            }}
                        >
                            <div
                                className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${step.completed ? "bg-green-500 border-green-500" : ""}`}
                                style={{
                                    borderColor: step.completed ? "var(--accent-green)" : "var(--bg-border)",
                                    background: step.completed ? "var(--accent-green)" : "transparent",
                                }}
                                onMouseEnter={(e) => {
                                    if (!step.completed) {
                                        e.currentTarget.style.borderColor = "var(--primary)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!step.completed) {
                                        e.currentTarget.style.borderColor = "var(--bg-border)";
                                    }
                                }}
                            >
                                {step.completed && (
                                    <svg
                                        className="w-3 h-3 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3
                                    className="text-sm font-bold"
                                    style={{
                                        color: step.completed ? "var(--text-muted)" : "var(--text-primary)",
                                    }}
                                >
                                    {step.title}
                                </h3>
                                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                    {step.description}
                                </p>
                                {!step.completed && (
                                    <a
                                        href={step.href}
                                        className="inline-block mt-3 text-xs font-bold transition"
                                        style={{
                                            color: "var(--primary)",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = "var(--primary-hover)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = "var(--primary)";
                                        }}
                                    >
                                        {step.actionLabel} →
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex items-center gap-4">
                    <div
                        className="flex-1 h-2 rounded-full overflow-hidden"
                        style={{ background: "var(--bg-surface)" }}
                    >
                        <div
                            className="h-full transition-all duration-1000"
                            style={{
                                width: `${progress}%`,
                                background: "var(--primary)",
                            }}
                        />
                    </div>
                    <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                        {progress}% COMPLETE
                    </span>
                </div>
            </div>

            {/* Background elements */}
            <div
                className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full blur-3xl"
                style={{
                    background: "rgba(99,102,241,0.1)",
                }}
            />
            <div className="absolute top-0 right-0 p-8" style={{ opacity: 0.05 }}>
                <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
                </svg>
            </div>
        </div>
    );
}
