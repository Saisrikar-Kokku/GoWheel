// Razorpay SDK Loader and Payment Integration

declare global {
    interface Window {
        Razorpay: any;
    }
}

let razorpayLoaded = false;

/**
 * Load Razorpay Checkout JS SDK dynamically
 */
export function loadRazorpaySDK(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (razorpayLoaded && window.Razorpay) {
            resolve();
            return;
        }

        // Check if already loading
        const existingScript = document.querySelector('script[src*="razorpay"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => {
                razorpayLoaded = true;
                resolve();
            });
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;

        script.onload = () => {
            razorpayLoaded = true;
            resolve();
        };

        script.onerror = () => {
            reject(new Error('Failed to load Razorpay SDK'));
        };

        document.head.appendChild(script);
    });
}

export interface RazorpayPaymentResult {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

export interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    name: string;
    description: string;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    theme?: {
        color?: string;
    };
    handler: (response: RazorpayPaymentResult) => void;
    modal?: {
        ondismiss?: () => void;
    };
}

/**
 * Create payment order and initiate Razorpay checkout
 */
export async function createAndInitiatePayment(
    bookingId: string,
    customerDetails: { email?: string; phone?: string; name?: string }
): Promise<{ success: boolean; error?: string }> {
    try {
        // Load Razorpay SDK first
        await loadRazorpaySDK();

        // Create order via API
        const response = await fetch('/api/payments/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bookingId,
                customerEmail: customerDetails.email,
                customerPhone: customerDetails.phone,
                customerName: customerDetails.name,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create payment order');
        }

        const { order_id, amount, currency, key_id } = await response.json();

        // Return a promise that resolves when payment is complete
        return new Promise((resolve) => {
            const options: RazorpayOptions = {
                key: key_id,
                amount: amount,
                currency: currency,
                order_id: order_id,
                name: 'GoWheel',
                description: 'Vehicle Rental Booking Payment',
                prefill: {
                    name: customerDetails.name || '',
                    email: customerDetails.email || '',
                    contact: customerDetails.phone || '',
                },
                theme: {
                    color: '#10b981', // Emerald green to match brand
                },
                handler: async (paymentResult: RazorpayPaymentResult) => {
                    // Verify payment on server
                    try {
                        const verifyResponse = await fetch('/api/payments/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                bookingId,
                                razorpay_order_id: paymentResult.razorpay_order_id,
                                razorpay_payment_id: paymentResult.razorpay_payment_id,
                                razorpay_signature: paymentResult.razorpay_signature,
                            }),
                        });

                        const verifyResult = await verifyResponse.json();

                        if (verifyResult.status === 'paid') {
                            // Reload page to show updated status
                            window.location.reload();
                            resolve({ success: true });
                        } else {
                            resolve({
                                success: false,
                                error: verifyResult.error || 'Payment verification failed',
                            });
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        resolve({
                            success: false,
                            error: 'Payment verification failed. Please check your booking status.',
                        });
                    }
                },
                modal: {
                    ondismiss: () => {
                        resolve({
                            success: false,
                            error: 'Payment cancelled by user',
                        });
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        });

    } catch (error: any) {
        console.error('Payment initiation error:', error);
        return {
            success: false,
            error: error.message || 'Payment initiation failed'
        };
    }
}
