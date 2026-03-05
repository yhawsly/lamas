"use client";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-8 py-4 border-t" style={{ borderColor: "var(--bg-border)" }}>
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
                style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--bg-border)",
                    color: "var(--text-secondary)",
                    border: "1px solid",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--bg-surface)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                }}
            >
                ← Previous
            </button>

            <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    // Show dots if too many pages
                    if (totalPages > 5 && p > 2 && p < totalPages - 1 && Math.abs(p - currentPage) > 1) {
                        if (p === 3 || p === totalPages - 2)
                            return (
                                <span key={p} className="px-1" style={{ color: "var(--text-muted)" }}>
                                    ...
                                </span>
                            );
                        return null;
                    }

                    return (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                            style={{
                                background:
                                    currentPage === p
                                        ? "var(--primary)"
                                        : "transparent",
                                color:
                                    currentPage === p
                                        ? "white"
                                        : "var(--text-secondary)",
                                boxShadow:
                                    currentPage === p
                                        ? "0 0 12px rgba(99, 102, 241, 0.3)"
                                        : "none",
                            }}
                            onMouseEnter={(e) => {
                                if (currentPage !== p) {
                                    e.currentTarget.style.background = "var(--bg-hover)";
                                    e.currentTarget.style.color = "var(--text-primary)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentPage !== p) {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.color = "var(--text-secondary)";
                                }
                            }}
                        >
                            {p}
                        </button>
                    );
                })}
            </div>

            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
                style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--bg-border)",
                    color: "var(--text-secondary)",
                    border: "1px solid",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--bg-surface)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                }}
            >
                Next →
            </button>
        </div>
    );
}
