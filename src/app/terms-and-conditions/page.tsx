import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
    title: 'Terms & Conditions - GoWheel',
    description: 'Terms and conditions for using GoWheel vehicle rental marketplace.',
};

export default function TermsAndConditionsPage() {
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
                        <CardTitle className="text-3xl font-bold">Terms & Conditions</CardTitle>
                        <p className="text-muted-foreground text-sm mt-2">
                            Last updated: December 2024
                        </p>
                    </CardHeader>
                    <CardContent className="pt-6 prose prose-invert max-w-none">
                        <div className="space-y-8 text-foreground/90">

                            {/* Introduction */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Welcome to GoWheel. By accessing or using our platform, you agree to be bound
                                    by these Terms and Conditions. GoWheel operates as a peer-to-peer vehicle
                                    rental marketplace that connects vehicle owners with renters.
                                </p>
                            </section>

                            {/* Platform Role */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">2. Platform Role</h2>
                                <p className="text-muted-foreground leading-relaxed mb-3">
                                    GoWheel acts solely as an intermediary platform. We do not own, operate,
                                    or maintain any vehicles listed on the platform. Vehicle owners are
                                    independent parties responsible for their vehicles.
                                </p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                                    <li>We facilitate connections between owners and renters</li>
                                    <li>We provide a secure payment processing system</li>
                                    <li>We do not guarantee the condition of any vehicle</li>
                                </ul>
                            </section>

                            {/* User Responsibilities */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">3. User Responsibilities</h2>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-medium mb-2">For Renters:</h3>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                                            <li>Possess a valid driving license</li>
                                            <li>Use vehicles responsibly and lawfully</li>
                                            <li>Return vehicles on time and in the same condition</li>
                                            <li>Report any accidents or damages immediately</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-2">For Owners:</h3>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                                            <li>Ensure vehicles are legally registered and insured</li>
                                            <li>Provide accurate vehicle information</li>
                                            <li>Maintain vehicles in safe, working condition</li>
                                            <li>Respond to booking requests promptly</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Booking Process */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">4. Booking Process</h2>
                                <ol className="list-decimal list-inside text-muted-foreground space-y-2 ml-2">
                                    <li><strong>Request:</strong> Renter submits a booking request for desired dates</li>
                                    <li><strong>Approval:</strong> Owner reviews and approves/rejects the request</li>
                                    <li><strong>Payment:</strong> Renter completes payment after approval</li>
                                    <li><strong>Confirmation:</strong> Booking is confirmed upon successful payment</li>
                                    <li><strong>Rental:</strong> Renter collects and uses the vehicle</li>
                                    <li><strong>Completion:</strong> Vehicle is returned and rental is marked complete</li>
                                </ol>
                            </section>

                            {/* Payment Terms */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">5. Payment Terms</h2>
                                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                                    <li>All payments are processed securely through our payment gateway</li>
                                    <li>Payment must be completed within 24 hours of booking approval</li>
                                    <li>Prices shown include all applicable fees</li>
                                    <li>GoWheel retains a 10% platform commission on each booking</li>
                                    <li>Owner payouts are processed after rental completion</li>
                                </ul>
                            </section>

                            {/* Cancellation Policy */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">6. Cancellation Policy</h2>
                                <p className="text-muted-foreground leading-relaxed mb-3">
                                    For detailed information about refunds and cancellations, please refer to
                                    our <Link href="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>.
                                </p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                                    <li>Renters may cancel before rental start (refund eligibility varies)</li>
                                    <li>Owners may cancel anytime before completion (full refund to renter)</li>
                                    <li>No refunds after rental has started</li>
                                </ul>
                            </section>

                            {/* Limitation of Liability */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    GoWheel is not liable for any direct, indirect, incidental, or consequential
                                    damages arising from the use of vehicles rented through our platform.
                                    This includes but is not limited to accidents, theft, vehicle malfunctions,
                                    or any disputes between owners and renters.
                                </p>
                            </section>

                            {/* Disputes */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">8. Dispute Resolution</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Any disputes between users should first be resolved directly between the parties.
                                    If resolution is not possible, users may contact GoWheel support for mediation
                                    assistance. GoWheel&apos;s decision in dispute resolution shall be final.
                                </p>
                            </section>

                            {/* Modifications */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">9. Modifications</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    GoWheel reserves the right to modify these Terms and Conditions at any time.
                                    Continued use of the platform after changes constitutes acceptance of the
                                    modified terms.
                                </p>
                            </section>

                            {/* Contact */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    For questions about these Terms and Conditions, please contact us at{' '}
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
