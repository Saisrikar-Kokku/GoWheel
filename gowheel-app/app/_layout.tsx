import React from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/lib/theme';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AuthGate() {
    const { user, loading, profile } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    React.useEffect(() => {
        if (loading) return;

        // Hide the splash screen once the initial auth check is done.
        SplashScreen.hideAsync().catch(() => { });

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, loading, segments]);

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return <Slot />;
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <StatusBar style="light" />
            <AuthGate />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
});
