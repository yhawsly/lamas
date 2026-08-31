/**
 * File Preview Utility
 * Determines if a given file URL or document type can be natively previewed in a web browser.
 * Browsers natively render PDF and images (JPG, PNG, WEBP, SVG), but cannot render
 * office formats (PPTX, DOCX, XLSX) or ZIP archives without external desktop viewers.
 */

export function isBrowserViewable(url?: string | null, type?: string | null): boolean {
    if (!url) return false;
    const cleanUrl = url.toLowerCase().split("?")[0].split("#")[0];
    const cleanType = (type || "").toUpperCase();

    // Explicit PDF check
    if (cleanType === "PDF" || cleanUrl.endsWith(".pdf")) {
        return true;
    }

    // Direct Image checks
    if (
        cleanType === "IMAGE" ||
        cleanUrl.endsWith(".jpg") ||
        cleanUrl.endsWith(".jpeg") ||
        cleanUrl.endsWith(".png") ||
        cleanUrl.endsWith(".webp") ||
        cleanUrl.endsWith(".svg") ||
        cleanUrl.endsWith(".gif")
    ) {
        return true;
    }

    // Plain text / Markdown
    if (cleanType === "TEXT" || cleanUrl.endsWith(".txt") || cleanUrl.endsWith(".md")) {
        return true;
    }

    return false;
}
