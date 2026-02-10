import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
    Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signIn } = useAuth();
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
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoIcon}>
                        <Ionicons name="car-sport" size={40} color={Colors.primary} />
                    </View>
                    <Text style={styles.logoText}>GoWheel</Text>
                    <Text style={styles.tagline}>Rent vehicles peer-to-peer</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.formTitle}>Welcome Back</Text>

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
                                placeholder="Enter your password"
                                placeholderTextColor={Colors.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoComplete="password"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Sign up link */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account?</Text>
                    <Link href="/(auth)/signup" asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkText}> Sign Up</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxxl },
    logoContainer: { alignItems: 'center', marginBottom: Spacing.xxxl },
    logoIcon: {
        width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(16, 185, 129, 0.15)',
        justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
    },
    logoText: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.text, letterSpacing: -1 },
    tagline: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
    form: { marginBottom: Spacing.xxl },
    formTitle: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xxl },
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
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { color: Colors.textSecondary, fontSize: FontSize.md },
    linkText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
});
