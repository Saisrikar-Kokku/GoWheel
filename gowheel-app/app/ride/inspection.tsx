import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Image, ScrollView,
    ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, FontSize, Radius, cardShadow } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getInspectionImages, uploadInspectionImage, confirmInspection } from '@/services/rideInspectionService';
import { InspectionImage, ImagePosition, positionLabels, InspectionType } from '@/types/ride';

const REQUIRED_PRE_RIDE_POSITIONS: ImagePosition[] = ['front', 'left', 'right', 'back', 'meter'];

export default function RideInspectionScreen() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { colors } = useTheme();

    const [images, setImages] = useState<InspectionImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<ImagePosition | null>(null);
    const [inspectionType, setInspectionType] = useState<InspectionType>('pre_ride');
    const [submitting, setSubmitting] = useState(false);

    const loadImages = useCallback(async () => {
        if (!bookingId) return;
        try {
            const data = await getInspectionImages(bookingId, inspectionType);
            setImages(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
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
            <Stack.Screen options={{ title: 'Ride Inspection', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
            <ScrollView style={[s.container, { backgroundColor: colors.background }]} contentContainerStyle={s.content}>
                {/* Type Toggle */}
                <View style={s.typeToggle}>
                    {(['pre_ride', 'post_ride'] as InspectionType[]).map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                s.typeBtn,
                                { borderColor: colors.border },
                                inspectionType === type && { borderColor: colors.primary, backgroundColor: 'rgba(16,185,129,0.1)' }
                            ]}
                            onPress={() => setInspectionType(type)}
                        >
                            <Text style={[
                                s.typeBtnText,
                                { color: colors.textSecondary },
                                inspectionType === type && { color: colors.primary }
                            ]}>
                                {type === 'pre_ride' ? '📸 Pre-Ride' : '📷 Post-Ride'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Progress Bar */}
                {inspectionType === 'pre_ride' && (
                    <View style={s.progressSection}>
                        <View style={[s.progressBarBg, { backgroundColor: colors.surface }]}>
                            <View style={[
                                s.progressBarFill,
                                { width: `${(uploadedRequired.length / requiredPositions.length) * 100}%`, backgroundColor: colors.success }
                            ]} />
                        </View>
                        <Text style={[s.progressText, { color: colors.textMuted }]}>
                            {allRequiredUploaded
                                ? '🎉 All required photos uploaded!'
                                : `${requiredPositions.length - uploadedRequired.length} required photo${(requiredPositions.length - uploadedRequired.length) !== 1 ? 's' : ''} remaining`
                            }
                        </Text>
                    </View>
                )}

                <Text style={[s.hint, { color: colors.textMuted }]}>Upload photos from each angle to document the vehicle condition</Text>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : (
                    <View style={s.grid}>
                        {positions.map(pos => {
                            const existing = getImageForPosition(pos);
                            const info = positionLabels[pos];
                            const isRequired = REQUIRED_PRE_RIDE_POSITIONS.includes(pos);
                            const isUploading = uploading === pos;

                            return (
                                <TouchableOpacity
                                    key={pos}
                                    style={[
                                        s.positionCard,
                                        { backgroundColor: colors.card, borderColor: colors.border },
                                        existing && { borderColor: colors.success }
                                    ]}
                                    onPress={() => !existing && handleUpload(pos)}
                                    disabled={!!existing || !!isUploading}
                                >
                                    {existing ? (
                                        <Image source={{ uri: existing.image_url }} style={s.positionImage} />
                                    ) : isUploading ? (
                                        <View style={[s.positionPlaceholder, { backgroundColor: colors.surface }]}>
                                            <ActivityIndicator color={colors.primary} />
                                        </View>
                                    ) : (
                                        <View style={[s.positionPlaceholder, { backgroundColor: colors.surface }]}>
                                            <Text style={s.positionEmoji}>{info.icon}</Text>
                                            <Ionicons name="camera-outline" size={20} color={colors.textMuted} />
                                        </View>
                                    )}
                                    <View style={s.positionInfo}>
                                        <Text style={[s.positionLabel, { color: colors.text }]}>
                                            {info.label} {isRequired && <Text style={[s.required, { color: colors.error }]}>*</Text>}
                                        </Text>
                                        <Text style={[s.positionDesc, { color: colors.textMuted }]} numberOfLines={1}>{info.description}</Text>
                                        {existing && <Text style={[s.uploadedTag, { color: colors.success }]}>✓ Uploaded</Text>}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Confirm & Submit Button */}
                {inspectionType === 'pre_ride' && allRequiredUploaded && (
                    <View style={s.submitSection}>
                        <View style={[s.submitInfoCard, { borderColor: colors.success, backgroundColor: `${colors.success}10` }]}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                            <View style={{ flex: 1 }}>
                                <Text style={[s.submitInfoTitle, { color: colors.success }]}>All Photos Ready!</Text>
                                <Text style={[s.submitInfoSub, { color: colors.textSecondary }]}>
                                    Review your photos above. Once submitted, the owner will generate your ride start OTP.
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[s.submitButton, { backgroundColor: colors.success }]}
                            onPress={handleConfirmSubmission}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-done" size={20} color="#fff" />
                                    <Text style={s.submitButtonText}>Confirm & Submit Inspection</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 60 },
    typeToggle: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    typeBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center' },
    typeBtnText: { fontSize: FontSize.md, fontWeight: '500' },

    progressSection: { marginBottom: Spacing.md },
    progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },
    progressText: { fontSize: FontSize.xs, textAlign: 'center', marginTop: Spacing.xs },

    hint: { fontSize: FontSize.sm, marginBottom: Spacing.lg, textAlign: 'center' },
    grid: { gap: Spacing.md },
    positionCard: { flexDirection: 'row', borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden', ...cardShadow },
    positionImage: { width: 90, height: 70 },
    positionPlaceholder: { width: 90, height: 70, justifyContent: 'center', alignItems: 'center' },
    positionEmoji: { fontSize: 20, marginBottom: 2 },
    positionInfo: { flex: 1, padding: Spacing.md, justifyContent: 'center' },
    positionLabel: { fontSize: FontSize.md, fontWeight: '600' },
    required: {},
    positionDesc: { fontSize: FontSize.xs, marginTop: 2 },
    uploadedTag: { fontSize: FontSize.xs, fontWeight: '600', marginTop: 4 },

    submitSection: { marginTop: Spacing.xl },
    submitInfoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    submitInfoTitle: { fontSize: FontSize.sm, fontWeight: '600' },
    submitInfoSub: { fontSize: FontSize.xs, marginTop: 2 },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        borderRadius: Radius.md,
        paddingVertical: Spacing.lg,
    },
    submitButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
});
