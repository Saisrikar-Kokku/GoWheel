import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, Radius, cardShadow } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
    const router = useRouter();
    const { profile, user, signOut } = useAuth();

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: signOut },
        ]);
    };

    const roleIcon = profile?.role === 'owner' ? 'car' : profile?.role === 'admin' ? 'shield-checkmark' : 'person';
    const roleColor = profile?.role === 'owner' ? Colors.info : profile?.role === 'admin' ? '#8b5cf6' : Colors.primary;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Profile Card */}
            <View style={styles.profileCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                </View>
                <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
                <Text style={styles.email}>{user?.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: `${roleColor}20`, borderColor: roleColor }]}>
                    <Ionicons name={roleIcon as any} size={14} color={roleColor} />
                    <Text style={[styles.roleText, { color: roleColor }]}>
                        {profile?.role?.charAt(0).toUpperCase()}{profile?.role?.slice(1)}
                    </Text>
                </View>
            </View>

            {/* Menu Items */}
            <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>Account</Text>
                {[
                    { icon: 'person-outline', label: 'Edit Profile', onPress: () => router.push('/profile/edit') },
                    { icon: 'notifications-outline', label: 'Notifications', onPress: () => { } },
                    { icon: 'document-text-outline', label: 'Terms & Conditions', onPress: () => router.push('/pages/terms') },
                    { icon: 'shield-checkmark-outline', label: 'Privacy Policy', onPress: () => router.push('/pages/privacy') },
                    { icon: 'help-circle-outline', label: 'Contact Support', onPress: () => router.push('/pages/contact') },
                ].map((item, idx) => (
                    <TouchableOpacity key={idx} style={styles.menuItem} onPress={item.onPress}>
                        <Ionicons name={item.icon as any} size={22} color={Colors.textSecondary} />
                        <Text style={styles.menuLabel}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>Support</Text>
                {[
                    { icon: 'help-circle-outline', label: 'Help & FAQ', onPress: () => { } },
                    { icon: 'chatbubble-ellipses-outline', label: 'Contact Support', onPress: () => { } },
                    { icon: 'document-text-outline', label: 'Terms of Service', onPress: () => { } },
                ].map((item, idx) => (
                    <TouchableOpacity key={idx} style={styles.menuItem} onPress={item.onPress}>
                        <Ionicons name={item.icon as any} size={22} color={Colors.textSecondary} />
                        <Text style={styles.menuLabel}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Sign Out */}
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={22} color={Colors.error} />
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={styles.version}>GoWheel v1.0.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { paddingBottom: 40 },
    profileCard: {
        alignItems: 'center', backgroundColor: Colors.card, paddingVertical: Spacing.xxxl,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    avatar: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
    },
    avatarText: { fontSize: FontSize.xxxl, fontWeight: '700', color: Colors.white },
    name: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
    email: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
    roleBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
        borderRadius: Radius.full, borderWidth: 1, marginTop: Spacing.md,
    },
    roleText: { fontSize: FontSize.sm, fontWeight: '600' },
    menuSection: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl },
    menuSectionTitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
        paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg, borderRadius: Radius.md,
        marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
    },
    menuLabel: { flex: 1, fontSize: FontSize.md, color: Colors.text, marginLeft: Spacing.md, fontWeight: '500' },
    signOutButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
        marginHorizontal: Spacing.xl, marginTop: Spacing.xxxl, paddingVertical: Spacing.lg,
        borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.error,
    },
    signOutText: { fontSize: FontSize.md, color: Colors.error, fontWeight: '600' },
    version: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.xl },
});
