import { ipcMain } from 'electron';
import log from 'electron-log';
import {
  SocialPlatformConfig,
  SocialPostContent,
  SocialSharingSettings
} from '../common/types';
import { socialSharingService } from './services/social-sharing';

/**
 * Register IPC handlers for social media sharing functionality
 */
export function registerSocialSharingHandlers(): void {
  /**
   * Get all available social platforms
   */
  ipcMain.handle('social:getAvailablePlatforms', async () => {
    try {
      const platforms = socialSharingService.getAllPlatforms();
      return {
        success: true,
        platforms
      };
    } catch (error) {
      log.error('Error getting available social platforms:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Authenticate with a social platform
   */
  ipcMain.handle('social:authenticatePlatform', async (_event, platformId: string, authCode?: string) => {
    try {
      const platform = await socialSharingService.authenticatePlatform(platformId, authCode);
      return {
        success: true,
        platform
      };
    } catch (error) {
      log.error(`Error authenticating with ${platformId}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Disconnect from a social platform
   */
  ipcMain.handle('social:disconnectPlatform', async (_event, platformId: string) => {
    try {
      const success = await socialSharingService.disconnectPlatform(platformId);
      return { success };
    } catch (error) {
      log.error(`Error disconnecting from ${platformId}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Update social sharing settings
   */
  ipcMain.handle('social:configureSocialSharing', async (_event, settings: SocialSharingSettings) => {
    try {
      // Update each platform in the settings
      for (const platform of settings.platforms) {
        await socialSharingService.updatePlatform(platform);
      }

      return { success: true };
    } catch (error) {
      log.error('Error configuring social sharing:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Share content to a social platform
   */
  ipcMain.handle('social:shareToSocial', async (_event, platformId: string, content: SocialPostContent) => {
    try {
      const result = await socialSharingService.shareToSocial(platformId, content);
      return result;
    } catch (error) {
      log.error(`Error sharing to ${platformId}:`, error);
      return {
        success: false,
        platformId,
        timestamp: Date.now(),
        error: (error as Error).message
      };
    }
  });

  /**
   * Share content to multiple social platforms
   */
  ipcMain.handle('social:shareToMultiplePlatforms', async (_event, platformIds: string[], content: SocialPostContent) => {
    try {
      const results = await socialSharingService.shareToMultiplePlatforms(platformIds, content);
      return {
        overallSuccess: results.every(r => r.success),
        results
      };
    } catch (error) {
      log.error('Error sharing to multiple platforms:', error);
      return {
        overallSuccess: false,
        results: [],
        error: (error as Error).message
      };
    }
  });
}

/**
 * Clean up social sharing resources
 */
export function cleanupSocialSharing(): void {
  socialSharingService.cleanup().catch(error => {
    log.error('Error cleaning up social sharing service:', error);
  });
}