import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { DarkColors, LightColors, ColorPalette, ThemeMode, cardShadow, lightCardShadow } from '@/lib/theme';

interface ThemeContextType {
    colors: ColorPalette;
    mode: ThemeMode;
    isDark: boolean;
    shadow: typeof cardShadow;
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'gowheel_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const systemScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('system');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved preference
    useEffect(() => {
        SecureStore.getItemAsync(THEME_KEY).then((saved) => {
            if (saved === 'dark' || saved === 'light' || saved === 'system') {
                setModeState(saved);
            }
            setIsLoaded(true);
        }).catch(() => setIsLoaded(true));
    }, []);

    const setMode = (newMode: ThemeMode) => {
        setModeState(newMode);
        SecureStore.setItemAsync(THEME_KEY, newMode).catch(() => { });
    };

    const isDark = mode === 'system'
        ? systemScheme !== 'light'
        : mode === 'dark';

    const colors = isDark ? DarkColors : LightColors;
    const shadow = isDark ? cardShadow : lightCardShadow;

    // Always render children (don't block on load — fallback is dark)
    return (
        <ThemeContext.Provider value={{ colors, mode, isDark, shadow, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        // Fallback for components outside provider
        return {
            colors: DarkColors,
            mode: 'dark' as ThemeMode,
            isDark: true,
            shadow: cardShadow,
            setMode: () => { },
        };
    }
    return context;
}
