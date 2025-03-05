import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  SocialPlatformConfig,
  SocialPostContent,
  SocialSharingResult,
  SocialSharingBatchResult
} from '../../common/types';
import { RootState } from '../index';

interface SharingState {
  enabled: boolean;
  platforms: SocialPlatformConfig[];
  selectedPlatforms: string[];
  postContent: SocialPostContent;
  isSharing: boolean;
  shareResults: SocialSharingResult[];
  error: string | null;
}

const initialState: SharingState = {
  enabled: false,
  platforms: [],
  selectedPlatforms: [],
  postContent: {
    text: '',
    media: [],
    hashtags: []
  },
  isSharing: false,
  shareResults: [],
  error: null
};

// Async thunks
export const fetchAvailablePlatforms = createAsyncThunk<SocialPlatformConfig[]>(
  'sharing/fetchAvailablePlatforms',
  async (_, { rejectWithValue }) => {
    try {
      const result = await window.electronAPI.getAvailablePlatforms();
      if (!result.success) {
        return rejectWithValue(result.error || 'Failed to fetch available platforms');
      }
      return result.platforms || [];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const authenticatePlatform = createAsyncThunk<
  SocialPlatformConfig,
  { platformId: string; authCode?: string }
>(
  'sharing/authenticatePlatform',
  async ({ platformId, authCode }, { rejectWithValue }) => {
    try {
      const result = await window.electronAPI.authenticatePlatform(platformId, authCode);
      if (!result.success) {
        return rejectWithValue(result.error || 'Failed to authenticate platform');
      }
      return result.platform!;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const disconnectPlatform = createAsyncThunk<
  string,
  string
>(
  'sharing/disconnectPlatform',
  async (platformId, { rejectWithValue }) => {
    try {
      const result = await window.electronAPI.disconnectPlatform(platformId);
      if (!result.success) {
        return rejectWithValue(result.error || 'Failed to disconnect platform');
      }
      return platformId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const shareToSocial = createAsyncThunk<
  SocialSharingResult,
  { platformId: string; content: SocialPostContent }
>(
  'sharing/shareToSocial',
  async ({ platformId, content }, { rejectWithValue }) => {
    try {
      const result = await window.electronAPI.shareToSocial(platformId, content);
      if (!result.success) {
        return rejectWithValue(result.error || 'Failed to share to platform');
      }
      return result;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const shareToMultiplePlatforms = createAsyncThunk<
  SocialSharingBatchResult,
  { platformIds: string[]; content: SocialPostContent }
>(
  'sharing/shareToMultiplePlatforms',
  async ({ platformIds, content }, { rejectWithValue }) => {
    try {
      const result = await window.electronAPI.shareToMultiplePlatforms(platformIds, content);
      if (!result.overallSuccess && result.error) {
        return rejectWithValue(result.error);
      }
      return result;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const sharingSlice = createSlice({
  name: 'sharing',
  initialState,
  reducers: {
    setEnabled: (state, action: PayloadAction<boolean>) => {
      state.enabled = action.payload;
    },
    togglePlatformSelection: (state, action: PayloadAction<string>) => {
      const platformId = action.payload;
      if (state.selectedPlatforms.includes(platformId)) {
        state.selectedPlatforms = state.selectedPlatforms.filter(id => id !== platformId);
      } else {
        state.selectedPlatforms.push(platformId);
      }
    },
    setPostText: (state, action: PayloadAction<string>) => {
      state.postContent.text = action.payload;
    },
    addMedia: (state, action: PayloadAction<string>) => {
      if (!state.postContent.media) {
        state.postContent.media = [];
      }
      state.postContent.media.push(action.payload);
    },
    removeMedia: (state, action: PayloadAction<string>) => {
      if (state.postContent.media) {
        state.postContent.media = state.postContent.media.filter(path => path !== action.payload);
      }
    },
    clearMedia: (state) => {
      state.postContent.media = [];
    },
    addHashtag: (state, action: PayloadAction<string>) => {
      if (!state.postContent.hashtags) {
        state.postContent.hashtags = [];
      }
      // Remove the # if it was included
      const hashtag = action.payload.startsWith('#') ? action.payload.substring(1) : action.payload;
      if (!state.postContent.hashtags.includes(hashtag)) {
        state.postContent.hashtags.push(hashtag);
      }
    },
    removeHashtag: (state, action: PayloadAction<string>) => {
      if (state.postContent.hashtags) {
        state.postContent.hashtags = state.postContent.hashtags.filter(tag => tag !== action.payload);
      }
    },
    clearHashtags: (state) => {
      state.postContent.hashtags = [];
    },
    setLinkInfo: (state, action: PayloadAction<{url?: string; title?: string; description?: string}>) => {
      state.postContent.linkUrl = action.payload.url;
      state.postContent.linkTitle = action.payload.title;
      state.postContent.linkDescription = action.payload.description;
    },
    clearPostContent: (state) => {
      state.postContent = {
        text: '',
        media: [],
        hashtags: []
      };
    },
    clearShareResults: (state) => {
      state.shareResults = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchAvailablePlatforms
      .addCase(fetchAvailablePlatforms.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchAvailablePlatforms.fulfilled, (state, action) => {
        state.platforms = action.payload;
      })
      .addCase(fetchAvailablePlatforms.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // authenticatePlatform
      .addCase(authenticatePlatform.pending, (state) => {
        state.error = null;
      })
      .addCase(authenticatePlatform.fulfilled, (state, action) => {
        // Find and update the platform in the list
        const index = state.platforms.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.platforms[index] = action.payload;
        } else {
          state.platforms.push(action.payload);
        }
      })
      .addCase(authenticatePlatform.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // disconnectPlatform
      .addCase(disconnectPlatform.pending, (state) => {
        state.error = null;
      })
      .addCase(disconnectPlatform.fulfilled, (state, action) => {
        // Update platform enabled status
        const platformId = action.payload;
        const index = state.platforms.findIndex(p => p.id === platformId);
        if (index !== -1) {
          state.platforms[index].enabled = false;
          state.platforms[index].accessToken = undefined;
        }
        // Remove from selected platforms
        state.selectedPlatforms = state.selectedPlatforms.filter(id => id !== platformId);
      })
      .addCase(disconnectPlatform.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // shareToSocial
      .addCase(shareToSocial.pending, (state) => {
        state.isSharing = true;
        state.error = null;
      })
      .addCase(shareToSocial.fulfilled, (state, action) => {
        state.isSharing = false;
        state.shareResults.push(action.payload);
      })
      .addCase(shareToSocial.rejected, (state, action) => {
        state.isSharing = false;
        state.error = action.payload as string;
      })

      // shareToMultiplePlatforms
      .addCase(shareToMultiplePlatforms.pending, (state) => {
        state.isSharing = true;
        state.error = null;
      })
      .addCase(shareToMultiplePlatforms.fulfilled, (state, action) => {
        state.isSharing = false;
        state.shareResults = action.payload.results;
      })
      .addCase(shareToMultiplePlatforms.rejected, (state, action) => {
        state.isSharing = false;
        state.error = action.payload as string;
      });
  }
});

export const {
  setEnabled,
  togglePlatformSelection,
  setPostText,
  addMedia,
  removeMedia,
  clearMedia,
  addHashtag,
  removeHashtag,
  clearHashtags,
  setLinkInfo,
  clearPostContent,
  clearShareResults
} = sharingSlice.actions;

export default sharingSlice.reducer;