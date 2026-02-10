
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    console.log('--- SMTP TEST START ---');
    console.log(`Host: ${process.env.SMTP_HOST}`);
    console.log(`Port: ${process.env.SMTP_PORT}`);
    console.log(`User: ${process.env.SMTP_USER}`);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 10000, // 10s timeout
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ Connection Verified!');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: process.env.SMTP_USER, // Send to self
            subject: 'Test Email',
            text: 'It works!',
        });
        console.log('✅ Email sent:', info.messageId);
    } catch (error) {
        console.error('❌ ERROR:', error);
    }
    console.log('--- SMTP TEST END ---');
}

main();
