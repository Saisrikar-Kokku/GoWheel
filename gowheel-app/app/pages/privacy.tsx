import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
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
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.lastUpdated}>Last updated: December 2024</Text>

                <Section title="1. Introduction">
                    <Text style={styles.text}>
                        GoWheel ("we", "our", or "us") is committed to protecting your privacy.
                        This Privacy Policy explains how we collect, use, and safeguard your personal
                        information when you use our vehicle rental marketplace platform.
                    </Text>
                </Section>

                <Section title="2. Information We Collect">
                    <Text style={[styles.text, { marginBottom: 8 }]}>We collect the following types of information:</Text>
                    <BulletPoint text="Account Information: Name, email address, phone number" />
                    <BulletPoint text="Profile Information: Profile picture, user preferences" />
                    <BulletPoint text="Payment Information: Transaction details (processed securely via Razorpay)" />
                    <BulletPoint text="Vehicle Information: Vehicle details listed by owners" />
                    <BulletPoint text="Booking Information: Rental dates, locations, transaction history" />
                    <BulletPoint text="Communication Data: Messages exchanged through our platform" />
                </Section>

                <Section title="3. How We Use Your Information">
                    <BulletPoint text="To provide and maintain our services" />
                    <BulletPoint text="To process bookings and payments" />
                    <BulletPoint text="To communicate with you about your account and bookings" />
                    <BulletPoint text="To improve our platform and user experience" />
                    <BulletPoint text="To comply with legal obligations" />
                    <BulletPoint text="To prevent fraud and ensure platform security" />
                </Section>

                <Section title="4. Data Security">
                    <Text style={styles.text}>
                        We implement industry-standard security measures to protect your data.
                        Payment information is processed securely through Razorpay and we never
                        store your complete payment card details on our servers.
                    </Text>
                </Section>

                <Section title="5. Data Sharing">
                    <Text style={[styles.text, { marginBottom: 8 }]}>We may share your information with:</Text>
                    <BulletPoint text="Other users as necessary for bookings (e.g., your name with vehicle owners)" />
                    <BulletPoint text="Payment processors (Razorpay) for transaction processing" />
                    <BulletPoint text="Law enforcement when required by law" />
                    <Text style={[styles.text, { marginTop: 8 }]}>We do not sell your personal information to third parties.</Text>
                </Section>

                <Section title="6. Your Rights">
                    <BulletPoint text="Access your personal data" />
                    <BulletPoint text="Request correction of inaccurate data" />
                    <BulletPoint text="Request deletion of your account and data" />
                    <BulletPoint text="Opt out of marketing communications" />
                </Section>

                <Section title="7. Contact Us">
                    <Text style={styles.text}>
                        For privacy-related inquiries, please contact us at:
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
    text: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
    bullet: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.textSecondary, marginTop: 10, marginRight: Spacing.sm },
    link: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '600', marginTop: 4 },
    footer: { marginTop: Spacing.xl, alignItems: 'center', paddingVertical: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
    footerText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
