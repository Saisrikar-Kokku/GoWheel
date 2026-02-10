import { StyleSheet } from 'react-native';

// ——————————————————————————————————————————
// GoWheel Theme System — Dark & Light Palettes
// ——————————————————————————————————————————

export type ThemeMode = 'dark' | 'light' | 'system';

export interface ColorPalette {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    teal: string;
    background: string;
    card: string;
    cardHover: string;
    surface: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderLight: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    requested: string;
    approved: string;
    confirmed: string;
    rejected: string;
    cancelled: string;
    completed: string;
    white: string;
    black: string;
    overlay: string;
    shimmer: string;
    gradient1: string;
    gradient2: string;
    tabBarBg: string;
    statusBarStyle: 'light' | 'dark';
}

export const DarkColors: ColorPalette = {
    primary: '#10b981',
    primaryLight: '#34d399',
    primaryDark: '#059669',
    teal: '#14b8a6',
    background: '#0a0a0a',
    card: '#141414',
    cardHover: '#1a1a1a',
    surface: '#1e1e1e',
    text: '#fafafa',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    border: '#27272a',
    borderLight: '#3f3f46',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    requested: '#f59e0b',
    approved: '#3b82f6',
    confirmed: '#22c55e',
    rejected: '#ef4444',
    cancelled: '#71717a',
    completed: '#8b5cf6',
    white: '#ffffff',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.6)',
    shimmer: '#2a2a2a',
    gradient1: '#10b981',
    gradient2: '#059669',
    tabBarBg: '#111111',
    statusBarStyle: 'light',
};

export const LightColors: ColorPalette = {
    primary: '#059669',
    primaryLight: '#10b981',
    primaryDark: '#047857',
    teal: '#0d9488',
    background: '#f8fafc',
    card: '#ffffff',
    cardHover: '#f1f5f9',
    surface: '#f1f5f9',
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    border: '#e2e8f0',
    borderLight: '#cbd5e1',
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
    info: '#2563eb',
    requested: '#d97706',
    approved: '#2563eb',
    confirmed: '#16a34a',
    rejected: '#dc2626',
    cancelled: '#94a3b8',
    completed: '#7c3aed',
    white: '#ffffff',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.3)',
    shimmer: '#e2e8f0',
    gradient1: '#059669',
    gradient2: '#10b981',
    tabBarBg: '#ffffff',
    statusBarStyle: 'dark',
};

// Default export for backward compatibility (screens that haven't been migrated yet)
export const Colors = DarkColors;

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

// Light shadow for light mode
export const lightCardShadow = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
