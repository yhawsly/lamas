import { NextResponse } from "next/server";

// Utility for standardized API error handling

export interface ApiError {
    message: string;
    code?: string;
    status?: number;
}

/**
 * Server-side error handler for Route Handlers
 * Usage: return handleApiError(error, "Failed to fetch data");
 */
export function handleApiError(error: unknown, customMessage?: string) {
    console.error(`[API Error] ${customMessage || "Request failed"}:`, error);

    const message = customMessage || (error instanceof Error ? error.message : "An unexpected error occurred");

    // Determine appropriate status code
    let status = 500;
    if (error instanceof Error) {
        if (error.message.includes("Unauthorized")) status = 401;
        if (error.message.includes("Forbidden")) status = 403;
        if (error.message.includes("not found")) status = 404;
    }

    return NextResponse.json(
        {
            error: message,
            detail: error instanceof Error ? error.message : String(error)
        },
        { status }
    );
}

/**
 * Client-side error handler for fetch responses
 */
export async function handleClientApiError(response: Response): Promise<ApiError> {
    try {
        const data = await response.json();
        return {
            message: data.error || data.message || "An error occurred",
            code: data.code,
            status: response.status,
        };
    } catch {
        return {
            message: `Error ${response.status}: ${response.statusText}`,
            status: response.status,
        };
    }
}

export function isNetworkError(error: unknown): error is Error {
    return error instanceof Error && (error.message === "Network request failed" || error.message.includes("fetch"));
}

export function getErrorMessage(error: unknown): string {
    if (isNetworkError(error)) {
        return "Network error. Please check your connection and try again.";
    }
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

export const ApiErrorMessages = {
    UNAUTHORIZED: "You are not authenticated. Please log in.",
    FORBIDDEN: "You don't have permission to perform this action.",
    NOT_FOUND: "The requested resource was not found.",
    VALIDATION_ERROR: "Please check your input and try again.",
    SERVER_ERROR: "Something went wrong on the server. Please try again later.",
    NETWORK_ERROR: "Network error. Please check your connection.",
};
