import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, FontSize, Radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function AddReviewScreen() {
    const { bookingId, vehicleId, vehicleTitle } = useLocalSearchParams<{ bookingId: string; vehicleId: string; vehicleTitle: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { colors } = useTheme();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Rating Required', 'Please select a star rating.');
            return;
        }

        if (!comment.trim()) {
            Alert.alert('Comment Required', 'Please share your experience.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    booking_id: bookingId,
                    vehicle_id: vehicleId,
                    reviewer_id: user?.id,
                    rating,
                    comment: comment.trim(),
                });

            if (error) throw error;

            Alert.alert('Success', 'Thank you for your review!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit review.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Write a Review', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[s.container, { backgroundColor: colors.background }]}>
                <ScrollView contentContainerStyle={s.scroll}>
                    <View style={s.header}>
                        <Text style={[s.title, { color: colors.text }]}>How was your ride?</Text>
                        <Text style={[s.subtitle, { color: colors.textSecondary }]}>{vehicleTitle}</Text>
                    </View>

                    <View style={s.ratingContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <Ionicons
                                    name={star <= rating ? "star" : "star-outline"}
                                    size={40}
                                    color={colors.primary}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={[s.ratingText, { color: colors.primary }]}>
                        {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : rating === 5 ? 'Excellent' : 'Select a rating'}
                    </Text>

                    <View style={s.inputContainer}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Your Review</Text>
                        <TextInput
                            style={[s.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            value={comment}
                            onChangeText={setComment}
                            placeholder="Tell us about your experience..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                        />
                    </View>

                    <TouchableOpacity
                        style={[s.submitButton, { backgroundColor: colors.primary }, loading && s.disabledButton]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={'#fff'} />
                        ) : (
                            <Text style={[s.submitText, { color: '#fff' }]}>Submit Review</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: Spacing.xl },
    header: { alignItems: 'center', marginBottom: Spacing.xl },
    title: { fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.xs },
    subtitle: { fontSize: FontSize.md },
    ratingContainer: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
    ratingText: { textAlign: 'center', fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.xl },
    inputContainer: { marginBottom: Spacing.xl },
    label: { fontSize: FontSize.sm, marginBottom: Spacing.xs, fontWeight: '500' },
    input: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.md, minHeight: 120 },
    submitButton: { borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center' },
    disabledButton: { opacity: 0.7 },
    submitText: { fontSize: FontSize.lg, fontWeight: '600' },
});
