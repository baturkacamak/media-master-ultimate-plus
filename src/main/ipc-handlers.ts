import { ipcMain, dialog, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import log from 'electron-log';
import { ConfigManager } from './services/config-manager';

const configManager = new ConfigManager();

export function setupIpcHandlers() {
    // App info
    ipcMain.handle('app:getVersion', () => {
        return app.getVersion();
    });

    // Dialog handlers
    ipcMain.handle('dialog:selectDirectory', async (_event, options) => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: options?.title || 'Select a directory',
            defaultPath: options?.defaultPath || app.getPath('home'),
        });

        if (canceled || filePaths.length === 0) {
            return null;
        }

        return filePaths[0];
    });

    ipcMain.handle('dialog:selectFile', async (_event, options) => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openFile'],
            title: options?.title || 'Select a file',
            defaultPath: options?.defaultPath || app.getPath('home'),
            filters: options?.filters || [
                { name: 'All Files', extensions: ['*'] },
                { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'] },
                { name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] },
            ],
        });

        if (canceled || filePaths.length === 0) {
            return null;
        }

        return filePaths[0];
    });

    // Configuration handlers
    ipcMain.handle('config:save', async (_event, profileName, config) => {
        try {
            await configManager.saveConfig(profileName, config);
            return { success: true };
        } catch (error) {
            log.error('Failed to save configuration:', error);
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('config:load', async (_event, profileName) => {
        try {
            const config = await configManager.loadConfig(profileName);
            return { success: true, config };
        } catch (error) {
            log.error('Failed to load configuration:', error);
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('config:list', async () => {
        try {
            const profiles = await configManager.listConfigs();
            return { success: true, profiles };
        } catch (error) {
            log.error('Failed to list configurations:', error);
            return { success: false, error: (error as Error).message };
        }
    });
}