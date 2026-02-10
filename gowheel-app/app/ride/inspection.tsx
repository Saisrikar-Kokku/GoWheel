import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
    Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors, Spacing, FontSize, Radius, cardShadow } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import {
    uploadInspectionImage, getInspectionImages, getInspectionStatus,
    confirmInspection, validatePreRideInspection,
} from '@/services/rideInspectionService';
import { positionLabels, ImagePosition, InspectionType, RideInspectionImage, REQUIRED_PRE_RIDE_POSITIONS } from '@/types/rideInspection';
import * as ImagePicker from 'expo-image-picker';

export default function RideInspectionScreen() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const router = useRouter();

    const [inspectionType, setInspectionType] = useState<InspectionType>('pre_ride');
    const [images, setImages] = useState<RideInspectionImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<ImagePosition | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const loadImages = useCallback(async () => {
        if (!bookingId) return;
        const imgs = await getInspectionImages(bookingId, inspectionType);
        setImages(imgs);
        setLoading(false);
    }, [bookingId, inspectionType]);

    useEffect(() => { setLoading(true); loadImages(); }, [loadImages]);

    const handleUpload = async (position: ImagePosition) => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            const { status: libStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (libStatus !== 'granted') { Alert.alert('Permission needed', 'Camera or gallery access is required'); return; }
        }

        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
        if (result.canceled) return;

        const asset = result.assets[0];
        setUploading(position);
        try {
            await uploadInspectionImage(
                bookingId!, position, inspectionType,
                asset.uri, asset.fileName || `inspection_${Date.now()}.jpg`, asset.mimeType || 'image/jpeg'
            );
            await loadImages();
            Alert.alert('Uploaded', `${positionLabels[position].label} photo uploaded`);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Upload failed');
        }
        setUploading(null);
    };

    const handleConfirmSubmission = async () => {
        Alert.alert(
            'Submit Inspection',
            'Are you sure? Once submitted, the owner will be notified and can generate the Start OTP.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Submit', onPress: async () => {
                        setSubmitting(true);
                        try {
                            await confirmInspection(bookingId!);
                            Alert.alert(
                                '✅ Inspection Submitted!',
                                'The owner will now generate your Start OTP to begin the ride.',
                                [{ text: 'OK', onPress: () => router.back() }]
                            );
                        } catch (e: any) {
                            Alert.alert('Error', e.message || 'Failed to submit inspection');
                        }
                        setSubmitting(false);
                    },
                },
            ]
        );
    };

    const positions: ImagePosition[] = ['front', 'left', 'right', 'back', 'meter', 'damage'];
    const getImageForPosition = (pos: ImagePosition) => images.find(img => img.position === pos);

    // Count required uploads
    const requiredPositions = positions.filter(p => REQUIRED_PRE_RIDE_POSITIONS.includes(p));
    const uploadedRequired = requiredPositions.filter(p => getImageForPosition(p));
    const allRequiredUploaded = inspectionType === 'pre_ride'
        && REQUIRED_PRE_RIDE_POSITIONS.every(pos => images.some(img => img.position === pos));
    const uploadProgress = `${uploadedRequired.length}/${requiredPositions.length}`;

    return (
        <>
            <Stack.Screen options={{ title: 'Ride Inspection', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Type Toggle */}
                <View style={styles.typeToggle}>
                    {(['pre_ride', 'post_ride'] as InspectionType[]).map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.typeBtn, inspectionType === type && styles.typeBtnActive]}
                            onPress={() => setInspectionType(type)}
                        >
                            <Text style={[styles.typeBtnText, inspectionType === type && styles.typeBtnTextActive]}>
                                {type === 'pre_ride' ? '📸 Pre-Ride' : '📷 Post-Ride'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Progress Bar */}
                {inspectionType === 'pre_ride' && (
                    <View style={styles.progressSection}>
                        <View style={styles.progressBarBg}>
                            <View style={[
                                styles.progressBarFill,
                                { width: `${(uploadedRequired.length / requiredPositions.length) * 100}%` }
                            ]} />
                        </View>
                        <Text style={styles.progressText}>
                            {allRequiredUploaded
                                ? '🎉 All required photos uploaded!'
                                : `${requiredPositions.length - uploadedRequired.length} required photo${(requiredPositions.length - uploadedRequired.length) !== 1 ? 's' : ''} remaining`
                            }
                        </Text>
                    </View>
                )}

                <Text style={styles.hint}>Upload photos from each angle to document the vehicle condition</Text>

                {loading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
                ) : (
                    <View style={styles.grid}>
                        {positions.map(pos => {
                            const existing = getImageForPosition(pos);
                            const info = positionLabels[pos];
                            const isRequired = REQUIRED_PRE_RIDE_POSITIONS.includes(pos);
                            const isUploading = uploading === pos;

                            return (
                                <TouchableOpacity
                                    key={pos}
                                    style={[styles.positionCard, existing && styles.positionCardDone]}
                                    onPress={() => !existing && handleUpload(pos)}
                                    disabled={!!existing || !!isUploading}
                                >
                                    {existing ? (
                                        <Image source={{ uri: existing.image_url }} style={styles.positionImage} />
                                    ) : isUploading ? (
                                        <View style={styles.positionPlaceholder}>
                                            <ActivityIndicator color={Colors.primary} />
                                        </View>
                                    ) : (
                                        <View style={styles.positionPlaceholder}>
                                            <Text style={styles.positionEmoji}>{info.icon}</Text>
                                            <Ionicons name="camera-outline" size={20} color={Colors.textMuted} />
                                        </View>
                                    )}
                                    <View style={styles.positionInfo}>
                                        <Text style={styles.positionLabel}>
                                            {info.label} {isRequired && <Text style={styles.required}>*</Text>}
                                        </Text>
                                        <Text style={styles.positionDesc} numberOfLines={1}>{info.description}</Text>
                                        {existing && <Text style={styles.uploadedTag}>✓ Uploaded</Text>}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Confirm & Submit Button */}
                {inspectionType === 'pre_ride' && allRequiredUploaded && (
                    <View style={styles.submitSection}>
                        <View style={styles.submitInfoCard}>
                            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.submitInfoTitle}>All Photos Ready!</Text>
                                <Text style={styles.submitInfoSub}>
                                    Review your photos above. Once submitted, the owner will generate your ride start OTP.
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleConfirmSubmission}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-done" size={20} color={Colors.white} />
                                    <Text style={styles.submitButtonText}>Confirm & Submit Inspection</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 60 },
    typeToggle: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    typeBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
    typeBtnActive: { borderColor: Colors.primary, backgroundColor: 'rgba(16,185,129,0.1)' },
    typeBtnText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '500' },
    typeBtnTextActive: { color: Colors.primary },

    progressSection: { marginBottom: Spacing.md },
    progressBarBg: { height: 6, backgroundColor: Colors.surface, borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 3 },
    progressText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xs },

    hint: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.lg, textAlign: 'center' },
    grid: { gap: Spacing.md },
    positionCard: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...cardShadow },
    positionCardDone: { borderColor: Colors.success },
    positionImage: { width: 90, height: 70 },
    positionPlaceholder: { width: 90, height: 70, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    positionEmoji: { fontSize: 20, marginBottom: 2 },
    positionInfo: { flex: 1, padding: Spacing.md, justifyContent: 'center' },
    positionLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
    required: { color: Colors.error },
    positionDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
    uploadedTag: { fontSize: FontSize.xs, color: Colors.success, fontWeight: '600', marginTop: 4 },

    submitSection: { marginTop: Spacing.xl },
    submitInfoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.success,
        backgroundColor: `${Colors.success}10`,
        marginBottom: Spacing.md,
    },
    submitInfoTitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.success },
    submitInfoSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.success,
        borderRadius: Radius.md,
        paddingVertical: Spacing.lg,
    },
    submitButtonText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
});
