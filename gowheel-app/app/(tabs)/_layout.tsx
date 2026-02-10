import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/lib/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function TabsLayout() {
    const { profile } = useAuth();
    const isAdmin = profile?.role === 'admin';

    return (
        <Tabs
            screenOptions={{
                headerStyle: { backgroundColor: Colors.background, elevation: 0, shadowOpacity: 0 },
                headerTintColor: Colors.text,
                headerTitleStyle: { fontWeight: '700' },
                tabBarStyle: {
                    backgroundColor: Colors.background,
                    borderTopColor: Colors.border,
                    borderTopWidth: 1,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 4,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    headerTitle: 'GoWheel',
                    tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="vehicles"
                options={{
                    title: 'Vehicles',
                    tabBarIcon: ({ color, size }) => <Ionicons name="car-sport" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="bookings"
                options={{
                    title: 'Bookings',
                    tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
                }}
            />
            {isAdmin && (
                <Tabs.Screen
                    name="admin"
                    options={{
                        title: 'Admin',
                        tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark" size={size} color={color} />,
                    }}
                />
            )}
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
