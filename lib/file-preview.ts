/**
 * File Preview Utility
 * Determines if a given file URL or document type can be natively previewed in a web browser.
 * Browsers natively render PDF and images (JPG, PNG, WEBP, SVG), but cannot render
 * office formats (PPTX, DOCX, XLSX) or ZIP archives without external desktop viewers.
 */

export function isBrowserViewable(url?: string | null, type?: string | null): boolean {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    const cleanUrl = lowerUrl.split("?")[0].split("#")[0];
    const cleanType = (type || "").toUpperCase();

    // Explicit PDF check (extension, type, or Data URL)
    if (
        cleanType === "PDF" || 
        cleanUrl.endsWith(".pdf") || 
        cleanUrl.includes(".pdf") ||
        lowerUrl.startsWith("data:application/pdf")
    ) {
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
        cleanUrl.endsWith(".gif") ||
        lowerUrl.startsWith("data:image/")
    ) {
        return true;
    }

    // Plain text / Markdown
    if (
        cleanType === "TEXT" || 
        cleanUrl.endsWith(".txt") || 
        cleanUrl.endsWith(".md") ||
        lowerUrl.startsWith("data:text/")
    ) {
        return true;
    }

    return false;
}

/**
 * Safely opens a browser-viewable file (PDFs and images) in a new tab.
 * 1. Uses the streaming API endpoint `/api/resources/{id}/view` when resourceId is given.
 * 2. Converts Base64 Data URLs to native Blob URLs to bypass browser top-frame security blocks.
 * 3. Opens standard HTTP and relative URLs cleanly.
 */
export function openInBrowserViewer(url: string, title?: string, resourceId?: number | string): void {
    if (typeof window === "undefined") return;

    if (resourceId) {
        window.open(`/api/resources/${resourceId}/view`, "_blank", "noopener,noreferrer");
        return;
    }

    if (!url) return;

    // Handle Data URLs (e.g. data:application/pdf;base64,...)
    if (url.startsWith("data:")) {
        try {
            const parts = url.split(",");
            const mimeMatch = parts[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
            const b64Data = parts[1];
            const byteCharacters = atob(b64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mime });
            const blobUrl = URL.createObjectURL(blob);
            
            const newWindow = window.open(blobUrl, "_blank");
            if (!newWindow) {
                window.location.href = blobUrl;
            }
            return;
        } catch (err) {
            console.error("Failed to convert data URL to Blob URL:", err);
        }
    }

    // Standard HTTP / Vercel Blob / Relative URL
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) {
        window.location.href = url;
    }
}
