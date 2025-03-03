import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import organizeReducer from './slices/organizeSlice';
import settingsReducer from './slices/settingsSlice';
import filesReducer from './slices/filesSlice';

export const store = configureStore({
    reducer: {
        app: appReducer,
        organize: organizeReducer,
        settings: settingsReducer,
        files: filesReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore non-serializable values for specific action types
                ignoredActions: ['files/setMetadata', 'settings/saveProfile', 'settings/loadProfile', 'organize/organizeFiles'],
                // Ignore non-serializable paths
                ignoredPaths: ['files.metadata'],
            },
        }),
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Define proper action type for useDispatch
// This allows proper typing of thunks when using dispatch
declare module 'react-redux' {
    interface DefaultRootState extends RootState {}
}