import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
    darkMode: boolean;
    currentLanguage: string;
    isLoading: boolean;
    appVersion: string;
    notification: {
        show: boolean;
        type: 'info' | 'success' | 'warning' | 'error';
        message: string;
    };
}

const initialState: AppState = {
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    currentLanguage: navigator.language.split('-')[0] || 'en',
    isLoading: false,
    appVersion: '',
    notification: {
        show: false,
        type: 'info',
        message: '',
    },
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        toggleDarkMode: (state) => {
            state.darkMode = !state.darkMode;
        },
        setLanguage: (state, action: PayloadAction<string>) => {
            state.currentLanguage = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setAppVersion: (state, action: PayloadAction<string>) => {
            state.appVersion = action.payload;
        },
        showNotification: (state, action: PayloadAction<{ type: 'info' | 'success' | 'warning' | 'error'; message: string }>) => {
            state.notification = {
                show: true,
                type: action.payload.type,
                message: action.payload.message,
            };
        },
        hideNotification: (state) => {
            state.notification.show = false;
        },
    },
});

export const {
    toggleDarkMode,
    setLanguage,
    setLoading,
    setAppVersion,
    showNotification,
    hideNotification,
} = appSlice.actions;

export default appSlice.reducer;