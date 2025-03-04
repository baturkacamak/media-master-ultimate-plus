/**
 * File metadata structure
 */
export interface FileMetadata {
    path: string;
    name: string;
    extension: string;
    size: number;
    createdAt: Date;
    modifiedAt: Date;
    type: 'image' | 'video' | 'unknown';

    // EXIF data (optional)
    dateTimeOriginal?: string;
    createDate?: string;
    make?: string;
    model?: string;
    width?: number;
    height?: number;
    latitude?: number;
    longitude?: number;
    iso?: number;
    exposureTime?: string;
    fNumber?: number;
    focalLength?: number;
    exif?: Record<string, any>;
}

/**
 * Option for organization pattern
 */
export interface PatternOption {
    code: string;
    description: string;
    example: string;
}

/**
 * Task status
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'cancelled' | 'error';

/**
 * Task information
 */
export interface Task {
    id: number;
    name: string;
    status: TaskStatus;
    sourcePath: string;
    destinationPath: string;
    operation: 'move' | 'copy';
    pattern: string;
    options: Record<string, any>;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    totalFiles: number;
    processedFiles: number;
    succeededFiles: number;
    skippedFiles: number;
    errorFiles: number;
}

/**
 * File processing status
 */
export type FileStatus = 'pending' | 'processing' | 'succeeded' | 'skipped' | 'error';

/**
 * File processing information
 */
export interface FileProcessing {
    id: number;
    taskId: number;
    sourcePath: string;
    destinationPath?: string;
    fileName: string;
    extension: string;
    size: number;
    createdAt?: Date;
    modifiedAt?: Date;
    exifData?: string;
    status: FileStatus;
    errorMessage?: string;
}

/**
 * Format conversion settings
 */
export interface FormatConversionSettings {
    enabled: boolean;
    sourceFormat: string;
    targetFormat: string;
    quality: 'low' | 'medium' | 'high' | 'lossless';
    deleteOriginal: boolean;
    resizeWidth?: number;
    resizeHeight?: number;
    maintainAspectRatio: boolean;
}

/**
 * Format conversion result
 */
export interface FormatConversionResult {
    success: boolean;
    sourcePath?: string;
    targetPath?: string;
    error?: string;
}

/**
 * Batch format conversion result
 */
export interface BatchFormatConversionResult {
    success: boolean;
    converted: number;
    failed: number;
    targetPaths: string[];
    error?: string;
}

/**
 * Available format information
 */
export interface AvailableFormats {
    image: string[];
    video: string[];
}


/**
 * AI categorization tag
 */
export interface CategoryTag {
    name: string;
    confidence: number;
    category: string;
}

/**
 * AI categorization result for a single file
 */
export interface CategorizationResult {
    filePath: string;
    tags: CategoryTag[];
    primaryCategory?: string;
    dominantColors?: string[];
    objects?: Array<{
        name: string;
        confidence: number;
        boundingBox?: { x: number; y: number; width: number; height: number };
    }>;
    error?: string;
}

/**
 * AI categorization settings
 */
export interface AiCategorizationSettings {
    enabled: boolean;
    useLocalModel: boolean;
    apiKey: string;
    confidenceThreshold: number;
    maxTags: number;
    includeDominantColors: boolean;
    includeObjectDetection: boolean;
    customCategories: string[];
}

/**
 * AI categorization progress
 */
export interface CategorizationProgress {
    processed: number;
    total: number;
    percentage: number;
    currentFile: string;
}

/**
 * AI categorization batch result
 */
export interface BatchCategorizationResult {
    success: boolean;
    results: CategorizationResult[];
    error?: string;
}

/**
 * Face detection structure
 */
export interface FaceDetection {
    id: string;                // Unique ID for this face instance
    boundingBox: {            // Coordinates of face in the image
        x: number;              // Left coordinate
        y: number;              // Top coordinate
        width: number;          // Width of face
        height: number;         // Height of face
    };
    confidence: number;       // Detection confidence (0-1)
    landmarks?: {             // Optional facial landmarks
        leftEye?: [number, number];
        rightEye?: [number, number];
        nose?: [number, number];
        mouth?: [number, number];
        leftEar?: [number, number];
        rightEar?: [number, number];
    };
    attributes?: {            // Optional face attributes
        age?: number;           // Estimated age
        gender?: string;        // Estimated gender
        emotion?: string;       // Dominant emotion
        glasses?: boolean;      // Wearing glasses
        smile?: boolean;        // Smiling
        pose?: {                // Head pose
            roll?: number;        // Roll angle
            yaw?: number;         // Yaw angle
            pitch?: number;       // Pitch angle
        };
    };
    personId?: string;        // ID of the recognized person (if matched)
    personName?: string;      // Name of the recognized person (if matched)
    matchConfidence?: number; // Confidence of person match (0-1)
}

/**
 * Face recognition result for a single image
 */
export interface FaceRecognitionResult {
    filePath: string;         // Path to the image file
    fileHash: string;         // Hash of the image file for tracking
    imageWidth: number;       // Width of the image
    imageHeight: number;      // Height of the image
    faces: FaceDetection[];   // Detected faces
    error?: string;           // Error message if processing failed
}

/**
 * Person data structure
 */
export interface Person {
    id: string;               // Unique ID for this person
    name: string;             // Person's name
    faceIds: string[];        // IDs of face samples for this person
    faceDescriptors: number[][]; // Face embedding vectors
    sampleImages: string[];   // Paths to sample images
    thumbnailPath?: string;   // Path to thumbnail image
    dateCreated: string;      // Date this person was created
    dateModified: string;     // Date this person was last modified
    imageCount: number;       // Number of images containing this person
}

/**
 * Face recognition settings
 */
export interface FaceRecognitionSettings {
    enabled: boolean;
    minFaceSize: number;
    maxFaceSize: number;
    confidenceThreshold: number;
    recognitionThreshold: number;
    enableLandmarks: boolean;
    enableAttributes: boolean;
    maxFacesPerImage: number;
    useLocalModel: boolean;
    apiKey: string;
}

/**
 * Face recognition progress
 */
export interface FaceRecognitionProgress {
    processed: number;
    total: number;
    percentage: number;
    currentFile: string;
}

/**
 * Face recognition batch result
 */
export interface BatchFaceRecognitionResult {
    success: boolean;
    results: FaceRecognitionResult[];
    error?: string;
}

/**
 * Electron API interface
 */
export interface ElectronAPI {
    // App info
    getAppVersion: () => Promise<string>;

    // File system operations
    selectDirectory: (options?: { title?: string; defaultPath?: string }) => Promise<string | null>;
    selectFile: (options?: { title?: string; defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => Promise<string | null>;

    // File operations
    scanDirectory: (dirPath: string, options: { recursive: boolean; fileTypes?: string[] }) => Promise<{ success: boolean; files?: string[]; error?: string }>;
    getFileMetadata: (filePath: string) => Promise<{ success: boolean; metadata?: FileMetadata; error?: string }>;
    organizeFiles: (options: {
        sourcePath: string;
        destinationPath: string;
        operation: 'move' | 'copy';
        pattern: string;
        recursive: boolean;
        conflicts: 'rename' | 'skip' | 'overwrite';
        filters?: {
            dateFrom?: string;
            dateTo?: string;
            sizeLimit?: string;
            fileTypes?: string[];
        };
        options?: {
            createBackup: boolean;
            skipDuplicates: boolean;
            organizeByType: boolean;
            organizeByCamera: boolean;
            customRenamePattern?: string;
        };
    }) => Promise<{ success: boolean; results?: { total: number; succeeded: number; skipped: number; errors: number }; error?: string }>;

    // Format conversion operations
    convertFile: (sourcePath: string, options: {
        targetFormat: string;
        quality: 'low' | 'medium' | 'high' | 'lossless';
        deleteOriginal?: boolean;
        resizeWidth?: number;
        resizeHeight?: number;
        maintainAspectRatio?: boolean;
    }) => Promise<{ success: boolean; targetPath?: string; error?: string }>;

    convertFiles: (filePaths: string[], options: {
        targetFormat: string;
        quality: 'low' | 'medium' | 'high' | 'lossless';
        deleteOriginal?: boolean;
        resizeWidth?: number;
        resizeHeight?: number;
        maintainAspectRatio?: boolean;
    }) => Promise<BatchFormatConversionResult>;

    getAvailableFormats: () => Promise<{ success: boolean; formats?: AvailableFormats; error?: string }>;

    // AI Categorization operations
    // AI Categorization operations
    configureAi: (options: Partial<{
        useLocalModel: boolean;
        apiKey: string;
        confidenceThreshold: number;
        maxTags: number;
        includeDominantColors: boolean;
        includeObjectDetection: boolean;
    }>) => Promise<{ success: boolean; error?: string }>;

    categorizeImage: (imagePath: string) => Promise<{
        success: boolean;
        result?: CategorizationResult;
        error?: string
    }>;

    categorizeImages: (imagePaths: string[]) => Promise<{
        success: boolean;
        results?: CategorizationResult[];
        error?: string
    }>;

    getCategories: () => Promise<{
        success: boolean;
        categories?: string[];
        error?: string
    }>;

    addCustomCategories: (categories: string[]) => Promise<{
        success: boolean;
        error?: string
    }>;

    removeCustomCategories: (categories: string[]) => Promise<{
        success: boolean;
        error?: string
    }>;

    // Face Recognition operations
    configureFaceRecognition: (options: Partial<{
        minFaceSize: number;
        maxFaceSize: number;
        confidenceThreshold: number;
        recognitionThreshold: number;
        enableLandmarks: boolean;
        enableAttributes: boolean;
        maxFacesPerImage: number;
        useLocalModel: boolean;
        apiKey: string;
    }>) => Promise<{ success: boolean; error?: string }>;

    detectFaces: (imagePath: string) => Promise<{
        success: boolean;
        result?: FaceRecognitionResult;
        error?: string
    }>;

    processFaceBatch: (imagePaths: string[]) => Promise<{
        success: boolean;
        results?: FaceRecognitionResult[];
        error?: string
    }>;

    getAllPeople: () => Promise<{
        success: boolean;
        people?: Person[];
        error?: string
    }>;

    getPersonById: (personId: string) => Promise<{
        success: boolean;
        person?: Person;
        error?: string
    }>;

    createOrUpdatePerson: (person: Partial<Person> & { name: string }) => Promise<{
        success: boolean;
        person?: Person;
        error?: string
    }>;

    deletePerson: (personId: string) => Promise<{
        success: boolean;
        error?: string
    }>;

    addFaceToPerson: (personId: string, faceImage: string, faceRect: {
        x: number;
        y: number;
        width: number;
        height: number
    }) => Promise<{
        success: boolean;
        person?: Person;
        error?: string
    }>;

    removeFaceFromPerson: (personId: string, faceId: string) => Promise<{
        success: boolean;
        person?: Person;
        error?: string
    }>;

    // Configuration
    saveConfig: (profileName: string, config: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
    loadConfig: (profileName: string) => Promise<{ success: boolean; config?: Record<string, any>; error?: string }>;
    listConfigs: () => Promise<{ success: boolean; profiles?: string[]; error?: string }>;

    // Event listeners
    on: (channel: string, callback: (...args: any[]) => void) => () => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}