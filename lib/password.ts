import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    if (!password || password.length < 8) {
        throw new Error("Password must be at least 8 characters");
    }
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Check if a password is already hashed (starts with $2a, $2b, or $2y)
 */
export function isPasswordHashed(password: string): boolean {
    return /^\$2[aby]\$/.test(password);
}
