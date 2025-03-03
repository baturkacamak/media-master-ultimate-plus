import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import log from 'electron-log';

export class ConfigManager {
    private configDir: string;

    constructor() {
        this.configDir = path.join(app.getPath('userData'), 'configs');
    }

    /**
     * Initialize the config directory
     */
    async initialize(): Promise<void> {
        try {
            await fs.mkdir(this.configDir, { recursive: true });
        } catch (error) {
            log.error('Error initializing config directory:', error);
            throw error;
        }
    }

    /**
     * Save a configuration profile
     */
    async saveConfig(profileName: string, config: any): Promise<void> {
        try {
            // Create config directory if it doesn't exist
            await this.initialize();

            // Create a timestamped config object
            const configToSave = {
                ...config,
                _metadata: {
                    profileName,
                    savedAt: new Date().toISOString(),
                    version: app.getVersion(),
                },
            };

            // Write to file
            const filePath = this.getConfigPath(profileName);
            await fs.writeFile(filePath, JSON.stringify(configToSave, null, 2), 'utf8');

            log.info(`Configuration saved as profile '${profileName}'`);
        } catch (error) {
            log.error('Error saving configuration:', error);
            throw error;
        }
    }

    /**
     * Load a configuration profile
     */
    async loadConfig(profileName: string): Promise<any> {
        try {
            const filePath = this.getConfigPath(profileName);

            // Check if file exists
            try {
                await fs.access(filePath);
            } catch (error) {
                log.warn(`Configuration profile '${profileName}' not found`);
                throw new Error(`Configuration profile '${profileName}' not found`);
            }

            // Read and parse file
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            log.error('Error loading configuration:', error);
            throw error;
        }
    }

    /**
     * List all available configuration profiles
     */
    async listConfigs(): Promise<string[]> {
        try {
            // Create config directory if it doesn't exist
            await this.initialize();

            // Get all .json files in the config directory
            const files = await fs.readdir(this.configDir);
            return files
                .filter((file) => file.endsWith('.json'))
                .map((file) => path.basename(file, '.json'));
        } catch (error) {
            log.error('Error listing configurations:', error);
            throw error;
        }
    }

    /**
     * Delete a configuration profile
     */
    async deleteConfig(profileName: string): Promise<void> {
        try {
            const filePath = this.getConfigPath(profileName);

            // Check if file exists
            try {
                await fs.access(filePath);
            } catch (error) {
                log.warn(`Configuration profile '${profileName}' not found for deletion`);
                return;
            }

            // Delete file
            await fs.unlink(filePath);
            log.info(`Configuration profile '${profileName}' deleted`);
        } catch (error) {
            log.error('Error deleting configuration:', error);
            throw error;
        }
    }

    /**
     * Get the full path for a configuration profile
     */
    private getConfigPath(profileName: string): string {
        // Sanitize profile name to be a valid filename
        const sanitizedName = profileName.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
        return path.join(this.configDir, `${sanitizedName}.json`);
    }
}