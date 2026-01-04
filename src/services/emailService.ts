import nodemailer from 'nodemailer';

// SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'GoWheel <noreply@gowheel.com>';

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465, // true for 465, false for other ports
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
};

// Email templates
const emailTemplates = {
    bookingConfirmation: (data: {
        recipientName: string;
        vehicleTitle: string;
        bookingDate: string;
        startTime: string;
        endTime: string;
        totalAmount: number;
        pickupLocation: string;
        bookingId: string;
    }) => ({
        subject: `🎉 Booking Confirmed - ${data.vehicleTitle}`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #10b981, #14b8a6); padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">🚗 GoWheel</h1>
                    <p style="margin: 10px 0 0; opacity: 0.9;">Your ride is confirmed!</p>
                </div>
                
                <div style="padding: 30px;">
                    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${data.recipientName},</p>
                    
                    <p style="color: #a1a1aa; line-height: 1.6;">Your booking has been confirmed and payment received. Here are your booking details:</p>
                    
                    <div style="background: #18181b; border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px 0; color: #a1a1aa;">Vehicle</td>
                                <td style="padding: 10px 0; text-align: right; font-weight: 600;">${data.vehicleTitle}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #a1a1aa;">Date</td>
                                <td style="padding: 10px 0; text-align: right;">${data.bookingDate}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #a1a1aa;">Time</td>
                                <td style="padding: 10px 0; text-align: right;">${data.startTime} - ${data.endTime}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #a1a1aa;">Pickup Location</td>
                                <td style="padding: 10px 0; text-align: right;">${data.pickupLocation}</td>
                            </tr>
                            <tr style="border-top: 1px solid #27272a;">
                                <td style="padding: 15px 0 10px; color: #a1a1aa; font-weight: 600;">Total Paid</td>
                                <td style="padding: 15px 0 10px; text-align: right; font-size: 20px; color: #10b981; font-weight: 700;">₹${data.totalAmount}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background: #422006; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #fbbf24; font-size: 14px;">
                            <strong>⚠️ Security Deposit:</strong> Please carry ₹500-₹2000 in cash for the refundable security deposit.
                        </p>
                    </div>
                    
                    <p style="color: #a1a1aa; font-size: 14px; margin-top: 20px;">
                        Booking ID: <code style="background: #27272a; padding: 2px 8px; border-radius: 4px;">${data.bookingId}</code>
                    </p>
                </div>
                
                <div style="background: #18181b; padding: 20px; text-align: center; border-top: 1px solid #27272a;">
                    <p style="margin: 0; color: #71717a; font-size: 12px;">© 2026 GoWheel. Happy Riding! 🏍️</p>
                </div>
            </div>
        `,
    }),

    ownerNewBooking: (data: {
        ownerName: string;
        renterName: string;
        vehicleTitle: string;
        bookingDate: string;
        startTime: string;
        endTime: string;
        totalAmount: number;
        renterPhone?: string;
        bookingId: string;
    }) => ({
        subject: `🎊 New Booking! - ${data.vehicleTitle}`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">🚗 GoWheel</h1>
                    <p style="margin: 10px 0 0; opacity: 0.9;">You have a new booking!</p>
                </div>
                
                <div style="padding: 30px;">
                    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${data.ownerName},</p>
                    
                    <p style="color: #a1a1aa; line-height: 1.6;">Great news! <strong style="color: #ffffff;">${data.renterName}</strong> has booked your vehicle.</p>
                    
                    <div style="background: #18181b; border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px 0; color: #a1a1aa;">Vehicle</td>
                                <td style="padding: 10px 0; text-align: right; font-weight: 600;">${data.vehicleTitle}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #a1a1aa;">Renter</td>
                                <td style="padding: 10px 0; text-align: right;">${data.renterName}</td>
                            </tr>
                            ${data.renterPhone ? `
                            <tr>
                                <td style="padding: 10px 0; color: #a1a1aa;">Renter Phone</td>
                                <td style="padding: 10px 0; text-align: right;">${data.renterPhone}</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td style="padding: 10px 0; color: #a1a1aa;">Date</td>
                                <td style="padding: 10px 0; text-align: right;">${data.bookingDate}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #a1a1aa;">Time</td>
                                <td style="padding: 10px 0; text-align: right;">${data.startTime} - ${data.endTime}</td>
                            </tr>
                            <tr style="border-top: 1px solid #27272a;">
                                <td style="padding: 15px 0 10px; color: #a1a1aa; font-weight: 600;">Your Earnings</td>
                                <td style="padding: 15px 0 10px; text-align: right; font-size: 20px; color: #10b981; font-weight: 700;">₹${Math.round(data.totalAmount * 0.9)}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background: #052e16; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #4ade80; font-size: 14px;">
                            <strong>💡 Next Steps:</strong> Remember to collect the security deposit and generate OTP when the renter arrives.
                        </p>
                    </div>
                    
                    <p style="color: #a1a1aa; font-size: 14px; margin-top: 20px;">
                        Booking ID: <code style="background: #27272a; padding: 2px 8px; border-radius: 4px;">${data.bookingId}</code>
                    </p>
                </div>
                
                <div style="background: #18181b; padding: 20px; text-align: center; border-top: 1px solid #27272a;">
                    <p style="margin: 0; color: #71717a; font-size: 12px;">© 2026 GoWheel. Happy Earnings! 💰</p>
                </div>
            </div>
        `,
    }),

    rideOTP: (data: {
        recipientName: string;
        otp: string;
        vehicleTitle: string;
        otpType: 'start' | 'end';
        expiresIn: string;
    }) => ({
        subject: `🔐 Your ${data.otpType === 'start' ? 'Ride Start' : 'Ride End'} OTP - ${data.otp}`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">🔐 OTP Verification</h1>
                    <p style="margin: 10px 0 0; opacity: 0.9;">${data.otpType === 'start' ? 'Start your ride' : 'Complete your ride'}</p>
                </div>
                
                <div style="padding: 30px; text-align: center;">
                    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${data.recipientName},</p>
                    
                    <p style="color: #a1a1aa; line-height: 1.6;">
                        ${data.otpType === 'start' 
                            ? 'Use this OTP to start your ride on' 
                            : 'Use this OTP to complete your ride on'
                        } <strong style="color: #ffffff;">${data.vehicleTitle}</strong>
                    </p>
                    
                    <div style="background: #18181b; border-radius: 16px; padding: 30px; margin: 30px 0; display: inline-block;">
                        <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 10px;">Your OTP</p>
                        <div style="font-size: 48px; font-weight: 700; letter-spacing: 12px; color: #10b981; font-family: monospace;">
                            ${data.otp}
                        </div>
                    </div>
                    
                    <div style="background: #451a03; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #fbbf24; font-size: 14px;">
                            ⏰ This OTP expires in <strong>${data.expiresIn}</strong>
                        </p>
                    </div>
                    
                    <p style="color: #71717a; font-size: 13px; margin-top: 20px;">
                        If you didn't request this OTP, please ignore this email.
                    </p>
                </div>
                
                <div style="background: #18181b; padding: 20px; text-align: center; border-top: 1px solid #27272a;">
                    <p style="margin: 0; color: #71717a; font-size: 12px;">© 2026 GoWheel. Safe Riding! 🛡️</p>
                </div>
            </div>
        `,
    }),
};

/**
 * Send an email using SMTP
 */
export async function sendEmail(
    to: string,
    subject: string,
    html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Check if SMTP is configured
    if (!SMTP_USER || !SMTP_PASS) {
        return { success: true, messageId: 'smtp-not-configured' };
    }

    try {
        const transporter = createTransporter();
        
        const info = await transporter.sendMail({
            from: SMTP_FROM,
            to,
            subject,
            html,
        });

        return { success: true, messageId: info.messageId };
    } catch (error) {
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
}

/**
 * Send booking confirmation email to renter
 */
export async function sendBookingConfirmationEmail(
    renterEmail: string,
    data: {
        renterName: string;
        vehicleTitle: string;
        bookingDate: string;
        startTime: string;
        endTime: string;
        totalAmount: number;
        pickupLocation: string;
        bookingId: string;
    }
): Promise<{ success: boolean; error?: string }> {
    const template = emailTemplates.bookingConfirmation({
        recipientName: data.renterName,
        ...data,
    });

    return sendEmail(renterEmail, template.subject, template.html);
}

/**
 * Send new booking notification email to owner
 */
export async function sendOwnerBookingNotificationEmail(
    ownerEmail: string,
    data: {
        ownerName: string;
        renterName: string;
        vehicleTitle: string;
        bookingDate: string;
        startTime: string;
        endTime: string;
        totalAmount: number;
        renterPhone?: string;
        bookingId: string;
    }
): Promise<{ success: boolean; error?: string }> {
    const template = emailTemplates.ownerNewBooking(data);

    return sendEmail(ownerEmail, template.subject, template.html);
}

/**
 * Send OTP email for ride start/end
 */
export async function sendOTPEmail(
    email: string,
    data: {
        recipientName: string;
        otp: string;
        vehicleTitle: string;
        otpType: 'start' | 'end';
    }
): Promise<{ success: boolean; error?: string }> {
    const template = emailTemplates.rideOTP({
        ...data,
        expiresIn: '10 minutes',
    });

    return sendEmail(email, template.subject, template.html);
}

/**
 * Verify SMTP connection
 */
export async function verifySmtpConnection(): Promise<boolean> {
    if (!SMTP_USER || !SMTP_PASS) {
        return false;
    }

    try {
        const transporter = createTransporter();
        await transporter.verify();
        return true;
    } catch {
        return false;
    }
}
