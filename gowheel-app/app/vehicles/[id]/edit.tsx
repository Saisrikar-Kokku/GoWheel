import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { getVehicleById, updateVehicle, uploadVehicleImage, deleteVehicleImage } from '@/services/vehicleService';
import { VehicleFormData, VehicleType, VehicleWithImages, VehicleImage } from '@/types/vehicle';
import * as ImagePicker from 'expo-image-picker';

export default function EditVehicleScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // State for existing images (from DB) and new images (local)
    const [existingImages, setExistingImages] = useState<VehicleImage[]>([]);
    const [newImages, setNewImages] = useState<{ uri: string; name: string; type: string }[]>([]);

    const [form, setForm] = useState<VehicleFormData>({
        title: '', vehicle_type: 'car', brand: '', model: '', year: new Date().getFullYear(),
        price_per_day: 0, location: '', description: '', is_active: true,
        registration_number: '',
    });

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                const data = await getVehicleById(id);
                if (data) {
                    setForm({
                        title: data.title,
                        vehicle_type: data.vehicle_type,
                        brand: data.brand,
                        model: data.model,
                        year: data.year,
                        price_per_day: data.price_per_day,
                        location: data.location,
                        description: data.description || '',
                        is_active: data.is_active,
                        registration_number: data.registration_number || '',
                    });
                    setExistingImages(data.images || []);
                }
            } catch (e: any) {
                Alert.alert('Error', 'Failed to load vehicle details');
                router.back();
            }
            setLoading(false);
        };
        load();
    }, [id]);

    const updateForm = (key: keyof VehicleFormData, value: any) => setForm(prev => ({ ...prev, [key]: value }));

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission needed', 'Camera roll access is required'); return; }

        const remainingSlots = 10 - existingImages.length - newImages.length;
        if (remainingSlots <= 0) { Alert.alert('Limit Reached', 'You can upload up to 10 images'); return; }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsMultipleSelection: true,
            selectionLimit: remainingSlots
        });

        if (!result.canceled) {
            const picked = result.assets.map(a => ({
                uri: a.uri,
                name: a.fileName || `photo_${Date.now()}.jpg`,
                type: a.mimeType || 'image/jpeg'
            }));
            setNewImages(prev => [...prev, ...picked]);
        }
    };

    const removeExistingImage = async (imageId: string, imageUrl: string, index: number) => {
        Alert.alert('Delete Image', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteVehicleImage(imageId, imageUrl);
                        setExistingImages(prev => prev.filter((_, i) => i !== index));
                    } catch (e) {
                        Alert.alert('Error', 'Failed to delete image');
                    }
                }
            }
        ]);
    };

    const removeNewImage = (index: number) => setNewImages(prev => prev.filter((_, i) => i !== index));

    const handleSubmit = async () => {
        if (!form.title || !form.brand || !form.model || !form.location || form.price_per_day <= 0) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            // Update vehicle details
            if (!id) throw new Error('Invalid vehicle ID');
            await updateVehicle(id, form);

            // Upload new images
            for (const img of newImages) {
                await uploadVehicleImage(id, img.uri, img.name, img.type);
            }

            Alert.alert('Success!', 'Vehicle updated successfully', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to update vehicle');
        }
        setSubmitting(false);
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

    return (
        <>
            <Stack.Screen options={{ title: 'Edit Vehicle', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                    {/* Active Toggle */}
                    <View style={styles.switchRow}>
                        <Text style={styles.label}>Vehicle Visibility</Text>
                        <TouchableOpacity
                            style={[styles.toggleBtn, form.is_active ? styles.toggleActive : styles.toggleInactive]}
                            onPress={() => updateForm('is_active', !form.is_active)}
                        >
                            <Text style={[styles.toggleText, form.is_active && styles.toggleTextActive]}>
                                {form.is_active ? 'Active' : 'Inactive'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Type Selector (Disabled or Enabled? Usually type doesn't change easily but allowing it for now) */}
                    <Text style={styles.label}>Vehicle Type</Text>
                    <View style={styles.typeRow}>
                        {(['car', 'bike'] as VehicleType[]).map(type => (
                            <TouchableOpacity key={type} style={[styles.typeCard, form.vehicle_type === type && styles.typeCardActive]} onPress={() => updateForm('vehicle_type', type)}>
                                <Text style={styles.typeEmoji}>{type === 'car' ? '🚗' : '🏍️'}</Text>
                                <Text style={[styles.typeLabel, form.vehicle_type === type && styles.typeLabelActive]}>{type === 'car' ? 'Car' : 'Bike'}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Form Fields */}
                    {[
                        { key: 'title', label: 'Vehicle Title *', placeholder: 'e.g., Royal Enfield Classic 350', kbd: 'default' },
                        { key: 'brand', label: 'Brand *', placeholder: 'e.g., Royal Enfield', kbd: 'default' },
                        { key: 'model', label: 'Model *', placeholder: 'e.g., Classic 350', kbd: 'default' },
                        { key: 'year', label: 'Year *', placeholder: '2024', kbd: 'numeric' },
                        { key: 'price_per_day', label: 'Price Per Hour (₹) *', placeholder: '50', kbd: 'numeric' },
                        { key: 'location', label: 'Location *', placeholder: 'e.g., Hyderabad', kbd: 'default' },
                        { key: 'registration_number', label: 'Registration Number', placeholder: 'TS09AB1234', kbd: 'default' },
                    ].map(field => (
                        <View key={field.key} style={styles.inputGroup}>
                            <Text style={styles.label}>{field.label}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={field.placeholder}
                                placeholderTextColor={Colors.textMuted}
                                value={String((form as any)[field.key] || '')}
                                onChangeText={v => updateForm(field.key as keyof VehicleFormData, field.kbd === 'numeric' ? Number(v) || 0 : v)}
                                keyboardType={field.kbd as any}
                            />
                        </View>
                    ))}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe your vehicle..."
                            placeholderTextColor={Colors.textMuted}
                            value={form.description}
                            onChangeText={v => updateForm('description', v)}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Images */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Photos</Text>
                        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                            <Ionicons name="camera-outline" size={24} color={Colors.primary} />
                            <Text style={styles.imagePickerText}>Add Photos</Text>
                        </TouchableOpacity>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreview}>
                            {/* Existing Images */}
                            {existingImages.map((img, i) => (
                                <View key={`exist-${i}`} style={styles.previewContainer}>
                                    <Image source={{ uri: img.image_url }} style={styles.previewImage} />
                                    <View style={styles.badge}><Text style={styles.badgeText}>Saved</Text></View>
                                    <TouchableOpacity style={styles.removeImage} onPress={() => removeExistingImage(img.id, img.image_url, i)}>
                                        <Ionicons name="close-circle" size={22} color={Colors.error} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {/* New Images */}
                            {newImages.map((img, i) => (
                                <View key={`new-${i}`} style={styles.previewContainer}>
                                    <Image source={{ uri: img.uri }} style={styles.previewImage} />
                                    <TouchableOpacity style={styles.removeImage} onPress={() => removeNewImage(i)}>
                                        <Ionicons name="close-circle" size={22} color={Colors.error} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Submit */}
                    <TouchableOpacity style={[styles.submitButton, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
                        {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitText}>Save Changes</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    scroll: { padding: Spacing.xl, paddingBottom: 40 },

    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
    toggleBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
    toggleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    toggleInactive: { backgroundColor: Colors.surface },
    toggleText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
    toggleTextActive: { color: Colors.white },

    typeRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
    typeCard: { flex: 1, alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
    typeCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(16,185,129,0.08)' },
    typeEmoji: { fontSize: 28, marginBottom: Spacing.xs },
    typeLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
    typeLabelActive: { color: Colors.primary },
    inputGroup: { marginBottom: Spacing.lg },
    label: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, fontWeight: '500' },
    input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: 14, color: Colors.text, fontSize: FontSize.md },
    textArea: { height: 90, paddingTop: Spacing.md },
    imagePickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, borderStyle: 'dashed', paddingVertical: Spacing.xl },
    imagePickerText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '500' },
    imagePreview: { marginTop: Spacing.md },
    previewContainer: { marginRight: Spacing.sm, position: 'relative' },
    previewImage: { width: 80, height: 60, borderRadius: Radius.sm },
    removeImage: { position: 'absolute', top: -8, right: -8 },
    badge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 4, borderRadius: 4 },
    badgeText: { color: 'white', fontSize: 10 },
    submitButton: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.lg },
    submitText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '600' },
});
