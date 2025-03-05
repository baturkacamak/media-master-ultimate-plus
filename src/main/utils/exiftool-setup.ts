import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import log from 'electron-log';

const execPromise = promisify(exec);
const execFilePromise = promisify(execFile);

export class ExifToolManager {
  private static instance: ExifToolManager;
  private exiftoolPath: string | null = null;
  private isReady: boolean = false;

  private constructor() { }

  /**
   * Singleton instance
   */
  public static getInstance(): ExifToolManager {
    if (!ExifToolManager.instance) {
      ExifToolManager.instance = new ExifToolManager();
    }
    return ExifToolManager.instance;
  }

  /**
   * Get ExifTool path
   */
  public getPath(): string | null {
    return this.exiftoolPath;
  }

  /**
   * Check if ExifTool is ready
   */
  public isExifToolReady(): boolean {
    return this.isReady;
  }

  /**
   * Initialize ExifTool
   */
  public async initialize(): Promise<boolean> {
    try {
      // First check if ExifTool is already installed in the system
      if (await this.checkSystemExifTool()) {
        return true;
      }

      // If not found in system, use bundled version
      await this.setupBundledExifTool();
      return this.isReady;
    } catch (error) {
      log.error('Error initializing ExifTool:', error);
      return false;
    }
  }

  /**
   * Check if ExifTool is already installed in the system
   */
  private async checkSystemExifTool(): Promise<boolean> {
    try {
      // Try to run ExifTool from system path
      const command = process.platform === 'win32' ? 'where exiftool' : 'which exiftool';
      const { stdout } = await execPromise(command);

      if (stdout.trim()) {
        this.exiftoolPath = stdout.trim();
        this.isReady = true;
        log.info(`Found system ExifTool at: ${this.exiftoolPath}`);
        return true;
      }

      return false;
    } catch (error) {
      log.info('ExifTool not found in system path');
      return false;
    }
  }

  /**
   * Setup bundled ExifTool
   */
  private async setupBundledExifTool(): Promise<void> {
    try {
      const platform = process.platform;
      const resourcesPath = app.isPackaged
        ? path.join(process.resourcesPath, 'exiftool')
        : path.join(app.getAppPath(), 'resources', 'exiftool');

      let exiftoolBinary: string;

      if (platform === 'win32') {
        exiftoolBinary = path.join(resourcesPath, 'win', 'exiftool.exe');
      } else if (platform === 'darwin') {
        exiftoolBinary = path.join(resourcesPath, 'mac', 'exiftool');
        // Make sure it's executable
        await fs.chmod(exiftoolBinary, 0o755);
      } else if (platform === 'linux') {
        exiftoolBinary = path.join(resourcesPath, 'linux', 'exiftool');
        // Make sure it's executable
        await fs.chmod(exiftoolBinary, 0o755);
      } else {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      // Check if the binary exists
      await fs.access(exiftoolBinary);

      // Test if it works
      await execFilePromise(exiftoolBinary, ['-ver']);

      this.exiftoolPath = exiftoolBinary;
      this.isReady = true;
      log.info(`Using bundled ExifTool at: ${this.exiftoolPath}`);
    } catch (error) {
      log.error('Failed to setup bundled ExifTool:', error);
      this.isReady = false;
    }
  }

  /**
   * Execute ExifTool command
   */
  public async execute(args: string[]): Promise<string> {
    if (!this.isReady || !this.exiftoolPath) {
      throw new Error('ExifTool is not ready');
    }

    try {
      const { stdout } = await execFilePromise(this.exiftoolPath, args);
      return stdout;
    } catch (error) {
      log.error('Error executing ExifTool command:', error);
      throw error;
    }
  }
}

// Singleton instance
export const exifToolManager = ExifToolManager.getInstance();