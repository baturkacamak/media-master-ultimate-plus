import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import log from 'electron-log';
import { CloudProvider, CloudStorageConfig, CloudFile, UploadOptions } from '@common/types';

/**
 * Cloud Storage Service for handling cloud storage operations
 * Supports multiple providers: Google Drive, Dropbox, OneDrive
 */
export class CloudStorageService {
  private tokenPath: string;
  private configs: Record<CloudProvider, CloudStorageConfig>;
  private activeProvider: CloudProvider | null = null;
  private clients: Partial<Record<CloudProvider, any>> = {};

  constructor() {
    this.tokenPath = path.join(app.getPath('userData'), 'cloud-tokens');
    this.configs = {
      'google-drive': {
        name: 'Google Drive',
        clientId: '',
        clientSecret: '',
        redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
        scopes: ['https://www.googleapis.com/auth/drive.file'],
        enabled: false,
        tokenData: null
      },
      'dropbox': {
        name: 'Dropbox',
        clientId: '',
        clientSecret: '',
        redirectUri: 'http://localhost',
        scopes: ['files.content.write', 'files.content.read'],
        enabled: false,
        tokenData: null
      },
      'onedrive': {
        name: 'OneDrive',
        clientId: '',
        clientSecret: '',
        redirectUri: 'http://localhost',
        scopes: ['files.readwrite'],
        enabled: false,
        tokenData: null
      }
    };
  }

  /**
   * Initialize the cloud storage service
   */
  public async initialize(): Promise<void> {
    try {
      // Create tokens directory if it doesn't exist
      await fs.mkdir(this.tokenPath, { recursive: true });

      // Load saved tokens for each provider
      for (const provider of Object.keys(this.configs) as CloudProvider[]) {
        try {
          const tokenPath = path.join(this.tokenPath, `${provider}.json`);
          await fs.access(tokenPath);
          const tokenData = JSON.parse(await fs.readFile(tokenPath, 'utf8'));
          this.configs[provider].tokenData = tokenData;
          this.configs[provider].enabled = true;
        } catch (err) {
          // Token file doesn't exist or is invalid - that's okay
        }
      }

      log.info('Cloud storage service initialized');
    } catch (error) {
      log.error('Error initializing cloud storage service:', error);
      throw error;
    }
  }

  /**
   * Configure a cloud provider
   */
  public async configureProvider(provider: CloudProvider, config: Partial<CloudStorageConfig>): Promise<void> {
    try {
      this.configs[provider] = {
        ...this.configs[provider],
        ...config
      };

      // Save configuration if the token is present
      if (this.configs[provider].tokenData) {
        const tokenPath = path.join(this.tokenPath, `${provider}.json`);
        await fs.writeFile(tokenPath, JSON.stringify(this.configs[provider].tokenData), 'utf8');
      }

      log.info(`Configured cloud provider: ${provider}`);
    } catch (error) {
      log.error(`Error configuring cloud provider ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Get the current configuration for a provider
   */
  public getProviderConfig(provider: CloudProvider): CloudStorageConfig {
    return { ...this.configs[provider] };
  }

  /**
   * Get all provider configurations
   */
  public getAllProviderConfigs(): Record<CloudProvider, CloudStorageConfig> {
    // Return a deep copy to prevent external modification
    return JSON.parse(JSON.stringify(this.configs));
  }

  /**
   * Set the active cloud provider
   */
  public setActiveProvider(provider: CloudProvider): void {
    this.activeProvider = provider;
    log.info(`Active cloud provider set to ${provider}`);
  }

  /**
   * Get the active cloud provider
   */
  public getActiveProvider(): CloudProvider | null {
    return this.activeProvider;
  }

  /**
   * Generate authorization URL for a provider
   */
  public getAuthorizationUrl(provider: CloudProvider): string {
    try {
      const config = this.configs[provider];

      switch (provider) {
        case 'google-drive': {
          const client = new OAuth2Client(
            config.clientId,
            config.clientSecret,
            config.redirectUri
          );

          const authUrl = client.generateAuthUrl({
            access_type: 'offline',
            scope: config.scopes,
            prompt: 'consent'
          });

          this.clients['google-drive'] = client;
          return authUrl;
        }

        case 'dropbox': {
          const params = new URLSearchParams({
            client_id: config.clientId,
            response_type: 'code',
            redirect_uri: config.redirectUri,
            scope: config.scopes.join(' ')
          });

          return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
        }

        case 'onedrive': {
          const params = new URLSearchParams({
            client_id: config.clientId,
            response_type: 'code',
            redirect_uri: config.redirectUri,
            scope: config.scopes.join(' ')
          });

          return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
        }

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      log.error(`Error generating authorization URL for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for access token
   */
  public async exchangeCodeForToken(provider: CloudProvider, code: string): Promise<void> {
    try {
      const config = this.configs[provider];

      switch (provider) {
        case 'google-drive': {
          const client = this.clients['google-drive'] as OAuth2Client;
          if (!client) {
            throw new Error('Google Drive client not initialized');
          }

          const { tokens } = await client.getToken(code);
          client.setCredentials(tokens);
          this.configs[provider].tokenData = tokens;
          this.configs[provider].enabled = true;
          break;
        }

        case 'dropbox': {
          const params = new URLSearchParams({
            code,
            grant_type: 'authorization_code',
            client_id: config.clientId,
            client_secret: config.clientSecret,
            redirect_uri: config.redirectUri
          });

          const response = await axios.post(
            'https://api.dropboxapi.com/oauth2/token',
            params.toString(),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }
          );

          this.configs[provider].tokenData = response.data;
          this.configs[provider].enabled = true;
          break;
        }

        case 'onedrive': {
          const params = new URLSearchParams({
            code,
            grant_type: 'authorization_code',
            client_id: config.clientId,
            client_secret: config.clientSecret,
            redirect_uri: config.redirectUri
          });

          const response = await axios.post(
            'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            params.toString(),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }
          );

          this.configs[provider].tokenData = response.data;
          this.configs[provider].enabled = true;
          break;
        }

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      // Save token
      const tokenPath = path.join(this.tokenPath, `${provider}.json`);
      await fs.writeFile(tokenPath, JSON.stringify(this.configs[provider].tokenData), 'utf8');

      log.info(`Successfully authenticated with ${provider}`);
    } catch (error) {
      log.error(`Error exchanging authorization code for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Refresh token if needed
   */
  private async refreshTokenIfNeeded(provider: CloudProvider): Promise<void> {
    try {
      const config = this.configs[provider];

      if (!config.tokenData) {
        throw new Error(`No token data for ${provider}`);
      }

      switch (provider) {
        case 'google-drive': {
          const client = new OAuth2Client(
            config.clientId,
            config.clientSecret,
            config.redirectUri
          );

          client.setCredentials(config.tokenData);

          if (config.tokenData.expiry_date && config.tokenData.expiry_date < Date.now()) {
            const { credentials } = await client.refreshAccessToken();
            config.tokenData = credentials;
            this.clients['google-drive'] = client;

            // Save refreshed token
            const tokenPath = path.join(this.tokenPath, `${provider}.json`);
            await fs.writeFile(tokenPath, JSON.stringify(config.tokenData), 'utf8');
          } else {
            this.clients['google-drive'] = client;
          }
          break;
        }

        case 'dropbox': {
          if (config.tokenData.expires_at && config.tokenData.expires_at < Date.now() / 1000) {
            const params = new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: config.tokenData.refresh_token,
              client_id: config.clientId,
              client_secret: config.clientSecret
            });

            const response = await axios.post(
              'https://api.dropboxapi.com/oauth2/token',
              params.toString(),
              {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              }
            );

            config.tokenData = {
              ...response.data,
              refresh_token: config.tokenData.refresh_token
            };

            // Save refreshed token
            const tokenPath = path.join(this.tokenPath, `${provider}.json`);
            await fs.writeFile(tokenPath, JSON.stringify(config.tokenData), 'utf8');
          }
          break;
        }

        case 'onedrive': {
          if (config.tokenData.expires_at && config.tokenData.expires_at < Date.now() / 1000) {
            const params = new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: config.tokenData.refresh_token,
              client_id: config.clientId,
              client_secret: config.clientSecret,
              redirect_uri: config.redirectUri
            });

            const response = await axios.post(
              'https://login.microsoftonline.com/common/oauth2/v2.0/token',
              params.toString(),
              {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              }
            );

            config.tokenData = {
              ...response.data,
              refresh_token: config.tokenData.refresh_token
            };

            // Save refreshed token
            const tokenPath = path.join(this.tokenPath, `${provider}.json`);
            await fs.writeFile(tokenPath, JSON.stringify(config.tokenData), 'utf8');
          }
          break;
        }
      }
    } catch (error) {
      log.error(`Error refreshing token for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * List files in a cloud storage folder
   */
  public async listFiles(provider: CloudProvider, folderId?: string): Promise<CloudFile[]> {
    try {
      await this.refreshTokenIfNeeded(provider);
      const config = this.configs[provider];

      if (!config.tokenData) {
        throw new Error(`Not authenticated with ${provider}`);
      }

      switch (provider) {
        case 'google-drive': {
          const client = this.clients['google-drive'] as OAuth2Client;
          const drive = (await import('@googleapis/drive')).drive({ version: 'v3', auth: client });

          const query = folderId ?
            `'${folderId}' in parents and trashed = false` :
            `'root' in parents and trashed = false`;

          const response = await drive.files.list({
            q: query,
            fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
            pageSize: 100
          });

          return (response.data.files || []).map(file => ({
            id: file.id || '',
            name: file.name || '',
            isFolder: file.mimeType === 'application/vnd.google-apps.folder',
            size: Number(file.size) || 0,
            createdAt: file.createdTime ? new Date(file.createdTime) : new Date(),
            modifiedAt: file.modifiedTime ? new Date(file.modifiedTime) : new Date(),
            viewUrl: file.webViewLink || '',
            provider: 'google-drive'
          }));
        }

        case 'dropbox': {
          const path = folderId || '';

          const response = await axios.post(
            'https://api.dropboxapi.com/2/files/list_folder',
            { path },
            {
              headers: {
                'Authorization': `Bearer ${config.tokenData.access_token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          return response.data.entries.map((entry: any) => ({
            id: entry.id,
            name: entry.name,
            isFolder: entry['.tag'] === 'folder',
            size: entry.size || 0,
            createdAt: new Date(entry.server_modified || Date.now()),
            modifiedAt: new Date(entry.client_modified || Date.now()),
            viewUrl: '',
            provider: 'dropbox'
          }));
        }

        case 'onedrive': {
          const endpoint = folderId ?
            `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children` :
            'https://graph.microsoft.com/v1.0/me/drive/root/children';

          const response = await axios.get(endpoint, {
            headers: {
              'Authorization': `Bearer ${config.tokenData.access_token}`
            }
          });

          return response.data.value.map((item: any) => ({
            id: item.id,
            name: item.name,
            isFolder: item.folder !== undefined,
            size: item.size || 0,
            createdAt: new Date(item.createdDateTime),
            modifiedAt: new Date(item.lastModifiedDateTime),
            viewUrl: item.webUrl || '',
            provider: 'onedrive'
          }));
        }

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      log.error(`Error listing files for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Upload a file to cloud storage
   */
  public async uploadFile(
    provider: CloudProvider,
    filePath: string,
    options: UploadOptions
  ): Promise<CloudFile> {
    try {
      await this.refreshTokenIfNeeded(provider);
      const config = this.configs[provider];

      if (!config.tokenData) {
        throw new Error(`Not authenticated with ${provider}`);
      }

      const fileContent = await fs.readFile(filePath);
      const fileName = options.fileName || path.basename(filePath);

      switch (provider) {
        case 'google-drive': {
          const client = this.clients['google-drive'] as OAuth2Client;
          const drive = (await import('@googleapis/drive')).drive({ version: 'v3', auth: client });

          const fileMetadata = {
            name: fileName,
            parents: options.folderId ? [options.folderId] : ['root']
          };

          const media = {
            mimeType: options.mimeType || 'application/octet-stream',
            body: fileContent
          };

          const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink'
          });

          const file = response.data;

          return {
            id: file.id || '',
            name: file.name || '',
            isFolder: file.mimeType === 'application/vnd.google-apps.folder',
            size: Number(file.size) || 0,
            createdAt: file.createdTime ? new Date(file.createdTime) : new Date(),
            modifiedAt: file.modifiedTime ? new Date(file.modifiedTime) : new Date(),
            viewUrl: file.webViewLink || '',
            provider: 'google-drive'
          };
        }

        case 'dropbox': {
          const path = options.folderId ?
            `${options.folderId}/${fileName}` :
            `/${fileName}`;

          const response = await axios.post(
            'https://content.dropboxapi.com/2/files/upload',
            fileContent,
            {
              headers: {
                'Authorization': `Bearer ${config.tokenData.access_token}`,
                'Dropbox-API-Arg': JSON.stringify({
                  path,
                  mode: 'add',
                  autorename: true,
                  mute: false
                }),
                'Content-Type': 'application/octet-stream'
              }
            }
          );

          return {
            id: response.data.id,
            name: response.data.name,
            isFolder: false,
            size: response.data.size,
            createdAt: new Date(response.data.server_modified || Date.now()),
            modifiedAt: new Date(response.data.client_modified || Date.now()),
            viewUrl: '',
            provider: 'dropbox'
          };
        }

        case 'onedrive': {
          let uploadUrl;

          if (options.folderId) {
            const response = await axios.post(
              `https://graph.microsoft.com/v1.0/me/drive/items/${options.folderId}:/${fileName}:/createUploadSession`,
              {},
              {
                headers: {
                  'Authorization': `Bearer ${config.tokenData.access_token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            uploadUrl = response.data.uploadUrl;
          } else {
            const response = await axios.post(
              `https://graph.microsoft.com/v1.0/me/drive/root:/${fileName}:/createUploadSession`,
              {},
              {
                headers: {
                  'Authorization': `Bearer ${config.tokenData.access_token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            uploadUrl = response.data.uploadUrl;
          }

          const response = await axios.put(
            uploadUrl,
            fileContent,
            {
              headers: {
                'Content-Length': fileContent.length
              }
            }
          );

          return {
            id: response.data.id,
            name: response.data.name,
            isFolder: false,
            size: response.data.size,
            createdAt: new Date(response.data.createdDateTime),
            modifiedAt: new Date(response.data.lastModifiedDateTime),
            viewUrl: response.data.webUrl,
            provider: 'onedrive'
          };
        }

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      log.error(`Error uploading file to ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Create a folder in cloud storage
   */
  public async createFolder(
    provider: CloudProvider,
    folderName: string,
    parentFolderId?: string
  ): Promise<CloudFile> {
    try {
      await this.refreshTokenIfNeeded(provider);
      const config = this.configs[provider];

      if (!config.tokenData) {
        throw new Error(`Not authenticated with ${provider}`);
      }

      switch (provider) {
        case 'google-drive': {
          const client = this.clients['google-drive'] as OAuth2Client;
          const drive = (await import('@googleapis/drive')).drive({ version: 'v3', auth: client });

          const fileMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentFolderId ? [parentFolderId] : ['root']
          };

          const response = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id, name, mimeType, createdTime, modifiedTime, webViewLink'
          });

          const folder = response.data;

          return {
            id: folder.id || '',
            name: folder.name || '',
            isFolder: true,
            size: 0,
            createdAt: folder.createdTime ? new Date(folder.createdTime) : new Date(),
            modifiedAt: folder.modifiedTime ? new Date(folder.modifiedTime) : new Date(),
            viewUrl: folder.webViewLink || '',
            provider: 'google-drive'
          };
        }

        case 'dropbox': {
          const path = parentFolderId ?
            `${parentFolderId}/${folderName}` :
            `/${folderName}`;

          const response = await axios.post(
            'https://api.dropboxapi.com/2/files/create_folder_v2',
            { path },
            {
              headers: {
                'Authorization': `Bearer ${config.tokenData.access_token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          const metadata = response.data.metadata;

          return {
            id: metadata.id,
            name: metadata.name,
            isFolder: true,
            size: 0,
            createdAt: new Date(),
            modifiedAt: new Date(),
            viewUrl: '',
            provider: 'dropbox'
          };
        }

        case 'onedrive': {
          let endpoint;

          if (parentFolderId) {
            endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${parentFolderId}/children`;
          } else {
            endpoint = 'https://graph.microsoft.com/v1.0/me/drive/root/children';
          }

          const response = await axios.post(
            endpoint,
            {
              name: folderName,
              folder: {},
              '@microsoft.graph.conflictBehavior': 'rename'
            },
            {
              headers: {
                'Authorization': `Bearer ${config.tokenData.access_token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          return {
            id: response.data.id,
            name: response.data.name,
            isFolder: true,
            size: 0,
            createdAt: new Date(response.data.createdDateTime),
            modifiedAt: new Date(response.data.lastModifiedDateTime),
            viewUrl: response.data.webUrl,
            provider: 'onedrive'
          };
        }

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      log.error(`Error creating folder in ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Download a file from cloud storage
   */
  public async downloadFile(
    provider: CloudProvider,
    fileId: string,
    destinationPath: string
  ): Promise<string> {
    try {
      await this.refreshTokenIfNeeded(provider);
      const config = this.configs[provider];

      if (!config.tokenData) {
        throw new Error(`Not authenticated with ${provider}`);
      }

      switch (provider) {
        case 'google-drive': {
          const client = this.clients['google-drive'] as OAuth2Client;
          const drive = (await import('@googleapis/drive')).drive({ version: 'v3', auth: client });

          const response = await drive.files.get({
            fileId,
            alt: 'media'
          }, { responseType: 'stream' });

          const writer = fs.createWriteStream(destinationPath);

          return new Promise((resolve, reject) => {
            response.data
              .on('end', () => resolve(destinationPath))
              .on('error', reject)
              .pipe(writer);
          });
        }

        case 'dropbox': {
          const response = await axios.post(
            'https://content.dropboxapi.com/2/files/download',
            null,
            {
              headers: {
                'Authorization': `Bearer ${config.tokenData.access_token}`,
                'Dropbox-API-Arg': JSON.stringify({ path: fileId })
              },
              responseType: 'arraybuffer'
            }
          );

          await fs.writeFile(destinationPath, Buffer.from(response.data));
          return destinationPath;
        }

        case 'onedrive': {
          const response = await axios.get(
            `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
            {
              headers: {
                'Authorization': `Bearer ${config.tokenData.access_token}`
              },
              responseType: 'arraybuffer'
            }
          );

          await fs.writeFile(destinationPath, Buffer.from(response.data));
          return destinationPath;
        }

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      log.error(`Error downloading file from ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from a cloud provider
   */
  public async disconnect(provider: CloudProvider): Promise<void> {
    try {
      // Remove token file
      const tokenPath = path.join(this.tokenPath, `${provider}.json`);
      try {
        await fs.unlink(tokenPath);
      } catch (err) {
        // File might not exist, that's okay
      }

      // Reset provider config
      this.configs[provider].tokenData = null;
      this.configs[provider].enabled = false;

      // Remove from clients
      delete this.clients[provider];

      // Reset active provider if it was this one
      if (this.activeProvider === provider) {
        this.activeProvider = null;
      }

      log.info(`Disconnected from ${provider}`);
    } catch (error) {
      log.error(`Error disconnecting from ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    // Nothing to clean up for now
  }
}

// Export a singleton instance
export const cloudStorageService = new CloudStorageService();