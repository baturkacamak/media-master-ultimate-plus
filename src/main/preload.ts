import { contextBridge, ipcRenderer } from 'electron';

// Define the API exposed to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // App info
    getAppVersion: () => ipcRenderer.invoke('app:getVersion'),

    // File system operations
    selectDirectory: (options?: { title?: string; defaultPath?: string }) =>
        ipcRenderer.invoke('dialog:selectDirectory', options),
    selectFile: (options?: { title?: string; defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) =>
        ipcRenderer.invoke('dialog:selectFile', options),

    // File operations
    scanDirectory: (dirPath: string, options: { recursive: boolean; fileTypes?: string[] }) =>
        ipcRenderer.invoke('files:scanDirectory', dirPath, options),
    getFileMetadata: (filePath: string) =>
        ipcRenderer.invoke('files:getMetadata', filePath),
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
    }) => ipcRenderer.invoke('files:organize', options),

    // Configuration
    saveConfig: (profileName: string, config: Record<string, any>) =>
        ipcRenderer.invoke('config:save', profileName, config),
    loadConfig: (profileName: string) =>
        ipcRenderer.invoke('config:load', profileName),
    listConfigs: () =>
        ipcRenderer.invoke('config:list'),

    // Event listeners
    on: (channel: string, callback: (...args: any[]) => void) => {
        const validChannels = [
            'files:progress',
            'files:complete',
            'files:error',
            'config:changed',
        ];

        if (validChannels.includes(channel)) {
            const subscription = (_event: any, ...args: any[]) => callback(...args);
            ipcRenderer.on(channel, subscription);

            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        }

        return () => {}; // Empty cleanup function for invalid channels
    },
});

// Initialize any preload-specific operations
window.addEventListener('DOMContentLoaded', () => {
    console.log('Preload script loaded successfully');
});