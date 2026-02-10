import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, Linking
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { createVehicle, uploadVehicleImage } from '@/services/vehicleService';
import { VehicleFormData, VehicleType } from '@/types/vehicle';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function AddVehicleScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [locLoading, setLocLoading] = useState(false);
    const [images, setImages] = useState<{ uri: string; name: string; type: string }[]>([]);
    const [form, setForm] = useState<VehicleFormData>({
        title: '', vehicle_type: 'car', brand: '', model: '', year: new Date().getFullYear(),
        price_per_day: 0, location: '', latitude: undefined, longitude: undefined, description: '', is_active: true,
    });

    const updateForm = (key: keyof VehicleFormData, value: any) => setForm(prev => ({ ...prev, [key]: value }));

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission needed', 'Camera roll access is required'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: true, selectionLimit: 5 });
        if (!result.canceled) {
            const newImages = result.assets.map(a => ({ uri: a.uri, name: a.fileName || `photo_${Date.now()}.jpg`, type: a.mimeType || 'image/jpeg' }));
            setImages(prev => [...prev, ...newImages].slice(0, 10));
        }
    };

    const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

    const getCurrentLocation = async () => {
        setLocLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Permission to access location was denied');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            updateForm('latitude', location.coords.latitude);
            updateForm('longitude', location.coords.longitude);

            // Reverse geocode to get address if location field is empty
            if (!form.location) {
                const reverseGeocode = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                });
                if (reverseGeocode.length > 0) {
                    const addr = reverseGeocode[0];
                    const addressString = [addr.city, addr.region, addr.country].filter(Boolean).join(', ');
                    updateForm('location', addressString);
                }
            }

            Alert.alert('✅ Location Fetched', 'Coordinates updated successfully!');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not fetch location');
        } finally {
            setLocLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.title || !form.brand || !form.model || !form.location || form.price_per_day <= 0) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const vehicle = await createVehicle(form);
            for (const img of images) {
                await uploadVehicleImage(vehicle.id, img.uri, img.name, img.type);
            }
            Alert.alert('Success!', 'Vehicle added successfully', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to add vehicle');
        }
        setLoading(false);
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Add Vehicle', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    {/* Type Selector */}
                    <Text style={styles.label}>Vehicle Type *</Text>
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
                        <Text style={styles.label}>Location *</Text>
                        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="e.g., Hyderabad"
                                placeholderTextColor={Colors.textMuted}
                                value={form.location}
                                onChangeText={v => updateForm('location', v)}
                            />
                            <TouchableOpacity
                                style={[styles.locationBtn, { backgroundColor: form.latitude ? Colors.success : Colors.primary }]}
                                onPress={getCurrentLocation}
                                disabled={locLoading}
                            >
                                {locLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Ionicons name={form.latitude ? "location" : "locate"} size={20} color="#fff" />
                                )}
                            </TouchableOpacity>
                        </View>
                        {form.latitude && (
                            <Text style={{ fontSize: FontSize.xs, color: Colors.success, marginTop: 4 }}>
                                ✓ Coordinates captured ({form.latitude.toFixed(4)}, {form.longitude?.toFixed(4)})
                            </Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Registration Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="TS09AB1234"
                            placeholderTextColor={Colors.textMuted}
                            value={form.registration_number || ''}
                            onChangeText={v => updateForm('registration_number', v)}
                        />
                    </View>

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
                            <Text style={styles.imagePickerText}>Add Photos ({images.length}/10)</Text>
                        </TouchableOpacity>
                        {images.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreview}>
                                {images.map((img, i) => (
                                    <View key={i} style={styles.previewContainer}>
                                        <Image source={{ uri: img.uri }} style={styles.previewImage} />
                                        <TouchableOpacity style={styles.removeImage} onPress={() => removeImage(i)}>
                                            <Ionicons name="close-circle" size={22} color={Colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>

                    {/* Submit */}
                    <TouchableOpacity style={[styles.submitButton, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
                        {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitText}>Add Vehicle</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: Spacing.xl, paddingBottom: 40 },
    typeRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
    typeCard: { flex: 1, alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
    typeCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(16,185,129,0.08)' },
    typeEmoji: { fontSize: 28, marginBottom: Spacing.xs },
    typeLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
    typeLabelActive: { color: Colors.primary },
    inputGroup: { marginBottom: Spacing.lg },
    label: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, fontWeight: '500' },
    input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: 14, color: Colors.text, fontSize: FontSize.md },
    locationBtn: { width: 50, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
    textArea: { height: 90, paddingTop: Spacing.md },
    imagePickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, borderStyle: 'dashed', paddingVertical: Spacing.xl },
    imagePickerText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '500' },
    imagePreview: { marginTop: Spacing.md },
    previewContainer: { marginRight: Spacing.sm, position: 'relative' },
    previewImage: { width: 80, height: 60, borderRadius: Radius.sm },
    removeImage: { position: 'absolute', top: -8, right: -8 },
    submitButton: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.lg },
    submitText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '600' },
});
