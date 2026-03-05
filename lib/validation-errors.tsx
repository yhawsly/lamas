import { ReactNode } from "react";

export interface ValidationError {
    field: string;
    message: string;
}

/**
 * Parse Zod validation errors into a user-friendly format
 */
export function parseValidationErrors(error: any): ValidationError[] {
    if (error.errors && Array.isArray(error.errors)) {
        return error.errors.map((err: any) => ({
            field: err.path?.join(".") || "unknown",
            message: err.message || "Validation failed"
        }));
    }
    return [{ field: "unknown", message: "Validation failed" }];
}

/**
 * Format validation errors for display
 */
export function formatValidationError(error: ValidationError): string {
    return `${error.field}: ${error.message}`;
}

/**
 * Validation error display component
 */
export function ValidationErrorAlert({ errors }: { errors: ValidationError[] }): ReactNode {
    if (errors.length === 0) return null;

    return errors.map((error, idx) => (
        <div
            key={idx}
            className="p-3 rounded-lg text-sm mb-2"
            style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#ef4444"
            }}
        >
            {formatValidationError(error)}
        </div>
    ));
}
