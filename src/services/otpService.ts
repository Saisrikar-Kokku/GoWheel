// OTP Service for ride verification
// Server-side only - DO NOT import in client components

import crypto from 'crypto';

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

/**
 * Generate a random numeric OTP
 */
export function generateOTP(): string {
    // Generate a cryptographically secure random number
    const min = Math.pow(10, OTP_LENGTH - 1);
    const max = Math.pow(10, OTP_LENGTH) - 1;
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = randomBytes.readUInt32BE(0);
    const otp = min + (randomNumber % (max - min + 1));
    return otp.toString();
}

/**
 * Hash an OTP using SHA-256
 * This ensures OTPs are not stored in plain text
 */
export function hashOTP(otp: string): string {
    return crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');
}

/**
 * Verify an OTP against its hash
 */
export function verifyOTP(otp: string, hash: string): boolean {
    const inputHash = hashOTP(otp);
    // Use timing-safe comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(inputHash, 'hex'),
            Buffer.from(hash, 'hex')
        );
    } catch {
        return false;
    }
}

/**
 * Generate OTP with expiry timestamp
 */
export function generateOTPWithExpiry(): {
    otp: string;
    hash: string;
    expiresAt: string;
} {
    const otp = generateOTP();
    const hash = hashOTP(otp);
    const expiresAt = new Date(
        Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    return { otp, hash, expiresAt };
}

/**
 * Check if OTP has expired
 */
export function isOTPExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
}

/**
 * Validate OTP with expiry check
 */
export function validateOTP(
    inputOTP: string,
    storedHash: string,
    expiresAt: string
): { valid: boolean; error?: string } {
    // Check expiry first
    if (isOTPExpired(expiresAt)) {
        return { valid: false, error: 'OTP has expired. Please request a new one.' };
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(inputOTP)) {
        return { valid: false, error: 'Invalid OTP format. Must be 6 digits.' };
    }

    // Verify hash
    if (!verifyOTP(inputOTP, storedHash)) {
        return { valid: false, error: 'Invalid OTP. Please try again.' };
    }

    return { valid: true };
}

/**
 * OTP types for different purposes
 */
export type OTPPurpose = 'ride_start' | 'ride_end';

/**
 * Format OTP for display (with spaces for readability)
 */
export function formatOTPForDisplay(otp: string): string {
    return `${otp.slice(0, 3)} ${otp.slice(3)}`;
}
