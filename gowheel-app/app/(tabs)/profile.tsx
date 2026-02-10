import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
    const router = useRouter();
    const { profile, user, signOut } = useAuth();
    const { colors, isDark, mode, setMode } = useTheme();

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: signOut },
        ]);
    };

    const toggleTheme = () => {
        if (mode === 'dark') setMode('light');
        else if (mode === 'light') setMode('system');
        else setMode('dark');
    };

    const themeLabel = mode === 'system' ? 'System' : mode === 'dark' ? 'Dark' : 'Light';

    const roleIcon = profile?.role === 'owner' ? 'car-sport' : profile?.role === 'admin' ? 'shield-checkmark' : 'person';
    const roleColor = profile?.role === 'owner' ? colors.info : profile?.role === 'admin' ? '#8b5cf6' : colors.primary;

    const avatarUri = profile?.avatar_url;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
            {/* ===== PROFILE CARD ===== */}
            <View
                style={[styles.profileCard, { backgroundColor: isDark ? '#0f1a15' : '#ecfdf5' }]}
            >
                <TouchableOpacity onPress={() => router.push('/profile/edit')} activeOpacity={0.8}>
                    {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                            <Text style={styles.avatarText}>
                                {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                        </View>
                    )}
                    <View style={[styles.editBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="camera" size={12} color={colors.primary} />
                    </View>
                </TouchableOpacity>
                <Text style={[styles.name, { color: colors.text }]}>{profile?.full_name || 'User'}</Text>
                <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: `${roleColor}15`, borderColor: `${roleColor}40` }]}>
                    <Ionicons name={roleIcon as any} size={14} color={roleColor} />
                    <Text style={[styles.roleText, { color: roleColor }]}>
                        {profile?.role?.charAt(0).toUpperCase()}{profile?.role?.slice(1)}
                    </Text>
                </View>
            </View>

            {/* ===== MENU ===== */}
            <View style={styles.menuSection}>
                <Text style={[styles.menuSectionTitle, { color: colors.textMuted }]}>Account</Text>
                {[
                    { icon: 'person-outline', label: 'Edit Profile', onPress: () => router.push('/profile/edit') },
                    { icon: 'notifications-outline', label: 'Notifications', onPress: () => router.push('/notifications') },
                ].map((item, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={item.onPress}
                    >
                        <Ionicons name={item.icon as any} size={20} color={colors.textSecondary} />
                        <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                ))}
            </View>

            {/* ===== APPEARANCE ===== */}
            <View style={styles.menuSection}>
                <Text style={[styles.menuSectionTitle, { color: colors.textMuted }]}>Appearance</Text>
                <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={toggleTheme}
                >
                    <Ionicons
                        name={isDark ? 'moon' : 'sunny'}
                        size={20}
                        color={isDark ? '#f59e0b' : '#f97316'}
                    />
                    <Text style={[styles.menuLabel, { color: colors.text }]}>Theme</Text>
                    <View style={[styles.themeChip, { backgroundColor: colors.surface }]}>
                        <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' }}>
                            {themeLabel}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* ===== SUPPORT ===== */}
            <View style={styles.menuSection}>
                <Text style={[styles.menuSectionTitle, { color: colors.textMuted }]}>Support</Text>
                {[
                    { icon: 'document-text-outline', label: 'Terms & Conditions', onPress: () => router.push('/pages/terms') },
                    { icon: 'shield-outline', label: 'Privacy Policy', onPress: () => router.push('/pages/privacy') },
                    { icon: 'chatbubble-ellipses-outline', label: 'Contact Support', onPress: () => router.push('/pages/contact') },
                ].map((item, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={item.onPress}
                    >
                        <Ionicons name={item.icon as any} size={20} color={colors.textSecondary} />
                        <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                ))}
            </View>

            {/* ===== SIGN OUT ===== */}
            <TouchableOpacity
                style={[styles.signOutButton, { borderColor: colors.error }]}
                onPress={handleSignOut}
            >
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={[styles.version, { color: colors.textMuted }]}>GoWheel v1.0.0</Text>

            {/* Bottom padding for floating tab */}
            <View style={{ height: 80 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: 20 },
    profileCard: {
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
        borderBottomLeftRadius: Radius.xl,
        borderBottomRightRadius: Radius.xl,
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    avatarText: { fontSize: 36, fontWeight: '700', color: '#fff' },
    editBadge: {
        position: 'absolute',
        bottom: Spacing.md,
        right: -4,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    name: { fontSize: FontSize.xxl, fontWeight: '800' },
    email: { fontSize: FontSize.sm, marginTop: Spacing.xs },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.md,
        paddingVertical: 5,
        borderRadius: Radius.full,
        borderWidth: 1,
        marginTop: Spacing.md,
    },
    roleText: { fontSize: FontSize.xs, fontWeight: '600' },
    menuSection: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl },
    menuSectionTitle: {
        fontSize: FontSize.xs,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: Spacing.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: Spacing.lg,
        borderRadius: Radius.md,
        marginBottom: 6,
        borderWidth: 1,
    },
    menuLabel: {
        flex: 1,
        fontSize: FontSize.md,
        marginLeft: Spacing.md,
        fontWeight: '500',
    },
    themeChip: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radius.full,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginHorizontal: Spacing.xl,
        marginTop: Spacing.xxxl,
        paddingVertical: 14,
        borderRadius: Radius.md,
        borderWidth: 1,
    },
    signOutText: { fontSize: FontSize.md, fontWeight: '600' },
    version: {
        textAlign: 'center',
        fontSize: FontSize.xs,
        marginTop: Spacing.xl,
    },
});
