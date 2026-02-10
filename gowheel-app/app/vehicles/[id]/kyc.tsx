import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors, Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { getVehicleById, uploadKYCDocument, submitVehicleForVerification, KYCDocumentType } from '@/services/vehicleService';
import { VehicleWithImages } from '@/types/vehicle';
import * as ImagePicker from 'expo-image-picker';

interface DocumentUpload {
    type: KYCDocumentType;
    label: string;
    description: string;
    currentUrl?: string;
    uploading: boolean;
}

export default function VehicleKYCScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const vehicleId = Array.isArray(id) ? id[0] : id;

    const [vehicle, setVehicle] = useState<VehicleWithImages | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [ownerPhone, setOwnerPhone] = useState('');
    const [ownerEmail, setOwnerEmail] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');

    const [documents, setDocuments] = useState<DocumentUpload[]>([
        { type: 'pan_card', label: 'PAN Card', description: 'Clear photo of PAN card', uploading: false },
        { type: 'aadhaar_front', label: 'Aadhaar Front', description: 'Front side of Aadhaar', uploading: false },
        { type: 'aadhaar_back', label: 'Aadhaar Back', description: 'Back side of Aadhaar', uploading: false },
        { type: 'rc_front', label: 'RC Front', description: 'Registration Certificate Front', uploading: false },
        { type: 'rc_back', label: 'RC Back', description: 'Registration Certificate Back', uploading: false },
        { type: 'insurance', label: 'Insurance', description: 'Valid Insurance Policy', uploading: false },
    ]);

    useEffect(() => {
        loadData();
    }, [vehicleId]);

    const loadData = async () => {
        try {
            const data = await getVehicleById(vehicleId);
            if (data) {
                setVehicle(data);
                setOwnerPhone(data.owner_phone || '');
                setOwnerEmail(data.owner_email || '');
                setRegistrationNumber(data.registration_number || '');

                // Update documents with existing URLs
                setDocuments(prev => prev.map(doc => ({
                    ...doc,
                    currentUrl: (data as any)[`${doc.type}_url`] || undefined,
                })));
            }
        } catch (error) {
            console.error('Failed to load vehicle:', error);
            Alert.alert('Error', 'Failed to load vehicle details');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (docType: KYCDocumentType) => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Camera roll access is required to upload documents.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.8,
                allowsEditing: true,
            });

            if (!result.canceled) {
                const asset = result.assets[0];

                // Set uploading state
                setDocuments(prev => prev.map(d => d.type === docType ? { ...d, uploading: true } : d));

                // Upload
                const url = await uploadKYCDocument(
                    vehicleId,
                    docType,
                    asset.uri,
                    asset.fileName || `doc_${Date.now()}.jpg`,
                    asset.mimeType || 'image/jpeg'
                );

                // Update URL and clear uploading state
                setDocuments(prev => prev.map(d => d.type === docType ? { ...d, currentUrl: url, uploading: false } : d));
            }
        } catch (error: any) {
            console.error('Upload failed:', error);
            setDocuments(prev => prev.map(d => d.type === docType ? { ...d, uploading: false } : d));
            Alert.alert('Upload Failed', error.message || 'Could not upload document');
        }
    };

    const handleSubmit = async () => {
        // Validation
        const missingDocs = documents.filter(d => !d.currentUrl);
        if (missingDocs.length > 0) {
            Alert.alert('Missing Documents', `Please upload: ${missingDocs.map(d => d.label).join(', ')}`);
            return;
        }

        if (!ownerPhone || !ownerEmail || !registrationNumber) {
            Alert.alert('Missing Info', 'Please fill in phone, email, and registration number.');
            return;
        }

        setSubmitting(true);
        try {
            await submitVehicleForVerification(vehicleId, {
                owner_phone: ownerPhone,
                owner_email: ownerEmail,
                registration_number: registrationNumber,
            });
            Alert.alert('Success', 'Vehicle submitted for verification!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: 'KYC Verification', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Submit KYC Documents</Text>
                        <Text style={styles.subtitle}>Upload documents for {vehicle?.title} to go live.</Text>
                    </View>

                    {/* Contact Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Owner & Vehicle Details</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mobile Number *</Text>
                            <TextInput
                                style={styles.input}
                                value={ownerPhone}
                                onChangeText={setOwnerPhone}
                                placeholder="10-digit mobile number"
                                keyboardType="phone-pad"
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email ID *</Text>
                            <TextInput
                                style={styles.input}
                                value={ownerEmail}
                                onChangeText={setOwnerEmail}
                                placeholder="your@email.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Registration Number *</Text>
                            <TextInput
                                style={styles.input}
                                value={registrationNumber}
                                onChangeText={v => setRegistrationNumber(v.toUpperCase())}
                                placeholder="e.g. AP09AB1234"
                                autoCapitalize="characters"
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>
                    </View>

                    {/* Documents */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Required Documents</Text>
                        <Text style={styles.sectionSubtitle}>Upload clear photos of the following:</Text>

                        <View style={styles.docGrid}>
                            {documents.map((doc) => (
                                <TouchableOpacity
                                    key={doc.type}
                                    style={[styles.docCard, doc.currentUrl ? styles.docCardUploaded : null]}
                                    onPress={() => handleUpload(doc.type)}
                                    disabled={doc.uploading}
                                >
                                    {doc.uploading ? (
                                        <ActivityIndicator color={Colors.primary} />
                                    ) : doc.currentUrl ? (
                                        <>
                                            <Image source={{ uri: doc.currentUrl }} style={styles.docImage} />
                                            <View style={styles.uploadedBadge}>
                                                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                                            </View>
                                        </>
                                    ) : (
                                        <Ionicons name="cloud-upload-outline" size={32} color={Colors.textMuted} />
                                    )}

                                    <Text style={styles.docLabel} numberOfLines={1}>{doc.label}</Text>
                                    <Text style={styles.docDesc} numberOfLines={1}>{doc.description}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, submitting && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.submitText}>Submit for Verification</Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: Spacing.xl, paddingBottom: 40 },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { marginBottom: Spacing.xl },
    title: { fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.xs },
    subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
    section: { marginBottom: Spacing.xl },
    sectionTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
    sectionSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.md },
    inputGroup: { marginBottom: Spacing.lg },
    label: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, fontWeight: '500' },
    input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: 12, color: Colors.text, fontSize: FontSize.md },
    docGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    docCard: { width: '47%', aspectRatio: 1, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', padding: Spacing.sm, borderStyle: 'dashed' },
    docCardUploaded: { borderStyle: 'solid', borderColor: Colors.primary, padding: 0, overflow: 'hidden' },
    docImage: { width: '100%', height: '100%', position: 'absolute' },
    docLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginTop: Spacing.sm },
    docDesc: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
    uploadedBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: Colors.white, borderRadius: 10 },
    submitButton: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.md },
    disabledButton: { opacity: 0.7 },
    submitText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '600' },
});
