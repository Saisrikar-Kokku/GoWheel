import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
    Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signIn } = useAuth();
    const { colors } = useTheme();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        const { error } = await signIn(email.trim(), password);
        setLoading(false);
        if (error) {
            Alert.alert('Login Failed', error.message);
        }
    };

    return (
        <KeyboardAvoidingView style={[s.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                {/* Logo */}
                <View style={s.logoContainer}>
                    <View style={s.logoIcon}>
                        <Ionicons name="car-sport" size={40} color={colors.primary} />
                    </View>
                    <Text style={[s.logoText, { color: colors.text }]}>GoWheel</Text>
                    <Text style={[s.tagline, { color: colors.textSecondary }]}>Rent vehicles peer-to-peer</Text>
                </View>

                {/* Form */}
                <View style={s.form}>
                    <Text style={[s.formTitle, { color: colors.text }]}>Welcome Back</Text>

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
                                placeholder="Enter your password"
                                placeholderTextColor={colors.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoComplete="password"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeIcon}>
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={[s.button, { backgroundColor: colors.primary }, loading && s.buttonDisabled]} onPress={handleLogin} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={s.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Sign up link */}
                <View style={s.footer}>
                    <Text style={[s.footerText, { color: colors.textSecondary }]}>Don't have an account?</Text>
                    <Link href="/(auth)/signup" asChild>
                        <TouchableOpacity>
                            <Text style={[s.linkText, { color: colors.primary }]}> Sign Up</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxxl },
    logoContainer: { alignItems: 'center', marginBottom: Spacing.xxxl },
    logoIcon: {
        width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(16, 185, 129, 0.15)',
        justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
    },
    logoText: { fontSize: FontSize.xxxl, fontWeight: '800', letterSpacing: -1 },
    tagline: { fontSize: FontSize.sm, marginTop: Spacing.xs },
    form: { marginBottom: Spacing.xxl },
    formTitle: { fontSize: FontSize.xxl, fontWeight: '700', marginBottom: Spacing.xxl },
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
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { fontSize: FontSize.md },
    linkText: { fontSize: FontSize.md, fontWeight: '600' },
});
