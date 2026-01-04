import { NextResponse } from 'next/server';
import { verifySmtpConnection, sendEmail } from '@/services/emailService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email');
    
    // Check environment variables
    const envStatus = {
        SMTP_HOST: process.env.SMTP_HOST ? '✅ Set' : '❌ Not set',
        SMTP_PORT: process.env.SMTP_PORT ? '✅ Set' : '❌ Not set (using default 587)',
        SMTP_USER: process.env.SMTP_USER ? '✅ Set' : '❌ Not set',
        SMTP_PASS: process.env.SMTP_PASS ? '✅ Set' : '❌ Not set',
        SMTP_FROM: process.env.SMTP_FROM ? '✅ Set' : '❌ Not set (using default)',
    };

    // Test SMTP connection
    const smtpConnected = await verifySmtpConnection();

    // If email provided, send a test email
    let testEmailResult = null;
    if (testEmail && smtpConnected) {
        try {
            await sendEmail(
                testEmail,
                '🧪 GoWheel Test Email',
                `
                    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #fff; border-radius: 10px;">
                        <h2 style="color: #10b981;">✅ Email Service Working!</h2>
                        <p>This is a test email from GoWheel to verify your SMTP configuration is working correctly.</p>
                        <p style="color: #888;">Sent at: ${new Date().toISOString()}</p>
                    </div>
                `
            );
            testEmailResult = '✅ Test email sent successfully!';
        } catch (error) {
            testEmailResult = `❌ Failed to send test email: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }

    return NextResponse.json({
        status: smtpConnected ? 'SMTP Connected' : 'SMTP Not Connected',
        environmentVariables: envStatus,
        smtpVerified: smtpConnected,
        testEmailResult: testEmail 
            ? testEmailResult 
            : 'Add ?email=your@email.com to send a test email',
        tips: !smtpConnected ? [
            'Make sure you have set all SMTP environment variables in .env.local',
            'For Gmail, use an App Password (not your regular password)',
            'To create a Gmail App Password: Google Account → Security → 2-Step Verification → App passwords',
            'Common SMTP settings for Gmail: host=smtp.gmail.com, port=587',
        ] : [],
    });
}
