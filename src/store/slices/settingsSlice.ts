import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AdvancedSettings {
  enableGeoTagging: boolean;
  enableAiCategorization: boolean;
  aiApiKey: string;
  aiUseLocalModel: boolean;
  aiConfidenceThreshold: number;
  aiMaxTags: number;
  aiIncludeDominantColors: boolean;
  aiIncludeObjectDetection: boolean;
  aiCustomCategories: string[];
  enableFaceRecognition: boolean;
  faceApiKey: string;
  faceUseLocalModel: boolean;
  faceMinSize: number;
  faceMaxSize: number;
  faceConfidenceThreshold: number;
  faceRecognitionThreshold: number;
  faceEnableLandmarks: boolean;
  faceEnableAttributes: boolean;
  faceMaxPerImage: number;
  enableCloudUpload: boolean;
  cloudService: string;
  enableScheduling: boolean;
  scheduleTime: string;
  enableFormatConversion: boolean;
  convertFormatFrom: string;
  convertFormatTo: string;
  convertQuality: number;
  resizeWidth: number | null;
  resizeHeight: number | null;
  maintainAspectRatio: boolean;
  deleteOriginalAfterConversion: boolean;
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
  // Add these EXIF editing settings
  enableExifEdit: boolean;
  exifCreateBackup: boolean;
  exifBackupDir: string;
  exifEditCommands: string;
  socialAutoShare: boolean;
  socialDefaultText: string;
  socialDefaultHashtags: string[];
  preserveDirectoryStructure: boolean;
  uploadAfterOrganizing: boolean;
}

interface ProfileConfig {
  advancedSettings?: AdvancedSettings;

  [key: string]: any;
}

interface LoadProfileResult {
  profileName: string;
  config: ProfileConfig;
}

interface SettingsState {
  profiles: string[];
  currentProfile: string;
  advancedSettings: AdvancedSettings;
  isLoading: boolean;
  error: string | null;
}

const initialState: {
  profiles: any[]; currentProfile: string; advancedSettings: {
    enableGeoTagging: boolean;
    enableAiCategorization: boolean;
    aiApiKey: string;
    aiUseLocalModel: boolean;
    aiConfidenceThreshold: number;
    aiMaxTags: number;
    aiIncludeDominantColors: boolean;
    aiIncludeObjectDetection: boolean;
    aiCustomCategories: any[];
    enableFaceRecognition: boolean;
    faceApiKey: string;
    faceUseLocalModel: boolean;
    faceMinSize: number;
    faceMaxSize: number;
    faceConfidenceThreshold: number;
    faceRecognitionThreshold: number;
    faceEnableLandmarks: boolean;
    faceEnableAttributes: boolean;
    faceMaxPerImage: number;
    enableCloudUpload: boolean;
    cloudService: string;
    enableScheduling: boolean;
    scheduleTime: string;
    enableExifEdit: boolean;
    exifCreateBackup: boolean;
    exifBackupDir: string;
    exifEditCommands: string;
    enableFormatConversion: boolean;
    convertFormatFrom: string;
    convertFormatTo: string;
    convertQuality: number;
    resizeWidth: null;
    resizeHeight: null;
    maintainAspectRatio: boolean;
    deleteOriginalAfterConversion: boolean;
    enableVideoProcessing: boolean;
    enableWebInterface: boolean;
    webPort: number;
    enableSocialSharing: boolean;
    socialPlatforms: any[];
    socialAutoShare: boolean;
    socialDefaultText: string;
    socialDefaultHashtags: any[];
    enablePlugins: boolean;
    enableVisualization: boolean;
    visualizationType: string;
    enableEncryption: boolean;
    encryptionPassword: string;
    parallelJobs: number;
    preserveDirectoryStructure: boolean;
    uploadAfterOrganizing: boolean
  }; isLoading: boolean; error: null
} = {
  profiles: [],
  currentProfile: 'default',
  advancedSettings: {
    enableGeoTagging: false,
    enableAiCategorization: false,
    aiApiKey: '',
    aiUseLocalModel: true,
    aiConfidenceThreshold: 0.6,
    aiMaxTags: 10,
    aiIncludeDominantColors: true,
    aiIncludeObjectDetection: true,
    aiCustomCategories: [],
    enableFaceRecognition: false,
    faceApiKey: '',
    faceUseLocalModel: true,
    faceMinSize: 20,
    faceMaxSize: 0,
    faceConfidenceThreshold: 0.7,
    faceRecognitionThreshold: 0.6,
    faceEnableLandmarks: true,
    faceEnableAttributes: true,
    faceMaxPerImage: 20,
    enableCloudUpload: false,
    cloudService: '',
    enableScheduling: false,
    scheduleTime: '',
    enableExifEdit: false,
    exifCreateBackup: true,
    exifBackupDir: '',
    exifEditCommands: '',
    enableFormatConversion: false,
    convertFormatFrom: 'jpg',
    convertFormatTo: 'webp',
    convertQuality: 80,
    resizeWidth: null,
    resizeHeight: null,
    maintainAspectRatio: true,
    deleteOriginalAfterConversion: false,
    enableVideoProcessing: false,
    enableWebInterface: false,
    webPort: 8080,
    enableSocialSharing: false,
    socialPlatforms: [],
    socialAutoShare: false,
    socialDefaultText: '',
    socialDefaultHashtags: [],
    enablePlugins: false,
    enableVisualization: false,
    visualizationType: 'timeline',
    enableEncryption: false,
    encryptionPassword: '',
    parallelJobs: 1,
    preserveDirectoryStructure: true,
    uploadAfterOrganizing: false,
  },
  isLoading: false,
  error: null,
};

// Async thunks
export const loadProfiles = createAsyncThunk<string[]>(
  'settings/loadProfiles',
  async (_, { rejectWithValue }) => {
    try {
      const result = await window.electronAPI.listConfigs();

      if (!result.success) {
        return rejectWithValue(result.error || 'Failed to list configuration profiles');
      }

      return result.profiles || [];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const loadProfile = createAsyncThunk<LoadProfileResult, string>(
  'settings/loadProfile',
  async (profileName, { rejectWithValue }) => {
    try {
      const result = await window.electronAPI.loadConfig(profileName);

      if (!result.success) {
        return rejectWithValue(result.error || 'Failed to load configuration profile');
      }

      return {
        profileName,
        config: result.config || {},
      };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const saveProfile = createAsyncThunk<
  string,
  { profileName: string; config: Record<string, any> }
>(
  'settings/saveProfile',
  async ({ profileName, config }, { rejectWithValue }) => {
    try {
      const result = await window.electronAPI.saveConfig(profileName, config);

      if (!result.success) {
        return rejectWithValue(result.error || 'Failed to save configuration profile');
      }

      return profileName;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
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
    updateSocialSharingSettings: (state, action: PayloadAction<{
      enableSocialSharing?: boolean;
      socialPlatforms?: SocialPlatformConfig[];
      socialAutoShare?: boolean;
      socialDefaultText?: string;
      socialDefaultHashtags?: string[];
    }>) => {
      state.advancedSettings = {
        ...state.advancedSettings,
        ...action.payload,
      };
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
        if (action.payload.config && action.payload.config.advancedSettings) {
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
  updateSocialSharingSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;