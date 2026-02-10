import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export default function EditProfileScreen() {
    const router = useRouter();
    const { profile, user, refreshProfile } = useAuth();
    const { colors } = useTheme();

    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [avatarUri, setAvatarUri] = useState(profile?.avatar_url || '');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            await uploadAvatar(result.assets[0].uri);
        }
    };

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your camera.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            await uploadAvatar(result.assets[0].uri);
        }
    };

    const uploadAvatar = async (uri: string) => {
        if (!user) return;
        setUploading(true);
        try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const arrayBuffer = decode(base64);
            const storagePath = `${user.id}/avatar_${Date.now()}.jpg`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(storagePath, arrayBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(storagePath);
            setAvatarUri(urlData.publicUrl);
        } catch (error: any) {
            Alert.alert('Upload Failed', error.message || 'Could not upload photo.');
        } finally {
            setUploading(false);
        }
    };

    const showImageOptions = () => {
        Alert.alert('Profile Photo', 'Choose an option', [
            { text: 'Take Photo', onPress: handleTakePhoto },
            { text: 'Choose from Gallery', onPress: handlePickImage },
            ...(avatarUri ? [{ text: 'Remove Photo', style: 'destructive' as const, onPress: () => setAvatarUri('') }] : []),
            { text: 'Cancel', style: 'cancel' as const },
        ]);
    };

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
                    phone: phone.trim() || null,
                    avatar_url: avatarUri || null,
                })
                .eq('id', profile?.id);

            if (error) throw error;

            await refreshProfile();
            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Edit Profile',
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={[styles.container, { backgroundColor: colors.background }]}
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    {/* ===== AVATAR SECTION ===== */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity onPress={showImageOptions} activeOpacity={0.8}>
                            {uploading ? (
                                <View style={[styles.avatarCircle, { backgroundColor: colors.surface }]}>
                                    <ActivityIndicator color={colors.primary} />
                                </View>
                            ) : avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatarCircle} />
                            ) : (
                                <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.avatarInitial}>
                                        {fullName?.charAt(0)?.toUpperCase() || '?'}
                                    </Text>
                                </View>
                            )}
                            <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
                                <Ionicons name="camera" size={16} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        <Text style={[styles.changePhotoText, { color: colors.primary }]}>
                            Tap to change photo
                        </Text>
                    </View>

                    {/* ===== FORM ===== */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter your full name"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Enter your phone number"
                                keyboardType="phone-pad"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Email (Read-only)</Text>
                            <View style={[styles.input, styles.disabledInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <Text style={{ color: colors.textMuted }}>{user?.email || 'No email'}</Text>
                            </View>
                        </View>

                        <Text style={[styles.hint, { color: colors.textMuted }]}>
                            To change your email or role, please contact support.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: colors.primary }, loading && styles.disabledButton]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
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
    container: { flex: 1 },
    scroll: { padding: Spacing.xl },
    // Avatar
    avatarSection: { alignItems: 'center', marginBottom: Spacing.xxl },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: { fontSize: 40, fontWeight: '700', color: '#fff' },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    changePhotoText: { marginTop: Spacing.sm, fontSize: FontSize.sm, fontWeight: '500' },
    // Form
    form: { marginBottom: Spacing.xl },
    inputGroup: { marginBottom: Spacing.lg },
    label: { fontSize: FontSize.sm, marginBottom: Spacing.xs, fontWeight: '500' },
    input: {
        borderWidth: 1,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 14,
        fontSize: FontSize.md,
    },
    disabledInput: {},
    hint: { fontSize: FontSize.xs, textAlign: 'center', marginTop: Spacing.md },
    saveButton: {
        borderRadius: Radius.md,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    disabledButton: { opacity: 0.7 },
    saveText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '600' },
});
