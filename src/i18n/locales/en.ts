export default {
    // Navigation
    "nav": {
        "home": "Home",
        "organize": "Organize",
        "convert": "Convert",
        "categorize": "Categorize",
        "faceRecognition": "Face Recognition",
        "exifEdit": "EXIF Edit",
        "settings": "Settings",
        "about": "About"
    },

    // Home Screen
    "home": {
        "welcome": "Welcome to MEDIA MASTER - Ultimate Media Organizer Plus",
        "subtitle": "Intelligent media organization at your fingertips",
        "quickStart": "Quick Start",
        "quickStartDesc": "Organize your media files with just a few clicks",
        "settings": "Settings",
        "settingsDesc": "Configure application preferences and advanced features",
        "features": "Features",
        "featureOrganize": "Organize Media",
        "featureOrganizeDesc": "Organize photos and videos into structured folders",
        "featureDatePattern": "Custom Patterns",
        "featureDatePatternDesc": "Use date and metadata to create custom folder structures",
        "featureMetadata": "Metadata Analysis",
        "featureMetadataDesc": "Extract and use EXIF data for organization",
        "featureDuplicates": "Duplicate Detection",
        "featureDuplicatesDesc": "Avoid duplicates by detecting similar files",
        "featureAI": "AI Categorization",
        "featureAIDesc": "Use AI to categorize images by content",
        "featureCustomize": "Customization",
        "featureCustomizeDesc": "Tailor the app to your specific needs",
        "recentActivity": "Recent Activity",
        "noRecentActivity": "No recent activity to display",
        "selectSourceDirectory": "Select Source Directory",
        "selectDestinationDirectory": "Select Destination Directory"
    },

    // Organize Screen
    "organize": {
        "title": "Organize Media Files",
        "source": "Source Directory",
        "destination": "Destination Directory",
        "browse": "Browse",
        "operation": "Operation",
        "move": "Move Files",
        "copy": "Copy Files",
        "pattern": "Organization Pattern",
        "patternTooltip": "Use patterns like %Y/%m/%d for year/month/day folders",
        "conflicts": "Conflict Resolution",
        "rename": "Rename",
        "skip": "Skip",
        "overwrite": "Overwrite",
        "options": "Options",
        "recursive": "Include Subdirectories",
        "backup": "Create Backup",
        "skipDuplicates": "Skip Duplicates",
        "byType": "Organize by File Type",
        "byCamera": "Organize by Camera Model",
        "advancedOptions": "Advanced Options",
        "startOrganizing": "Start Organizing",
        "cancel": "Cancel",
        "processing": "Processing Files",
        "completed": "Organization Completed",
        "processingFile": "Processing file",
        "filesProcessed": "Files Processed",
        "filesSucceeded": "Files Succeeded",
        "filesSkipped": "Files Skipped",
        "filesError": "Errors",
        "patterns": {
            "yearMonthDay": "Year/Month/Day",
            "yearMonth": "Year/Month",
            "year": "Year Only",
            "yearMonthDayHour": "Year/Month/Day/Hour",
            "eventBased": "Event Based",
            "custom": "Custom Pattern"
        },
        "patternExplanation": "Pattern Guide:",
        "patternExplanationItems": [
            "%Y - Year (e.g., 2023)",
            "%m - Month (e.g., 01-12)",
            "%d - Day (e.g., 01-31)",
            "%H - Hour (e.g., 00-23)",
            "%M - Minute (e.g., 00-59)",
            "%c - Camera model",
            "%t - File type (e.g., Photos, Videos)",
            "%e - Event (based on time gaps)"
        ],
        "previewPattern": "Preview: {pattern}",
        "noSourceSelected": "Please select a source directory",
        "noDestinationSelected": "Please select a destination directory"
    },

    // Settings Screen
    "settings": {
        "title": "Settings",
        "profiles": "Configuration Profiles",
        "currentProfile": "Current Profile",
        "saveProfile": "Save Profile",
        "loadProfile": "Load Profile",
        "newProfileName": "New Profile Name",
        "deleteProfile": "Delete Profile",
        "general": "General Settings",
        "language": "Language",
        "darkMode": "Dark Mode",
        "advanced": "Advanced Features",
        "geoTagging": "Enable Geo Tagging",
        "aiCategorization": "AI Categorization",
        "enableAiCategorization": "Enable AI Categorization",
        "aiModelType": "AI Model Type",
        "useLocalModel": "Use Local Model",
        "useCloudApi": "Use Cloud API",
        "aiApiKey": "AI API Key",
        "aiApiKeyPlaceholder": "Enter your API key here",
        "aiApiKeyHelp": "API key is required for cloud-based image analysis",
        "confidenceThreshold": "Confidence Threshold",
        "confidenceThresholdHelp": "Only show tags with confidence above this threshold",
        "maxTags": "Maximum Tags",
        "aiAdditionalOptions": "Additional Options",
        "includeDominantColors": "Include Dominant Colors",
        "includeObjectDetection": "Include Object Detection",
        "customCategories": "Custom Categories",
        "newCategoryPlaceholder": "Enter new category name",
        "yourCustomCategories": "Your Custom Categories",
        "availableCategories": "Available Categories",
        "cloudUpload": "Enable Cloud Upload",
        "cloudService": "Cloud Service",
        "scheduling": "Enable Scheduling",
        "scheduleTime": "Schedule Time",
        "exifEdit": "Enable EXIF Editing",
        "exifCommands": "EXIF Edit Commands",
        "formatConversion": "Format Conversion",
        "enableFormatConversion": "Enable Format Conversion",
        "convertFrom": "Convert From Format",
        "convertTo": "Convert To Format",
        "quality": "Conversion Quality",
        "deleteOriginal": "Delete Original Files",
        "resizeOptions": "Resize Options",
        "maintainAspectRatio": "Maintain Aspect Ratio",
        "faceRecognition": "Enable Face Recognition",
        "videoProcessing": "Enable Video Processing",
        "webInterface": "Enable Web Interface",
        "webPort": "Web Interface Port",
        "socialSharing": "Enable Social Sharing",
        "socialPlatforms": "Social Platforms",
        "plugins": "Enable Plugins",
        "visualization": "Enable Visualization",
        "visualizationType": "Visualization Type",
        "exifEditSettings": {
            "title": "EXIF Metadata Editing",
            "enable": "Enable EXIF Metadata Editing",
            "backup": "Backup Settings",
            "createBackup": "Create backup of original files before editing",
            "backupDir": "Backup Directory Path",
            "browse": "Browse",
            "commonCommands": "Common EXIF Commands",
            "commonCommandsHelp": "These are examples of common EXIF commands you can use to edit metadata:",
            "customCommands": "Custom EXIF Edit Commands",
            "customCommandsHelp": "Add custom ExifTool commands to be used when editing files. Each command on a new line."
        },
        "encryption": "Enable Encryption",
        "password": "Encryption Password",
        "parallelJobs": "Parallel Processing Jobs",
        "saveChanges": "Save Changes",
        "resetSettings": "Reset to Default",
        "settingsSaved": "Settings saved successfully",
        "settingsError": "Error saving settings",
        "languages": {
            "en": "English",
            "tr": "Turkish"
        }
    },

    // AI Categorization Screen
    "categorization": {
        "title": "AI Image Categorization",
        "selectFiles": "Select Files",
        "selectImages": "Select Images",
        "selectedFiles": "Selected Files",
        "options": "Categorization Options",
        "confidenceThreshold": "Confidence Threshold",
        "startCategorization": "Start Categorization",
        "processing": "Processing...",
        "results": "Categorization Results",
        "export": "Export Results",
        "search": "Search",
        "searchPlaceholder": "Search by tag or category",
        "filterByCategory": "Filter by Category",
        "allCategories": "All Categories",
        "primaryCategory": "Primary Category",
        "tags": "Tags",
        "dominantColors": "Dominant Colors",
        "objects": "Detected Objects",
        "noTagsAboveThreshold": "No tags above threshold",
        "noResultsFound": "No results match your filters",
        "boundingBox": "Bounding Box"
    },

    // Add new face recognition translations
    "faceRecognition": {
        "title": "Face Recognition",
        "selectImages": "Select Images",
        "startRecognition": "Start Recognition",
        "processing": "Processing Images",
        "recognitionResults": "Recognition Results",
        "noFacesDetected": "No faces detected in this image",
        "assignToPerson": "Assign to Person",
        "createNewPerson": "Create New Person",
        "peopleMgmt": "People Management",
        "searchPeople": "Search people...",
        "createPerson": "Create Person",
        "editPerson": "Edit Person",
        "deletePerson": "Delete Person",
        "faceSamples": "Face Samples",
        "noFaceSamples": "No face samples added yet",
        "removeFace": "Remove Face",
        "exportResults": "Export Results",
        "addFaceHint": "To add face samples, use the Face Recognition tab to detect faces and assign them to this person.",
        "selectPerson": "Select a person to view details",
        "confirmDelete": "Are you sure you want to delete this person?",
        "faceDetails": "Face Details",
        "confidence": "Confidence",
        "recognizedAs": "Recognized as",
        "matchConfidence": "Match confidence",
        "position": "Position",
        "attributes": {
            "age": "Age",
            "gender": "Gender",
            "emotion": "Emotion",
            "glasses": "Glasses",
            "smile": "Smile"
        },
        "settings": {
            "title": "Face Recognition Settings",
            "enable": "Enable Face Recognition",
            "modelType": "Model Type",
            "useLocalModel": "Use Local Model",
            "useCloudApi": "Use Cloud API",
            "apiKey": "API Key",
            "apiKeyPlaceholder": "Enter your API key here",
            "apiKeyHelp": "API key is required for cloud-based face recognition",
            "detectionSettings": "Face Detection Settings",
            "minFaceSize": "Minimum Face Size (pixels)",
            "maxFaceSize": "Maximum Face Size (pixels, 0 = no limit)",
            "confidenceThreshold": "Detection Confidence Threshold",
            "recognitionThreshold": "Recognition Confidence Threshold",
            "maxFacesPerImage": "Maximum Faces Per Image",
            "enableLandmarks": "Detect Facial Landmarks (eyes, nose, mouth)",
            "enableAttributes": "Detect Face Attributes (age, gender, emotions)"
        }
    },

    "exifEditor": {
        "title": "EXIF Metadata Editor",
        "selectFiles": "Select Files",
        "editMetadata": "Edit EXIF Metadata",
        "fieldGroups": {
            "datetime": "Date/Time",
            "camera": "Camera",
            "exposure": "Exposure",
            "gps": "GPS",
            "copyright": "Copyright",
            "description": "Description",
            "other": "Other"
        },
        "noMetadata": "No EXIF metadata found in this file or unsupported file format.",
        "edited": "Edited",
        "notSet": "Not set",
        "template": "Template",
        "templates": "EXIF Templates",
        "saveTemplate": "Save Template",
        "loadTemplate": "Load Template",
        "deleteTemplate": "Delete Template",
        "templateName": "Template Name",
        "noChanges": "No changes to save as template",
        "export": "Export",
        "import": "Import",
        "backupOptions": "Backup Options",
        "createBackup": "Create backup before editing",
        "backupDir": "Backup Directory",
        "applyAll": "Apply to All Files",
        "clearEdits": "Clear Edits",
        "saveChanges": "Save Changes",
        "confirmClear": "Are you sure you want to clear all edits?",
        "confirmSwitch": "You have unsaved changes. Are you sure you want to switch files?",
        "processing": "Processing...",
        "results": {
            "changesApplied": "Changes Applied",
            "issuesOccurred": "Completed with Issues",
            "totalFiles": "Total Files",
            "succeeded": "Succeeded",
            "failed": "Failed",
            "failedFiles": "Failed Files"
        },
        "showAllFields": "Show all fields"
    },

    // About Screen
    "about": {
        "title": "About Media Master",
        "version": "Version",
        "description": "Media Master is an advanced media organization tool designed to help you manage your photos and videos intelligently.",
        "features": "Key Features",
        "featureList": [
            "Organize media files by date, type, or camera",
            "Extract and use EXIF metadata",
            "Detect and handle duplicates",
            "AI-powered content categorization",
            "Cloud storage integration",
            "Face recognition and grouping",
            "Video processing and scene detection",
            "Visualization and reporting",
            "Platform-independent operation"
        ],
        "developer": "Developed by",
        "license": "License",
        "licenseType": "MIT License",
        "thirdParty": "Third-Party Libraries",
        "libraries": [
            "Electron - Cross-platform desktop apps",
            "React - User interface framework",
            "TypeScript - Static typing",
            "Redux - State management",
            "ExifReader - EXIF metadata extraction",
            "SQLite - Database storage",
            "i18next - Internationalization"
        ],
        "contactSupport": "Contact Support",
        "reportIssue": "Report an Issue",
        "checkUpdates": "Check for Updates"
    },

    // Common
    "common": {
        "loading": "Loading...",
        "error": "Error",
        "success": "Success",
        "warning": "Warning",
        "info": "Information",
        "yes": "Yes",
        "no": "No",
        "ok": "OK",
        "cancel": "Cancel",
        "save": "Save",
        "delete": "Delete",
        "edit": "Edit",
        "create": "Create",
        "update": "Update",
        "close": "Close",
        "back": "Back",
        "next": "Next",
        "browse": "Browse",
        "select": "Select",
        "search": "Search",
        "filter": "Filter",
        "sort": "Sort",
        "refresh": "Refresh",
        "enabled": "Enabled",
        "disabled": "Disabled",
        "confirmation": "Confirmation",
        "areYouSure": "Are you sure?",
        "noData": "No data available",
        "processing": "Processing...",
        "reset": "Reset"
    }
};