import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, Radius, cardShadow } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function AddReviewScreen() {
    const { bookingId, vehicleId, vehicleTitle } = useLocalSearchParams<{ bookingId: string; vehicleId: string; vehicleTitle: string }>();
    const router = useRouter();
    const { user } = useAuth();

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
            <Stack.Screen options={{ title: 'Write a Review', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.header}>
                        <Text style={styles.title}>How was your ride?</Text>
                        <Text style={styles.subtitle}>{vehicleTitle}</Text>
                    </View>

                    <View style={styles.ratingContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <Ionicons
                                    name={star <= rating ? "star" : "star-outline"}
                                    size={40}
                                    color={Colors.primary}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.ratingText}>
                        {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : rating === 5 ? 'Excellent' : 'Select a rating'}
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Your Review</Text>
                        <TextInput
                            style={styles.input}
                            value={comment}
                            onChangeText={setComment}
                            placeholder="Tell us about your experience..."
                            placeholderTextColor={Colors.textMuted}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.submitText}>Submit Review</Text>
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
    header: { alignItems: 'center', marginBottom: Spacing.xl },
    title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
    subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
    ratingContainer: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
    ratingText: { textAlign: 'center', fontSize: FontSize.md, color: Colors.primary, fontWeight: '600', marginBottom: Spacing.xl },
    inputContainer: { marginBottom: Spacing.xl },
    label: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, fontWeight: '500' },
    input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, color: Colors.text, fontSize: FontSize.md, minHeight: 120 },
    submitButton: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center' },
    disabledButton: { opacity: 0.7 },
    submitText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '600' },
});
