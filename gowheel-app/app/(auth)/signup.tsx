import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
    Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, Radius } from '@/lib/theme';
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
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoIcon}>
                        <Ionicons name="car-sport" size={36} color={Colors.primary} />
                    </View>
                    <Text style={styles.logoText}>Create Account</Text>
                    <Text style={styles.tagline}>Join GoWheel today</Text>
                </View>

                {/* Role selector */}
                <View style={styles.roleContainer}>
                    {roles.map(r => (
                        <TouchableOpacity
                            key={r.value}
                            style={[styles.roleCard, role === r.value && styles.roleCardActive]}
                            onPress={() => setRole(r.value)}
                        >
                            <Ionicons name={r.icon as any} size={24} color={role === r.value ? Colors.primary : Colors.textMuted} />
                            <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>{r.label}</Text>
                            <Text style={styles.roleDesc}>{r.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your full name"
                                placeholderTextColor={Colors.textMuted}
                                value={fullName}
                                onChangeText={setFullName}
                                autoComplete="name"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor={Colors.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="At least 6 characters"
                                placeholderTextColor={Colors.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm your password"
                                placeholderTextColor={Colors.textMuted}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignup} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.buttonText}>Create Account</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Login link */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account?</Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkText}> Sign In</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxl },
    logoContainer: { alignItems: 'center', marginBottom: Spacing.xxl },
    logoIcon: {
        width: 70, height: 70, borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.15)',
        justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
    },
    logoText: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
    tagline: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
    roleContainer: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xxl },
    roleCard: {
        flex: 1, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
        borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', gap: Spacing.xs,
    },
    roleCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(16, 185, 129, 0.08)' },
    roleLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
    roleLabelActive: { color: Colors.primary },
    roleDesc: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
    form: { marginBottom: Spacing.xxl },
    inputGroup: { marginBottom: Spacing.lg },
    label: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, fontWeight: '500' },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
        borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    },
    inputIcon: { paddingLeft: Spacing.md },
    input: { flex: 1, paddingHorizontal: Spacing.md, paddingVertical: 14, color: Colors.text, fontSize: FontSize.md },
    eyeIcon: { paddingRight: Spacing.md },
    button: {
        backgroundColor: Colors.primary, borderRadius: Radius.md,
        paddingVertical: 16, alignItems: 'center', marginTop: Spacing.lg,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.md },
    footerText: { color: Colors.textSecondary, fontSize: FontSize.md },
    linkText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
});
