import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const toEmail = searchParams.get('email');

    // User provided credentials (HARDCODED FOR DEBUGGING ONLY)
    // I will delete this file after testing.
    const SMTP_HOST = 'smtp.gmail.com';
    const SMTP_PORT = 587;
    const SMTP_USER = 'saisrikarkokku7674@gmail.com';
    const SMTP_PASS = 'jsskxeespyrzebiy';
    const SMTP_FROM = 'support@gowheel.com';

    if (!toEmail) {
        return NextResponse.json({ error: 'Please add ?email=your@gmail.com to the URL' });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });

        await transporter.verify();

        const info = await transporter.sendMail({
            from: SMTP_FROM,
            to: toEmail,
            subject: '🔥 Hardcoded SMTP Test',
            html: '<h1>If you see this, the credentials are correct!</h1><p>The issue is definitely Vercel Environment Variables not loading.</p>',
        });

        return NextResponse.json({
            success: true,
            message: 'Email sent successfully!',
            messageId: info.messageId
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
}
