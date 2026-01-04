import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
    title: 'Contact Us - GoWheel',
    description: 'Get in touch with GoWheel support team for any queries or assistance.',
};

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4">
                    <Link href="/" className="text-xl font-bold text-primary">
                        GoWheel
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto max-w-2xl px-4 py-12">
                <Card className="bg-card/50 border-border/50">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-3xl font-bold">Contact Us</CardTitle>
                        <p className="text-muted-foreground mt-2">
                            We&apos;re here to help with any questions or concerns
                        </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-8">
                            {/* Platform Info */}
                            <div className="text-center">
                                <h2 className="text-lg font-semibold mb-2">GoWheel</h2>
                                <p className="text-muted-foreground">
                                    Your trusted peer-to-peer vehicle rental marketplace
                                </p>
                            </div>

                            {/* Contact Details */}
                            <div className="bg-muted/30 rounded-lg p-6 text-center">
                                <h3 className="font-medium mb-4">Get in Touch</h3>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-muted-foreground">Email: </span>
                                        <a
                                            href="mailto:gowheel.support@gmail.com"
                                            className="text-primary hover:underline font-medium"
                                        >
                                            gowheel.support@gmail.com
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Support Hours */}
                            <div className="text-center text-sm text-muted-foreground">
                                <p>
                                    Our support team typically responds within 24-48 hours.
                                </p>
                                <p className="mt-2">
                                    For urgent matters related to ongoing rentals, please include
                                    your booking ID in the email subject line.
                                </p>
                            </div>

                            {/* Quick Links */}
                            <div className="pt-4 border-t border-border/50">
                                <h3 className="font-medium mb-3 text-center">Helpful Links</h3>
                                <div className="flex flex-wrap justify-center gap-4 text-sm">
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
