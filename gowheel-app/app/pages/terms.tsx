import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TermsAndConditionsScreen() {
    const router = useRouter();

    const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );

    const BulletPoint = ({ text }: { text: string }) => (
        <View style={styles.bulletRow}>
            <View style={styles.bullet} />
            <Text style={styles.text}>{text}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms & Conditions</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.lastUpdated}>Last updated: December 2024</Text>

                <Section title="1. Introduction">
                    <Text style={styles.text}>
                        Welcome to GoWheel. By accessing or using our platform, you agree to be bound
                        by these Terms and Conditions. GoWheel operates as a peer-to-peer vehicle
                        rental marketplace that connects vehicle owners with renters.
                    </Text>
                </Section>

                <Section title="2. Platform Role">
                    <Text style={[styles.text, { marginBottom: 8 }]}>
                        GoWheel acts solely as an intermediary platform. We do not own, operate,
                        or maintain any vehicles listed on the platform. Vehicle owners are
                        independent parties responsible for their vehicles.
                    </Text>
                    <BulletPoint text="We facilitate connections between owners and renters" />
                    <BulletPoint text="We provide a secure payment processing system" />
                    <BulletPoint text="We do not guarantee the condition of any vehicle" />
                </Section>

                <Section title="3. User Responsibilities">
                    <Text style={[styles.sectionSubtitle, { marginTop: 4 }]}>For Renters:</Text>
                    <BulletPoint text="Possess a valid driving license" />
                    <BulletPoint text="Use vehicles responsibly and lawfully" />
                    <BulletPoint text="Return vehicles on time and in the same condition" />
                    <BulletPoint text="Report any accidents or damages immediately" />

                    <Text style={[styles.sectionSubtitle, { marginTop: 12 }]}>For Owners:</Text>
                    <BulletPoint text="Ensure vehicles are legally registered and insured" />
                    <BulletPoint text="Provide accurate vehicle information" />
                    <BulletPoint text="Maintain vehicles in safe, working condition" />
                    <BulletPoint text="Respond to booking requests promptly" />
                </Section>

                <Section title="4. Booking Process">
                    <BulletPoint text="1. Request: Renter submits a booking request" />
                    <BulletPoint text="2. Approval: Owner reviews and approves/rejects" />
                    <BulletPoint text="3. Payment: Renter completes payment after approval" />
                    <BulletPoint text="4. Confirmation: Booking is confirmed" />
                    <BulletPoint text="5. Rental: Renter collects and uses the vehicle" />
                    <BulletPoint text="6. Completion: Vehicle is returned and marked complete" />
                </Section>

                <Section title="5. Payment Terms">
                    <BulletPoint text="All payments act securely through our payment gateway" />
                    <BulletPoint text="Payment must be completed within 24 hours of booking approval" />
                    <BulletPoint text="Prices shown include all applicable fees" />
                    <BulletPoint text="GoWheel retains a 10% platform commission on each booking" />
                    <BulletPoint text="Owner payouts are processed after rental completion" />
                </Section>

                <Section title="6. Cancellation Policy">
                    <BulletPoint text="Renters may cancel before rental start (refund eligibility varies)" />
                    <BulletPoint text="Owners may cancel anytime before completion (full refund to renter)" />
                    <BulletPoint text="No refunds after rental has started" />
                </Section>

                <Section title="7. Limitation of Liability">
                    <Text style={styles.text}>
                        GoWheel is not liable for any direct, indirect, incidental, or consequential
                        damages arising from the use of vehicles rented through our platform.
                        This includes but is not limited to accidents, theft, vehicle malfunctions,
                        or any disputes between owners and renters.
                    </Text>
                </Section>

                <Section title="8. Dispute Resolution">
                    <Text style={styles.text}>
                        Any disputes between users should first be resolved directly between the parties.
                        If resolution is not possible, users may contact GoWheel support for mediation
                        assistance. GoWheel's decision in dispute resolution shall be final.
                    </Text>
                </Section>

                <Section title="9. Modifications">
                    <Text style={styles.text}>
                        GoWheel reserves the right to modify these Terms and Conditions at any time.
                        Continued use of the platform after changes constitutes acceptance of the
                        modified terms.
                    </Text>
                </Section>

                <Section title="10. Contact">
                    <Text style={styles.text}>
                        For questions about these Terms, please contact us at:
                    </Text>
                    <TouchableOpacity onPress={() => Linking.openURL('mailto:gowheel.support@gmail.com')}>
                        <Text style={styles.link}>gowheel.support@gmail.com</Text>
                    </TouchableOpacity>
                </Section>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>© {new Date().getFullYear()} GoWheel. All rights reserved.</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.card,
        marginTop: 40,
    },
    backButton: { padding: Spacing.sm },
    headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    content: { padding: Spacing.lg, paddingBottom: 40 },
    lastUpdated: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.lg, fontStyle: 'italic' },
    section: { marginBottom: Spacing.xl },
    sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
    sectionSubtitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 4 },
    text: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
    bullet: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.textSecondary, marginTop: 10, marginRight: Spacing.sm },
    link: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '600', marginTop: 4 },
    footer: { marginTop: Spacing.xl, alignItems: 'center', paddingVertical: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
    footerText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
