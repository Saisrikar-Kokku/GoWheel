
import { verifySmtpConnection, sendEmail } from '../src/services/emailService';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
    console.log('Testing SMTP Connection...');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('User:', process.env.SMTP_USER);

    const isConnected = await verifySmtpConnection();
    if (isConnected) {
        console.log('✅ SMTP Connection Successful!');

        console.log('Sending test email...');
        const result = await sendEmail(
            process.env.SMTP_USER || '',
            'Test Email from Debugger',
            '<p>This is a test email to verify SMTP configuration.</p>'
        );
        console.log('Send Result:', result);
    } else {
        console.error('❌ SMTP Connection FAILED.');
        console.error('Check your internet connection, firewall, or credentials.');
    }
}

test().catch(console.error);
