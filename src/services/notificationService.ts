// Notification Service - WhatsApp & other notification channels
// Server-side only - for API routes

import { BookingWithDetails } from '@/types/booking';
import { DEFAULT_SECURITY_DEPOSIT_TEXT } from '@/types/rideInspection';

// Types for notification service
export interface WhatsAppMessage {
    to: string; // Phone number with country code
    message: string;
}

export interface BookingNotificationData {
    booking: BookingWithDetails;
    vehicleRegistration?: string;
    renterPhone?: string;
    ownerPhone?: string;
    securityDepositText?: string;
}

export interface NotificationResult {
    success: boolean;
    channel: 'whatsapp' | 'sms' | 'email';
    error?: string;
    messageId?: string;
}

/**
 * Format phone number for WhatsApp API
 * Ensures number has country code (defaults to India +91)
 */
export function formatPhoneForWhatsApp(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, remove it
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    
    // If 10 digits, assume Indian number and add 91
    if (cleaned.length === 10) {
        cleaned = '91' + cleaned;
    }
    
    // If doesn't start with country code, add 91
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
        cleaned = '91' + cleaned;
    }
    
    return cleaned;
}

/**
 * Format date for display in messages
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Generate booking confirmation message for owner
 */
export function generateOwnerBookingMessage(data: BookingNotificationData): string {
    const { booking, vehicleRegistration, securityDepositText } = data;
    const vehicle = booking.vehicle;
    const renter = booking.renter;

    const depositText = securityDepositText || DEFAULT_SECURITY_DEPOSIT_TEXT;

    return `🚗 *New Booking Confirmed!*

*Vehicle:* ${vehicle?.title || 'N/A'}
*Registration:* ${vehicleRegistration || vehicle?.registration_number || 'N/A'}
*Type:* ${vehicle?.vehicle_type === 'car' ? '🚗 Car' : '🏍️ Bike'}

*Renter Details:*
• Name: ${renter?.full_name || 'N/A'}
• Phone: ${renter?.phone || 'Not provided'}
• Email: ${renter?.email || 'Not provided'}

*Booking Period:*
• Start: ${formatDate(booking.start_date)}
• End: ${formatDate(booking.end_date)}

*Amount:* ₹${booking.total_amount.toLocaleString('en-IN')}

*Security Deposit Terms:*
${depositText}

---
Please ensure you meet the renter at the scheduled time. Generate the ride start OTP when ready to hand over the vehicle.

Thank you for using GoWheel! 🙏`;
}

/**
 * Generate booking confirmation message for renter
 */
export function generateRenterBookingMessage(data: BookingNotificationData): string {
    const { booking, securityDepositText } = data;
    const vehicle = booking.vehicle;
    const owner = booking.owner;

    const depositText = securityDepositText || DEFAULT_SECURITY_DEPOSIT_TEXT;

    return `✅ *Booking Confirmed!*

*Vehicle:* ${vehicle?.title || 'N/A'}
*Type:* ${vehicle?.vehicle_type === 'car' ? '🚗 Car' : '🏍️ Bike'}
*Location:* ${vehicle?.location || 'N/A'}

*Owner:* ${owner?.full_name || 'N/A'}

*Booking Period:*
• Start: ${formatDate(booking.start_date)}
• End: ${formatDate(booking.end_date)}

*Amount Paid:* ₹${booking.total_amount.toLocaleString('en-IN')}

*Security Deposit Required:*
${depositText}

*Important:*
1. Upload vehicle photos before ride start
2. Get OTP from owner to start ride
3. Return vehicle on time
4. Get end OTP from owner

Thank you for choosing GoWheel! 🚀`;
}

/**
 * Send WhatsApp message via API provider
 * This is an abstracted function - implement with actual provider (Twilio, Meta, etc.)
 */
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<NotificationResult> {
    // Check if WhatsApp is configured
    const whatsappApiKey = process.env.WHATSAPP_API_KEY;
    const whatsappApiUrl = process.env.WHATSAPP_API_URL;

    if (!whatsappApiKey || !whatsappApiUrl) {
        // WhatsApp not configured - return success in dev mode to not break the flow
        return {
            success: true,
            channel: 'whatsapp',
            messageId: `dev_${Date.now()}`,
        };
    }

    try {
        // Example implementation for Twilio WhatsApp
        // Replace with actual provider implementation
        const response = await fetch(whatsappApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${whatsappApiKey}`,
            },
            body: JSON.stringify({
                to: `whatsapp:+${message.to}`,
                body: message.message,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('[WhatsApp] API error:', error);
            return {
                success: false,
                channel: 'whatsapp',
                error: 'Failed to send WhatsApp message',
            };
        }

        const result = await response.json();
        return {
            success: true,
            channel: 'whatsapp',
            messageId: result.sid || result.messageId,
        };
    } catch (error) {
        console.error('[WhatsApp] Error sending message:', error);
        return {
            success: false,
            channel: 'whatsapp',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Send booking confirmation notification to owner
 * Non-blocking - logs errors but doesn't throw
 */
export async function notifyOwnerOfBooking(data: BookingNotificationData): Promise<NotificationResult> {
    const ownerPhone = data.ownerPhone || data.booking.owner?.phone;
    
    if (!ownerPhone) {
        return {
            success: false,
            channel: 'whatsapp',
            error: 'Owner phone number not available',
        };
    }

    const message = generateOwnerBookingMessage(data);
    const formattedPhone = formatPhoneForWhatsApp(ownerPhone);

    return sendWhatsAppMessage({
        to: formattedPhone,
        message,
    });
}

/**
 * Send booking confirmation notification to renter
 */
export async function notifyRenterOfBooking(data: BookingNotificationData): Promise<NotificationResult> {
    const renterPhone = data.renterPhone || data.booking.renter?.phone;
    
    if (!renterPhone) {
        return {
            success: false,
            channel: 'whatsapp',
            error: 'Renter phone number not available',
        };
    }

    const message = generateRenterBookingMessage(data);
    const formattedPhone = formatPhoneForWhatsApp(renterPhone);

    return sendWhatsAppMessage({
        to: formattedPhone,
        message,
    });
}

/**
 * Send OTP via WhatsApp
 */
export async function sendOTPViaWhatsApp(
    phone: string,
    otp: string,
    purpose: 'ride_start' | 'ride_end'
): Promise<NotificationResult> {
    const purposeText = purpose === 'ride_start' ? 'Start Ride' : 'End Ride';
    
    const message = `🔐 *GoWheel ${purposeText} OTP*

Your OTP is: *${otp.slice(0, 3)} ${otp.slice(3)}*

This OTP is valid for 10 minutes.

⚠️ Do not share this OTP with anyone.`;

    return sendWhatsAppMessage({
        to: formatPhoneForWhatsApp(phone),
        message,
    });
}

/**
 * Log notification for debugging/audit
 * In production, this could be replaced with proper logging service
 */
export function logNotification(
    _type: string,
    _recipient: string,
    _result: NotificationResult
): void {
    // Silent in production - implement proper logging service if needed
}
