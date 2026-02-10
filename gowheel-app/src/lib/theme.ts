import { StyleSheet } from 'react-native';

// GoWheel brand colors — dark theme matching the website
export const Colors = {
    // Primary emerald/teal gradient
    primary: '#10b981',
    primaryLight: '#34d399',
    primaryDark: '#059669',
    teal: '#14b8a6',

    // Backgrounds
    background: '#0a0a0a',
    card: '#141414',
    cardHover: '#1a1a1a',
    surface: '#1e1e1e',

    // Text
    text: '#fafafa',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',

    // Borders
    border: '#27272a',
    borderLight: '#3f3f46',

    // Status colors
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    // Booking statuses
    requested: '#f59e0b',
    approved: '#3b82f6',
    confirmed: '#22c55e',
    rejected: '#ef4444',
    cancelled: '#71717a',
    completed: '#8b5cf6',

    // Misc
    white: '#ffffff',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.6)',
    shimmer: '#2a2a2a',
};

// Common spacing values
export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

// Font sizes
export const FontSize = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    hero: 40,
};

// Border radius
export const Radius = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 999,
};

// Common shadow for cards
export const cardShadow = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
};

// Global stylesheet for reusable styles
export const GlobalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    screenPadding: {
        paddingHorizontal: Spacing.lg,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    textPrimary: {
        color: Colors.text,
        fontSize: FontSize.md,
    },
    textSecondary: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
    },
    title: {
        color: Colors.text,
        fontSize: FontSize.xxl,
        fontWeight: '700',
    },
    subtitle: {
        color: Colors.textSecondary,
        fontSize: FontSize.md,
    },
    card: {
        backgroundColor: Colors.card,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        ...cardShadow,
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        color: Colors.text,
        fontSize: FontSize.md,
    },
    gradientButton: {
        backgroundColor: Colors.primary,
        borderRadius: Radius.md,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    gradientButtonText: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: '600',
    },
    outlineButton: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    outlineButtonText: {
        color: Colors.text,
        fontSize: FontSize.md,
        fontWeight: '500',
    },
    badge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.full,
        borderWidth: 1,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.lg,
    },
});
