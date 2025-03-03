import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import log from 'electron-log';
import { setupIpcHandlers } from './ipc-handlers';
import { registerFileSystemHandlers } from './filesystem-handlers';
import { initializeDatabase } from './database';

// Configure logger
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Keep a global reference of the window object to avoid garbage collection
let mainWindow: BrowserWindow | null = null;

const createWindow = async () => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
    backgroundColor: '#f0f0f0',
    icon: path.join(__dirname, '../../resources/icon.png'),
  });

  // Load the index.html of the app
  const startUrl = url.format({
    pathname: path.join(__dirname, '../renderer/index.html'),
    protocol: 'file:',
    slashes: true,
  });

  await mainWindow.loadURL(startUrl);

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Show window when ready to avoid flickering
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });
};

// Create main window when Electron has finished initialization
app.on('ready', async () => {
  try {
    log.info('Application starting...');

    // Initialize services
    await initializeDatabase();
    setupIpcHandlers();
    registerFileSystemHandlers();

    // Create main application window
    await createWindow();

    log.info('Application started successfully');
  } catch (error) {
    log.error('Failed to start application:', error);
  }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
  dialog.showErrorBox(
    'An error occurred',
    `Application encountered an error: ${error.message}\n\nPlease check the log for more details.`
  );
});