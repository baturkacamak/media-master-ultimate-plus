import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CloudFile, CloudProvider, CloudProviderInfo, UploadOptions } from '@common/types';
import { RootState } from '@/store';

interface CloudStorageState {
  availableProviders: CloudProviderInfo[];
  activeProvider: CloudProvider | null;
  currentFolderId: string | null;
  files: CloudFile[];
  folderHistory: { id: string | null; name: string }[];
  uploading: boolean;
  uploadProgress: {
    processed: number;
    total: number;
    percentage: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: CloudStorageState = {
  availableProviders: [
    { id: 'google-drive', name: 'Google Drive', isConnected: false, icon: 'google-drive' },
    { id: 'dropbox', name: 'Dropbox', isConnected: false, icon: 'dropbox' },
    { id: 'onedrive', name: 'OneDrive', isConnected: false, icon: 'onedrive' },
  ],
  activeProvider: null,
  currentFolderId: null,
  files: [],
  folderHistory: [{ id: null, name: 'Root' }],
  uploading: false,
  uploadProgress: {
    processed: 0,
    total: 0,
    percentage: 0,
  },
  isLoading: false,
  error: null,
};

// Async thunks
export const initializeCloudStorage = createAsyncThunk(
  'cloudStorage/initialize',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const result = await window.electronAPI.cloudStorageInitialize();

      if (!result.success) {
        return rejectWithValue(result.error || 'Failed to initialize cloud storage');
      }

      // Get all provider configs to determine which are connected
      const configsResult = await window.electronAPI.getAllProviderConfigs();
      if (configsResult.success && configsResult.configs) {
        const providers = initialState.availableProviders.map(provider => ({
          ...provider,
          isConnected: configsResult.configs![provider.id].enabled,
        }));

        dispatch(updateProviders(providers));

        // Set active provider if available
        const activeProviderResult = await window.electronAPI.getActiveProvider();
        if (activeProviderResult.success && activeProviderResult.provider) {
          dispatch(setActiveProvider(activeProviderResult.provider));
        }
      }

      return true;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const connectToProvider = createAsyncThunk;
{
  provider: CloudProvider, isConnected;
:
  boolean;
}
,
CloudProvider
> (
  'cloudStorage/connectToProvider',
    async (provider, { rejectWithValue }) => {
      try {
        const urlResult = await window.electronAPI.getAuthorizationUrl(provider);

        if (!urlResult.success) {
          return rejectWithValue(urlResult.error || 'Failed to get authorization URL');
        }

        // Open URL in external browser
        window.open(urlResult.url, '_blank');

        // This is a bit tricky as we need to wait for the user to authenticate
        // In a real app, you might use a redirect URL and set up a local server to handle the callback
        // For this example, we'll use a prompt to get the code
        const code = prompt('Enter the authorization code:');

        if (!code) {
          return rejectWithValue('Authorization canceled');
        }

        const tokenResult = await window.electronAPI.exchangeCodeForToken(provider, code);

        if (!tokenResult.success) {
          return rejectWithValue(tokenResult.error || 'Failed to exchange code for token');
        }

        await window.electronAPI.setActiveProvider(provider);

        return { provider, isConnected: true };
      } catch (error) {
        return rejectWithValue((error as Error).message);
      }
    }
);

export const disconnectFromProvider = createAsyncThunk;
{
  provider: CloudProvider, isConnected;
:
  boolean;
}
,
CloudProvider
> (
  'cloudStorage/disconnectFromProvider',
    async (provider, { rejectWithValue, getState }) => {
      try {
        const result = await window.electronAPI.disconnectCloudProvider(provider);

        if (!result.success) {
          return rejectWithValue(result.error || 'Failed to disconnect from provider');
        }

        // If this was the active provider, reset the active provider
        const state = getState() as RootState;
        if (state.cloudStorage.activeProvider === provider) {
          // Find the next available provider
          const availableProvider = state.cloudStorage.availableProviders.find(
            p => p.id !== provider && p.isConnected,
          );

          if (availableProvider) {
            await window.electronAPI.setActiveProvider(availableProvider.id);
          }
        }

        return { provider, isConnected: false };
      } catch (error) {
        return rejectWithValue((error as Error).message);
      }
    }
);

export const listFiles = createAsyncThunk;
CloudFile[],
{ provider: CloudProvider, folderId? : string }
> (
  'cloudStorage/listFiles',
    async ({ provider, folderId }, { rejectWithValue }) => {
      try {
        const result = await window.electronAPI.listCloudFiles(provider, folderId);

        if (!result.success) {
          return rejectWithValue(result.error || 'Failed to list files');
        }

        return result.files || [];
      } catch (error) {
        return rejectWithValue((error as Error).message);
      }
    }
);

export const createFolder = createAsyncThunk;
CloudFile,
{ provider: CloudProvider, folderName: string, parentFolderId? : string }
> (
  'cloudStorage/createFolder',
    async ({ provider, folderName, parentFolderId }, { rejectWithValue }) => {
      try {
        const result = await window.electronAPI.createCloudFolder(provider, folderName, parentFolderId);

        if (!result.success) {
          return rejectWithValue(result.error || 'Failed to create folder');
        }

        return result.folder!;
      } catch (error) {
        return rejectWithValue((error as Error).message);
      }
    }
);

export const uploadFiles = createAsyncThunk;
{
  processed: number, failed;
:
  number, results;
:
  CloudFile[];
}
,
{
  provider: CloudProvider, filePaths;
:
  string[], options;
:
  UploadOptions;
}
>
(
  'cloudStorage/uploadFiles',
    async ({ provider, filePaths, options }, { rejectWithValue, dispatch }) => {
      try {
        dispatch(setUploading(true));

        // Set up event listeners for progress
        const removeProgressListener = window.electronAPI.on('cloud:progress', (progress) => {
          dispatch(updateUploadProgress({
            processed: progress.processed,
            total: progress.total,
            percentage: progress.percentage,
          }));
        });

        const result = await window.electronAPI.uploadFilesToCloud(provider, filePaths, options);

        // Clean up event listeners
        removeProgressListener();

        if (!result.success) {
          return rejectWithValue(result.error || 'Failed to upload files');
        }

        return {
          processed: result.processed || 0,
          failed: result.failed || 0,
          results: result.results || [],
        };
      } catch (error) {
        return rejectWithValue((error as Error).message);
      } finally {
        dispatch(setUploading(false));
      }
    }
);

const cloudStorageSlice = createSlice({
  name: 'cloudStorage',
  initialState,
  reducers: {
    updateProviders: (state, action: PayloadAction<CloudProviderInfo[]>) => {
      state.availableProviders = action.payload;
    },
    setActiveProvider: (state, action: PayloadAction<CloudProvider | null>) => {
      state.activeProvider = action.payload;
      state.currentFolderId = null;
      state.folderHistory = [{ id: null, name: 'Root' }];
    },
    setCurrentFolder: (state, action: PayloadAction<{ id: string | null; name: string }>) => {
      state.currentFolderId = action.payload.id;

      // Update folder history
      if (action.payload.id === null) {
        // Going to root
        state.folderHistory = [{ id: null, name: 'Root' }];
      } else {
        // Check if we're going back in history
        const existingIndex = state.folderHistory.findIndex(f => f.id === action.payload.id);

        if (existingIndex >= 0) {
          // Truncate history to this point
          state.folderHistory = state.folderHistory.slice(0, existingIndex + 1);
        } else {
          // Add to history
          state.folderHistory.push(action.payload);
        }
      }
    },
    setUploading: (state, action: PayloadAction<boolean>) => {
      state.uploading = action.payload;

      if (!action.payload) {
        // Reset progress when not uploading
        state.uploadProgress = {
          processed: 0,
          total: 0,
          percentage: 0,
        };
      }
    },
    updateUploadProgress: (state, action: PayloadAction<{
      processed: number;
      total: number;
      percentage: number;
    }>) => {
      state.uploadProgress = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize
      .addCase(initializeCloudStorage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeCloudStorage.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(initializeCloudStorage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Connect to provider
      .addCase(connectToProvider.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(connectToProvider.fulfilled, (state, action) => {
        state.isLoading = false;

        // Update provider connection status
        const index = state.availableProviders.findIndex(p => p.id === action.payload.provider);
        if (index >= 0) {
          state.availableProviders[index].isConnected = action.payload.isConnected;
        }

        // Set as active provider
        state.activeProvider = action.payload.provider;
        state.currentFolderId = null;
        state.folderHistory = [{ id: null, name: 'Root' }];
      })
      .addCase(connectToProvider.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Disconnect from provider
      .addCase(disconnectFromProvider.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(disconnectFromProvider.fulfilled, (state, action) => {
        state.isLoading = false;

        // Update provider connection status
        const index = state.availableProviders.findIndex(p => p.id === action.payload.provider);
        if (index >= 0) {
          state.availableProviders[index].isConnected = action.payload.isConnected;
        }

        // If this was the active provider, reset it
        if (state.activeProvider === action.payload.provider) {
          // Find the next available provider
          const nextProvider = state.availableProviders.find(p => p.id !== action.payload.provider && p.isConnected);
          state.activeProvider = nextProvider ? nextProvider.id : null;
          state.currentFolderId = null;
          state.folderHistory = [{ id: null, name: 'Root' }];
        }
      })
      .addCase(disconnectFromProvider.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // List files
      .addCase(listFiles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(listFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.files = action.payload;
      })
      .addCase(listFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Create folder
      .addCase(createFolder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createFolder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.files.push(action.payload);
      })
      .addCase(createFolder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Upload files
      .addCase(uploadFiles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadFiles.fulfilled, (state, action) => {
        state.isLoading = false;

        // Add uploaded files to the current listing
        action.payload.results.forEach(file => {
          // Check if the file already exists in the list
          const existingIndex = state.files.findIndex(f => f.id === file.id);

          if (existingIndex >= 0) {
            // Update existing file
            state.files[existingIndex] = file;
          } else {
            // Add new file
            state.files.push(file);
          }
        });
      })
      .addCase(uploadFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  updateProviders,
  setActiveProvider,
  setCurrentFolder,
  setUploading,
  updateUploadProgress,
  clearError,
} = cloudStorageSlice.actions;

export default cloudStorageSlice.reducer;