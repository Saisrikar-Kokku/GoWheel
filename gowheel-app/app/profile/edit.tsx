import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function EditProfileScreen() {
    const router = useRouter();
    const { profile, refreshProfile } = useAuth();

    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Error', 'Name cannot be empty.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName.trim(),
                    phone: phone.trim() || null
                })
                .eq('id', profile?.id);

            if (error) throw error;

            await refreshProfile();
            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Edit Profile', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter your full name"
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Enter your phone number"
                                keyboardType="phone-pad"
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email (Read-only)</Text>
                            <View style={[styles.input, styles.disabledInput]}>
                                <Text style={styles.disabledText}>{profile?.email || 'No email'}</Text>
                            </View>
                        </View>

                        <Text style={styles.hint}>
                            To change your email or role, please contact support.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.disabledButton]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.saveText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: Spacing.xl },
    form: { marginBottom: Spacing.xl },
    inputGroup: { marginBottom: Spacing.lg },
    label: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, fontWeight: '500' },
    input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: 12, color: Colors.text, fontSize: FontSize.md },
    disabledInput: { backgroundColor: Colors.background, borderColor: Colors.border },
    disabledText: { color: Colors.textMuted },
    hint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.md },
    saveButton: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.md },
    disabledButton: { opacity: 0.7 },
    saveText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '600' },
});
