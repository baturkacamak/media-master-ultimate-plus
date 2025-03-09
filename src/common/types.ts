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
 * EXIF field structure
 */
export interface ExifField {
    tag: string;         // EXIF tag name
    value: string;       // Current value
    description: string; // User-friendly description
    editable: boolean;   // Whether this field can be edited
    type: 'text' | 'date' | 'number' | 'gps' | 'select'; // Field data type
    options?: string[];  // For select type fields, available options
}

/**
 * EXIF edit operation
 */
export interface ExifEditOperation {
    filePath: string;    // Target file path
    tag: string;         // EXIF tag to modify
    value: string;       // New value
    operation: 'set' | 'remove'; // Operation type
}

/**
 * EXIF backup options
 */
export interface ExifBackupOptions {
    createBackup: boolean;
    backupDir?: string;
}

/**
 * EXIF edit batch result
 */
export interface ExifEditResult {
    success: boolean;
    editedFiles: string[];
    failedFiles: Record<string, string>; // filepath -> error message
    error?: string;
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
 * Cloud provider types
 */
export type CloudProvider = 'google-drive' | 'dropbox' | 'onedrive';

/**
 * Cloud storage configuration
 */
export interface CloudStorageConfig {
    name: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
    enabled: boolean;
    tokenData: any | null;
}

/**
 * Cloud file structure
 */
export interface CloudFile {
    id: string;
    name: string;
    isFolder: boolean;
    size: number;
    createdAt: Date;
    modifiedAt: Date;
    viewUrl: string;
    provider: CloudProvider;
}

/**
 * Upload options
 */
export interface UploadOptions {
    folderId?: string;
    fileName?: string;
    mimeType?: string;
    preserveDirectoryStructure?: boolean;
    basePath?: string;
}

/**
 * Cloud storage provider info with connected status
 */
export interface CloudProviderInfo {
    id: CloudProvider;
    name: string;
    isConnected: boolean;
    icon: string;
}

/**
 * Cloud upload progress
 */
export interface CloudUploadProgress {
    file: string;
    processed: number;
    total: number;
    percentage: number;
}

/**
 * Cloud upload completion
 */
export interface CloudUploadCompletion {
    total: number;
    processed: number;
    failed: number;
}

/**
 * Electron API interface
 */
export interface ElectronAPI {
    // App info
    getAppVersion: () => Promise<string>;

    // Cloud Storage
    initializeCloudStorage: () => Promise<{ success: boolean; error?: string }>;
    configureCloudProvider: (provider: CloudProvider, config: Partial<CloudStorageConfig>) => Promise<{ success: boolean; error?: string }>;
    getProviderConfig: (provider: CloudProvider) => Promise<{ success: boolean; config?: CloudStorageConfig; error?: string }>;
    getAllProviderConfigs: () => Promise<{ success: boolean; configs?: Record<CloudProvider, CloudStorageConfig>; error?: string }>;
    setActiveProvider: (provider: CloudProvider) => Promise<{ success: boolean; error?: string }>;
    getActiveProvider: () => Promise<{ success: boolean; provider?: CloudProvider | null; error?: string }>;
    getAuthorizationUrl: (provider: CloudProvider) => Promise<{ success: boolean; url?: string; error?: string }>;
    exchangeCodeForToken: (provider: CloudProvider, code: string) => Promise<{ success: boolean; error?: string }>;
    listCloudFiles: (provider: CloudProvider, folderId?: string) => Promise<{ success: boolean; files?: CloudFile[]; error?: string }>;
    uploadToCloud: (provider: CloudProvider, filePath: string, options: UploadOptions) => Promise<{ success: boolean; file?: CloudFile; error?: string }>;
    uploadFilesToCloud: (provider: CloudProvider, filePaths: string[], options: UploadOptions) => Promise<{ success: boolean; results?: CloudFile[]; processed?: number; failed?: number; error?: string }>;
    createCloudFolder: (provider: CloudProvider, folderName: string, parentFolderId?: string) => Promise<{ success: boolean; folder?: CloudFile; error?: string }>;
    downloadFromCloud: (provider: CloudProvider, fileId: string, destinationPath: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    disconnectCloudProvider: (provider: CloudProvider) => Promise<{ success: boolean; error?: string }>;

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

    // Social Sharing operations
    configureSocialSharing: (settings: SocialSharingSettings) =>
      Promise<{ success: boolean; error?: string }>;

    shareToSocial: (
      platformId: string,
      content: SocialPostContent
    ) => Promise<SocialSharingResult>;

    shareToMultiplePlatforms: (
      platformIds: string[],
      content: SocialPostContent
    ) => Promise<SocialSharingBatchResult>;

    getAvailablePlatforms: () =>
      Promise<{ success: boolean; platforms?: SocialPlatformConfig[]; error?: string }>;

    authenticatePlatform: (
      platformId: string,
      authCode?: string
    ) => Promise<{ success: boolean; platform?: SocialPlatformConfig; error?: string }>;

    disconnectPlatform: (
      platformId: string
    ) => Promise<{ success: boolean; error?: string }>;

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