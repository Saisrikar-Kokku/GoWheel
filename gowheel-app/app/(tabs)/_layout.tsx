import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, FontSize, Radius } from '@/lib/theme';
import { TouchableOpacity } from 'react-native';

function NotificationBell() {
    const { colors } = useTheme();
    const { unreadCount } = useNotifications();
    const router = useRouter();

    return (
        <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={{ marginRight: Spacing.lg, position: 'relative' }}
        >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                    <Text style={styles.badgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function TabsLayout() {
    const { profile } = useAuth();
    const { colors, isDark } = useTheme();
    const isAdmin = profile?.role === 'admin';

    return (
        <Tabs
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.background,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: '700', fontSize: FontSize.lg },
                tabBarStyle: {
                    backgroundColor: colors.tabBarBg,
                    borderTopWidth: 0,
                    height: Platform.OS === 'ios' ? 88 : 68,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                    paddingTop: 8,
                    elevation: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: isDark ? 0.3 : 0.08,
                    shadowRadius: 12,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    letterSpacing: 0.3,
                },
                headerRight: () => <NotificationBell />,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    headerTitle: 'GoWheel',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? [styles.activeTab, { backgroundColor: `${colors.primary}15` }] : undefined}>
                            <Ionicons
                                name={focused ? 'home' : 'home-outline'}
                                size={focused ? 26 : 24}
                                color={color}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="vehicles"
                options={{
                    title: 'Vehicles',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? [styles.activeTab, { backgroundColor: `${colors.primary}15` }] : undefined}>
                            <Ionicons
                                name={focused ? 'car-sport' : 'car-sport-outline'}
                                size={focused ? 26 : 24}
                                color={color}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="bookings"
                options={{
                    title: 'Bookings',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? [styles.activeTab, { backgroundColor: `${colors.primary}15` }] : undefined}>
                            <Ionicons
                                name={focused ? 'receipt' : 'receipt-outline'}
                                size={focused ? 26 : 24}
                                color={color}
                            />
                        </View>
                    ),
                }}
            />
            {isAdmin && (
                <Tabs.Screen
                    name="admin"
                    options={{
                        title: 'Admin',
                        tabBarIcon: ({ color, focused }) => (
                            <View style={focused ? [styles.activeTab, { backgroundColor: `${colors.primary}15` }] : undefined}>
                                <Ionicons
                                    name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'}
                                    size={focused ? 26 : 24}
                                    color={color}
                                />
                            </View>
                        ),
                    }}
                />
            )}
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    headerRight: undefined,
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? [styles.activeTab, { backgroundColor: `${colors.primary}15` }] : undefined}>
                            <Ionicons
                                name={focused ? 'person-circle' : 'person-circle-outline'}
                                size={focused ? 28 : 26}
                                color={color}
                            />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    activeTab: {
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: Radius.full,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -6,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
});
