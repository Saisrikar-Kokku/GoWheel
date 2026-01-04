import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
    title: 'Privacy Policy - GoWheel',
    description: 'Privacy policy for GoWheel vehicle rental marketplace.',
};

export default function PrivacyPolicyPage() {
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
                        <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
                        <p className="text-muted-foreground text-sm mt-2">
                            Last updated: December 2024
                        </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-8 text-foreground/90">

                            {/* Introduction */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    GoWheel (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
                                    This Privacy Policy explains how we collect, use, and safeguard your personal
                                    information when you use our vehicle rental marketplace platform.
                                </p>
                            </section>

                            {/* Information We Collect */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
                                <div className="space-y-3">
                                    <p className="text-muted-foreground leading-relaxed">
                                        We collect the following types of information:
                                    </p>
                                    <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                                        <li><strong>Account Information:</strong> Name, email address, phone number</li>
                                        <li><strong>Profile Information:</strong> Profile picture, user preferences</li>
                                        <li><strong>Payment Information:</strong> Transaction details (processed securely via Razorpay)</li>
                                        <li><strong>Vehicle Information:</strong> Vehicle details listed by owners</li>
                                        <li><strong>Booking Information:</strong> Rental dates, locations, transaction history</li>
                                        <li><strong>Communication Data:</strong> Messages exchanged through our platform</li>
                                    </ul>
                                </div>
                            </section>

                            {/* How We Use Information */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                                    <li>To provide and maintain our services</li>
                                    <li>To process bookings and payments</li>
                                    <li>To communicate with you about your account and bookings</li>
                                    <li>To improve our platform and user experience</li>
                                    <li>To comply with legal obligations</li>
                                    <li>To prevent fraud and ensure platform security</li>
                                </ul>
                            </section>

                            {/* Data Security */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    We implement industry-standard security measures to protect your data.
                                    Payment information is processed securely through Razorpay and we never
                                    store your complete payment card details on our servers.
                                </p>
                            </section>

                            {/* Data Sharing */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">5. Data Sharing</h2>
                                <p className="text-muted-foreground leading-relaxed mb-3">
                                    We may share your information with:
                                </p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                                    <li>Other users as necessary for bookings (e.g., your name with vehicle owners)</li>
                                    <li>Payment processors (Razorpay) for transaction processing</li>
                                    <li>Law enforcement when required by law</li>
                                </ul>
                                <p className="text-muted-foreground leading-relaxed mt-3">
                                    We do not sell your personal information to third parties.
                                </p>
                            </section>

                            {/* Your Rights */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                                    <li>Access your personal data</li>
                                    <li>Request correction of inaccurate data</li>
                                    <li>Request deletion of your account and data</li>
                                    <li>Opt out of marketing communications</li>
                                </ul>
                            </section>

                            {/* Cookies */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">7. Cookies</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    We use cookies to maintain your session, remember your preferences,
                                    and improve your experience. You can control cookie settings through
                                    your browser.
                                </p>
                            </section>

                            {/* Contact */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">8. Contact Us</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    For privacy-related inquiries, please contact us at{' '}
                                    <a href="mailto:gowheel.support@gmail.com" className="text-primary hover:underline">
                                        gowheel.support@gmail.com
                                    </a>
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
                                <Link href="/refund-policy" className="text-primary hover:underline">
                                    Refund Policy
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
