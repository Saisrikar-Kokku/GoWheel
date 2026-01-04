import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
    title: 'Refund Policy - GoWheel',
    description: 'Refund and cancellation policy for GoWheel vehicle rental marketplace.',
};

export default function RefundPolicyPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <Link href="/" className="text-xl font-bold text-primary">
                        GoWheel
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto max-w-3xl px-4 py-12">
                <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-3xl font-bold">Refund Policy</CardTitle>
                        <p className="text-muted-foreground text-sm mt-2">
                            Last updated: December 2024
                        </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-8 text-foreground/90">

                            {/* Introduction */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">Overview</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    At GoWheel, we understand that plans can change. This policy outlines
                                    when and how refunds are processed for cancelled bookings on our platform.
                                </p>
                            </section>

                            {/* Refund Eligibility */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">Refund Eligibility</h2>

                                {/* Refund Table */}
                                <div className="bg-muted/30 rounded-lg p-4 mb-4">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border/50">
                                                <th className="text-left py-2 font-medium">Cancellation Scenario</th>
                                                <th className="text-right py-2 font-medium">Refund Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-muted-foreground">
                                            <tr className="border-b border-border/30">
                                                <td className="py-3">Renter cancels more than 24 hours before rental start</td>
                                                <td className="text-right text-green-400 font-medium">100% Refund</td>
                                            </tr>
                                            <tr className="border-b border-border/30">
                                                <td className="py-3">Renter cancels within 24 hours of rental start</td>
                                                <td className="text-right text-yellow-400 font-medium">50% Refund</td>
                                            </tr>
                                            <tr className="border-b border-border/30">
                                                <td className="py-3">Renter cancels after rental has started</td>
                                                <td className="text-right text-red-400 font-medium">No Refund</td>
                                            </tr>
                                            <tr>
                                                <td className="py-3">Owner cancels the booking</td>
                                                <td className="text-right text-green-400 font-medium">100% Refund</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* When Refunds Apply */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">When Refunds Are Processed</h2>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                                    <li>
                                        <strong>Booking cancellation by renter:</strong> Refund is calculated based on
                                        how far in advance the cancellation is made (see table above)
                                    </li>
                                    <li>
                                        <strong>Booking cancellation by owner:</strong> Full refund is automatically
                                        processed to the renter
                                    </li>
                                    <li>
                                        <strong>Payment failure:</strong> If payment fails after approval, no refund
                                        is needed as no money was collected
                                    </li>
                                </ul>
                            </section>

                            {/* When Refunds Don't Apply */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">When Refunds Do Not Apply</h2>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                                    <li>Cancellation requested after the rental period has begun</li>
                                    <li>No-show by the renter without prior cancellation</li>
                                    <li>Violation of rental terms resulting in early termination</li>
                                    <li>Damage to the vehicle caused by the renter</li>
                                </ul>
                            </section>

                            {/* Refund Process */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">Refund Process</h2>
                                <ol className="list-decimal list-inside text-muted-foreground space-y-2 ml-2">
                                    <li>Cancellation is initiated through the GoWheel platform</li>
                                    <li>Refund eligibility is automatically calculated based on timing</li>
                                    <li>Refund request is submitted to our payment processor</li>
                                    <li>Refund is credited to the original payment method</li>
                                </ol>
                            </section>

                            {/* Processing Time */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">Refund Timeline</h2>
                                <div className="bg-muted/30 rounded-lg p-4">
                                    <p className="text-muted-foreground leading-relaxed">
                                        Refunds are typically processed within <strong className="text-foreground">5-7 business days</strong> after
                                        the cancellation is confirmed. The exact timing may vary depending on
                                        your bank or payment provider.
                                    </p>
                                    <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-3 ml-2 text-sm">
                                        <li>Credit/Debit Cards: 5-7 business days</li>
                                        <li>UPI: 3-5 business days</li>
                                        <li>Net Banking: 5-7 business days</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Payment Method */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">Refund Payment Method</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    All refunds are processed to the <strong className="text-foreground">original payment method</strong> used
                                    during the booking. We do not process refunds to alternative accounts or
                                    payment methods.
                                </p>
                            </section>

                            {/* Contact for Refunds */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">Refund Inquiries</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    If you have questions about a refund or haven&apos;t received your refund
                                    within the expected timeframe, please contact us at{' '}
                                    <a href="mailto:gowheel.support@gmail.com" className="text-primary hover:underline">
                                        gowheel.support@gmail.com
                                    </a>
                                    {' '}with your booking ID.
                                </p>
                            </section>

                        </div>

                        {/* Quick Links */}
                        <div className="pt-8 mt-8 border-t border-border/50">
                            <div className="flex flex-wrap justify-center gap-4 text-sm">
                                <Link href="/contact" className="text-primary hover:underline">
                                    Contact Us
                                </Link>
                                <Link href="/terms-and-conditions" className="text-primary hover:underline">
                                    Terms & Conditions
                                </Link>
                                <Link href="/" className="text-primary hover:underline">
                                    Home
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/50 py-6">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} GoWheel. All rights reserved.</p>
                    <p className="text-xs mt-1">A product of <span className="font-medium">IPPAPULA SAI KRISHNA</span></p>
                </div>
            </footer>
        </div>
    );
}
