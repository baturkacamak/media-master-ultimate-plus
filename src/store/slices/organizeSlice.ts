import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../index';

interface OrganizeState {
    sourcePath: string;
    destinationPath: string;
    operation: 'move' | 'copy';
    pattern: string;
    recursive: boolean;
    conflicts: 'rename' | 'skip' | 'overwrite';
    filters: {
        dateFrom: string;
        dateTo: string;
        sizeLimit: string;
        fileTypes: string[];
    };
    options: {
        createBackup: boolean;
        skipDuplicates: boolean;
        organizeByType: boolean;
        organizeByCamera: boolean;
        customRenamePattern: string;
    };
    progress: {
        isRunning: boolean;
        currentFile: string;
        processed: number;
        total: number;
        percentage: number;
        succeeded: number;
        skipped: number;
        errors: number;
    };
}

const initialState: OrganizeState = {
    sourcePath: '',
    destinationPath: '',
    operation: 'move',
    pattern: '%Y/%m/%d',
    recursive: false,
    conflicts: 'rename',
    filters: {
        dateFrom: '',
        dateTo: '',
        sizeLimit: '',
        fileTypes: [],
    },
    options: {
        createBackup: false,
        skipDuplicates: true,
        organizeByType: false,
        organizeByCamera: false,
        customRenamePattern: '',
    },
    progress: {
        isRunning: false,
        currentFile: '',
        processed: 0,
        total: 0,
        percentage: 0,
        succeeded: 0,
        skipped: 0,
        errors: 0,
    },
};

// Async thunks
export const organizeFiles = createAsyncThunk(
    'organize/organizeFiles',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const { organize } = state;

            // Call Electron API to organize files
            const result = await window.electronAPI.organizeFiles({
                sourcePath: organize.sourcePath,
                destinationPath: organize.destinationPath,
                operation: organize.operation,
                pattern: organize.pattern,
                recursive: organize.recursive,
                conflicts: organize.conflicts,
                filters: organize.filters,
                options: organize.options,
            });

            if (!result.success) {
                return rejectWithValue(result.error || 'Failed to organize files');
            }

            return result.results;
        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
);

const organizeSlice = createSlice({
    name: 'organize',
    initialState,
    reducers: {
        setSourcePath: (state, action: PayloadAction<string>) => {
            state.sourcePath = action.payload;
        },
        setDestinationPath: (state, action: PayloadAction<string>) => {
            state.destinationPath = action.payload;
        },
        setOperation: (state, action: PayloadAction<'move' | 'copy'>) => {
            state.operation = action.payload;
        },
        setPattern: (state, action: PayloadAction<string>) => {
            state.pattern = action.payload;
        },
        setRecursive: (state, action: PayloadAction<boolean>) => {
            state.recursive = action.payload;
        },
        setConflicts: (state, action: PayloadAction<'rename' | 'skip' | 'overwrite'>) => {
            state.conflicts = action.payload;
        },
        setFilters: (state, action: PayloadAction<Partial<OrganizeState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        setOptions: (state, action: PayloadAction<Partial<OrganizeState['options']>>) => {
            state.options = { ...state.options, ...action.payload };
        },
        updateProgress: (state, action: PayloadAction<Partial<OrganizeState['progress']>>) => {
            state.progress = { ...state.progress, ...action.payload };
        },
        resetProgress: (state) => {
            state.progress = initialState.progress;
        },
        resetAll: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(organizeFiles.pending, (state) => {
                state.progress = {
                    ...state.progress,
                    isRunning: true,
                    processed: 0,
                    total: 0,
                    percentage: 0,
                    succeeded: 0,
                    skipped: 0,
                    errors: 0,
                };
            })
            .addCase(organizeFiles.fulfilled, (state, action) => {
                state.progress = {
                    ...state.progress,
                    isRunning: false,
                    total: action.payload.total,
                    succeeded: action.payload.succeeded,
                    skipped: action.payload.skipped,
                    errors: action.payload.errors,
                    percentage: 100,
                };
            })
            .addCase(organizeFiles.rejected, (state) => {
                state.progress.isRunning = false;
            });
    },
});

export const {
    setSourcePath,
    setDestinationPath,
    setOperation,
    setPattern,
    setRecursive,
    setConflicts,
    setFilters,
    setOptions,
    updateProgress,
    resetProgress,
    resetAll,
} = organizeSlice.actions;

export default organizeSlice.reducer;