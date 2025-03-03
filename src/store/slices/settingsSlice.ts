import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

interface AdvancedSettings {
    enableGeoTagging: boolean;
    enableAiCategorization: boolean;
    aiApiKey: string;
    enableCloudUpload: boolean;
    cloudService: string;
    enableScheduling: boolean;
    scheduleTime: string;
    enableExifEdit: boolean;
    exifEditCommands: string;
    enableFormatConversion: boolean;
    convertFormatFrom: string;
    convertFormatTo: string;
    convertQuality: number;
    enableFaceRecognition: boolean;
    enableVideoProcessing: boolean;
    enableWebInterface: boolean;
    webPort: number;
    enableSocialSharing: boolean;
    socialPlatforms: string;
    enablePlugins: boolean;
    enableVisualization: boolean;
    visualizationType: string;
    enableEncryption: boolean;
    encryptionPassword: string;
    parallelJobs: number;
}

interface SettingsState {
    profiles: string[];
    currentProfile: string;
    advancedSettings: AdvancedSettings;
    isLoading: boolean;
    error: string | null;
}

const initialState: SettingsState = {
    profiles: [],
    currentProfile: 'default',
    advancedSettings: {
        enableGeoTagging: false,
        enableAiCategorization: false,
        aiApiKey: '',
        enableCloudUpload: false,
        cloudService: '',
        enableScheduling: false,
        scheduleTime: '',
        enableExifEdit: false,
        exifEditCommands: '',
        enableFormatConversion: false,
        convertFormatFrom: '',
        convertFormatTo: '',
        convertQuality: 80,
        enableFaceRecognition: false,
        enableVideoProcessing: false,
        enableWebInterface: false,
        webPort: 8080,
        enableSocialSharing: false,
        socialPlatforms: '',
        enablePlugins: false,
        enableVisualization: false,
        visualizationType: 'timeline',
        enableEncryption: false,
        encryptionPassword: '',
        parallelJobs: 1,
    },
    isLoading: false,
    error: null,
};

// Async thunks
export const loadProfiles = createAsyncThunk(
    'settings/loadProfiles',
    async (_, { rejectWithValue }) => {
        try {
            const result = await window.electronAPI.listConfigs();

            if (!result.success) {
                return rejectWithValue(result.error || 'Failed to list configuration profiles');
            }

            return result.profiles;
        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
);

export const loadProfile = createAsyncThunk(
    'settings/loadProfile',
    async (profileName: string, { rejectWithValue }) => {
        try {
            const result = await window.electronAPI.loadConfig(profileName);

            if (!result.success) {
                return rejectWithValue(result.error || 'Failed to load configuration profile');
            }

            return {
                profileName,
                config: result.config,
            };
        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
);

export const saveProfile = createAsyncThunk(
    'settings/saveProfile',
    async (
        { profileName, config }: { profileName: string; config: Record<string, any> },
        { rejectWithValue }
    ) => {
        try {
            const result = await window.electronAPI.saveConfig(profileName, config);

            if (!result.success) {
                return rejectWithValue(result.error || 'Failed to save configuration profile');
            }

            return profileName;
        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
);

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setCurrentProfile: (state, action: PayloadAction<string>) => {
            state.currentProfile = action.payload;
        },
        updateAdvancedSettings: (state, action: PayloadAction<Partial<AdvancedSettings>>) => {
            state.advancedSettings = { ...state.advancedSettings, ...action.payload };
        },
        resetAdvancedSettings: (state) => {
            state.advancedSettings = initialState.advancedSettings;
        },
    },
    extraReducers: (builder) => {
        builder
            // loadProfiles
            .addCase(loadProfiles.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loadProfiles.fulfilled, (state, action) => {
                state.isLoading = false;
                state.profiles = action.payload;
            })
            .addCase(loadProfiles.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // loadProfile
            .addCase(loadProfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loadProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentProfile = action.payload.profileName;

                // Update advanced settings from loaded config
                if (action.payload.config.advancedSettings) {
                    state.advancedSettings = {
                        ...state.advancedSettings,
                        ...action.payload.config.advancedSettings,
                    };
                }
            })
            .addCase(loadProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // saveProfile
            .addCase(saveProfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(saveProfile.fulfilled, (state, action) => {
                state.isLoading = false;

                // Add to profiles list if not already there
                if (!state.profiles.includes(action.payload)) {
                    state.profiles.push(action.payload);
                }
            })
            .addCase(saveProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    setCurrentProfile,
    updateAdvancedSettings,
    resetAdvancedSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;