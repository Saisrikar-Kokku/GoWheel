import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, Radius, cardShadow } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ContactScreen() {
    const router = useRouter();

    const handleEmail = () => {
        Linking.openURL('mailto:gowheel.support@gmail.com');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Contact Us</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="mail-open-outline" size={48} color={Colors.primary} />
                    </View>
                    <Text style={styles.title}>Get in Touch</Text>
                    <Text style={styles.subtitle}>
                        We're here to help with any questions or concerns about your rentals or our platform.
                    </Text>

                    <TouchableOpacity style={styles.emailButton} onPress={handleEmail}>
                        <Ionicons name="mail" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                        <Text style={styles.emailButtonText}>gowheel.support@gmail.com</Text>
                    </TouchableOpacity>

                    <Text style={styles.supportText}>
                        Our support team typically responds within 24-48 hours.
                    </Text>
                    <Text style={styles.supportTextSmall}>
                        For urgent matters related to ongoing rentals, please include your booking ID in the email subject line.
                    </Text>
                </View>

                {/* Quick Links */}
                <View style={[styles.card, { marginTop: Spacing.lg }]}>
                    <Text style={[styles.title, { fontSize: FontSize.md, marginBottom: Spacing.md }]}>Helpful Links</Text>
                    <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/pages/terms')}>
                        <Text style={styles.linkText}>Terms & Conditions</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/pages/privacy')}>
                        <Text style={styles.linkText}>Privacy Policy</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                    </TouchableOpacity>
                </View>

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
    content: { padding: Spacing.lg },
    card: {
        backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.xl,
        alignItems: 'center', ...cardShadow, borderWidth: 1, borderColor: Colors.border
    },
    iconContainer: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary + '15',
        justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg
    },
    title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md, textAlign: 'center' },
    subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
    emailButton: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.full,
        marginBottom: Spacing.lg
    },
    emailButtonText: { color: Colors.white, fontWeight: '600', fontSize: FontSize.md },
    supportText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xs },
    supportTextSmall: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
    linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingVertical: Spacing.md },
    linkText: { fontSize: FontSize.md, color: Colors.text, fontWeight: '500' },
    divider: { height: 1, backgroundColor: Colors.border, width: '100%' },
    footer: { marginTop: Spacing.xl, alignItems: 'center', paddingVertical: Spacing.lg },
    footerText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
