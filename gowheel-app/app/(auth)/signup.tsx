import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
    Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<UserRole>('renter');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signUp } = useAuth();
    const { colors } = useTheme();

    const handleSignup = async () => {
        if (!fullName.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        const { error } = await signUp(email.trim(), password, fullName.trim(), role);
        setLoading(false);

        if (error) {
            Alert.alert('Sign Up Failed', error.message);
        } else {
            Alert.alert('Success!', 'Your account has been created. Please check your email for verification.', [{ text: 'OK' }]);
        }
    };

    const roles: { value: UserRole; label: string; icon: string; desc: string }[] = [
        { value: 'renter', label: 'Renter', icon: 'search', desc: 'I want to rent vehicles' },
        { value: 'owner', label: 'Vehicle Owner', icon: 'car', desc: 'I want to list my vehicles' },
    ];

    return (
        <KeyboardAvoidingView style={[s.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                {/* Logo */}
                <View style={s.logoContainer}>
                    <View style={s.logoIcon}>
                        <Ionicons name="car-sport" size={36} color={colors.primary} />
                    </View>
                    <Text style={[s.logoText, { color: colors.text }]}>Create Account</Text>
                    <Text style={[s.tagline, { color: colors.textSecondary }]}>Join GoWheel today</Text>
                </View>

                {/* Role selector */}
                <View style={s.roleContainer}>
                    {roles.map(r => (
                        <TouchableOpacity
                            key={r.value}
                            style={[
                                s.roleCard,
                                { backgroundColor: colors.card, borderColor: colors.border },
                                role === r.value && { borderColor: colors.primary, backgroundColor: 'rgba(16, 185, 129, 0.08)' },
                            ]}
                            onPress={() => setRole(r.value)}
                        >
                            <Ionicons name={r.icon as any} size={24} color={role === r.value ? colors.primary : colors.textMuted} />
                            <Text style={[s.roleLabel, { color: role === r.value ? colors.primary : colors.textSecondary }]}>{r.label}</Text>
                            <Text style={[s.roleDesc, { color: colors.textMuted }]}>{r.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Form */}
                <View style={s.form}>
                    <View style={s.inputGroup}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Full Name</Text>
                        <View style={[s.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="person-outline" size={20} color={colors.textMuted} style={s.inputIcon} />
                            <TextInput
                                style={[s.input, { color: colors.text }]}
                                placeholder="Enter your full name"
                                placeholderTextColor={colors.textMuted}
                                value={fullName}
                                onChangeText={setFullName}
                                autoComplete="name"
                            />
                        </View>
                    </View>

                    <View style={s.inputGroup}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Email</Text>
                        <View style={[s.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={s.inputIcon} />
                            <TextInput
                                style={[s.input, { color: colors.text }]}
                                placeholder="Enter your email"
                                placeholderTextColor={colors.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                            />
                        </View>
                    </View>

                    <View style={s.inputGroup}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Password</Text>
                        <View style={[s.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={s.inputIcon} />
                            <TextInput
                                style={[s.input, { color: colors.text }]}
                                placeholder="At least 6 characters"
                                placeholderTextColor={colors.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeIcon}>
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={s.inputGroup}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Confirm Password</Text>
                        <View style={[s.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={s.inputIcon} />
                            <TextInput
                                style={[s.input, { color: colors.text }]}
                                placeholder="Confirm your password"
                                placeholderTextColor={colors.textMuted}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={[s.button, { backgroundColor: colors.primary }, loading && s.buttonDisabled]} onPress={handleSignup} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={s.buttonText}>Create Account</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Login link */}
                <View style={s.footer}>
                    <Text style={[s.footerText, { color: colors.textSecondary }]}>Already have an account?</Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Text style={[s.linkText, { color: colors.primary }]}> Sign In</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxl },
    logoContainer: { alignItems: 'center', marginBottom: Spacing.xxl },
    logoIcon: {
        width: 70, height: 70, borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.15)',
        justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
    },
    logoText: { fontSize: FontSize.xxl, fontWeight: '800' },
    tagline: { fontSize: FontSize.sm, marginTop: Spacing.xs },
    roleContainer: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xxl },
    roleCard: {
        flex: 1, borderWidth: 1,
        borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', gap: Spacing.xs,
    },
    roleLabel: { fontSize: FontSize.sm, fontWeight: '600' },
    roleDesc: { fontSize: FontSize.xs, textAlign: 'center' },
    form: { marginBottom: Spacing.xxl },
    inputGroup: { marginBottom: Spacing.lg },
    label: { fontSize: FontSize.sm, marginBottom: Spacing.sm, fontWeight: '500' },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderRadius: Radius.md,
    },
    inputIcon: { paddingLeft: Spacing.md },
    input: { flex: 1, paddingHorizontal: Spacing.md, paddingVertical: 14, fontSize: FontSize.md },
    eyeIcon: { paddingRight: Spacing.md },
    button: {
        borderRadius: Radius.md,
        paddingVertical: 16, alignItems: 'center', marginTop: Spacing.lg,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.md },
    footerText: { fontSize: FontSize.md },
    linkText: { fontSize: FontSize.md, fontWeight: '600' },
});
