import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { FileMetadata } from '../../common/types';

interface FilesState {
    fileList: string[];
    selectedFile: string | null;
    metadata: Record<string, FileMetadata>;
    isScanning: boolean;
    error: string | null;
}

const initialState: FilesState = {
    fileList: [],
    selectedFile: null,
    metadata: {},
    isScanning: false,
    error: null,
};

// Async thunks
export const scanDirectory = createAsyncThunk(
    'files/scanDirectory',
    async (
        { dirPath, options }: { dirPath: string; options: { recursive: boolean; fileTypes?: string[] } },
        { rejectWithValue }
    ) => {
        try {
            const result = await window.electronAPI.scanDirectory(dirPath, options);

            if (!result.success) {
                return rejectWithValue(result.error || 'Failed to scan directory');
            }

            return result.files;
        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
);

export const getFileMetadata = createAsyncThunk(
    'files/getMetadata',
    async (filePath: string, { rejectWithValue }) => {
        try {
            const result = await window.electronAPI.getFileMetadata(filePath);

            if (!result.success) {
                return rejectWithValue(result.error || 'Failed to get file metadata');
            }

            return {
                filePath,
                metadata: result.metadata,
            };
        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
);

const filesSlice = createSlice({
    name: 'files',
    initialState,
    reducers: {
        setSelectedFile: (state, action: PayloadAction<string | null>) => {
            state.selectedFile = action.payload;
        },
        clearFiles: (state) => {
            state.fileList = [];
            state.selectedFile = null;
            state.metadata = {};
        },
        setMetadata: (state, action: PayloadAction<{ filePath: string; metadata: FileMetadata }>) => {
            state.metadata[action.payload.filePath] = action.payload.metadata;
        },
    },
    extraReducers: (builder) => {
        builder
            // scanDirectory
            .addCase(scanDirectory.pending, (state) => {
                state.isScanning = true;
                state.error = null;
            })
            .addCase(scanDirectory.fulfilled, (state, action) => {
                state.isScanning = false;
                state.fileList = action.payload;
            })
            .addCase(scanDirectory.rejected, (state, action) => {
                state.isScanning = false;
                state.error = action.payload as string;
            })

            // getFileMetadata
            .addCase(getFileMetadata.fulfilled, (state, action) => {
                state.metadata[action.payload.filePath] = action.payload.metadata;
            });
    },
});

export const {
    setSelectedFile,
    clearFiles,
    setMetadata,
} = filesSlice.actions;

export default filesSlice.reducer;