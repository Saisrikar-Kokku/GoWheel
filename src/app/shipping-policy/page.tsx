import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
    title: 'Shipping & Delivery Policy - GoWheel',
    description: 'Shipping and delivery policy for GoWheel vehicle rental marketplace.',
};

export default function ShippingPolicyPage() {
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
                        <CardTitle className="text-3xl font-bold">Shipping & Delivery Policy</CardTitle>
                        <p className="text-muted-foreground text-sm mt-2">
                            Last updated: December 2024
                        </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-8 text-foreground/90">

                            {/* Introduction */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">Service Nature</h2>
                                <div className="bg-muted/30 rounded-lg p-4 mb-4">
                                    <p className="text-muted-foreground leading-relaxed">
                                        <strong className="text-foreground">Important:</strong> GoWheel is a peer-to-peer vehicle rental
                                        marketplace. We do not ship physical products. This policy explains
                                        how vehicle handover works between owners and renters.
                                    </p>
                                </div>
                            </section>

                            {/* Vehicle Pickup */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">Vehicle Pickup</h2>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                                    <li>Vehicles are picked up directly from the vehicle owner</li>
                                    <li>Pickup location is specified in the vehicle listing</li>
                                    <li>Renter must collect the vehicle at the agreed start time</li>
                                    <li>Owner provides vehicle keys and necessary documents at pickup</li>
                                </ul>
                            </section>

                            {/* Vehicle Return */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">Vehicle Return</h2>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                                    <li>Vehicle must be returned to the same pickup location</li>
                                    <li>Return must happen at or before the agreed end time</li>
                                    <li>Vehicle should be returned in the same condition as received</li>
                                    <li>Late returns may incur additional charges</li>
                                </ul>
                            </section>

                            {/* No Physical Shipping */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">No Physical Shipping</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    As a vehicle rental service:
                                </p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2 mt-2">
                                    <li>We do not ship or deliver any physical goods</li>
                                    <li>No courier or postal services are involved</li>
                                    <li>All transactions are for rental services only</li>
                                    <li>Service is delivered immediately upon vehicle handover</li>
                                </ul>
                            </section>

                            {/* Service Delivery */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">Service Delivery Timeline</h2>
                                <div className="bg-muted/30 rounded-lg p-4">
                                    <table className="w-full text-sm">
                                        <tbody className="text-muted-foreground">
                                            <tr className="border-b border-border/30">
                                                <td className="py-2 font-medium">Booking Confirmation</td>
                                                <td className="py-2">Immediate after payment</td>
                                            </tr>
                                            <tr className="border-b border-border/30">
                                                <td className="py-2 font-medium">Service Start</td>
                                                <td className="py-2">At scheduled pickup time</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 font-medium">Service End</td>
                                                <td className="py-2">Upon vehicle return</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* Contact */}
                            <section>
                                <h2 className="text-xl font-semibold mb-3">Questions?</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    For questions about vehicle pickup or returns, contact us at{' '}
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
