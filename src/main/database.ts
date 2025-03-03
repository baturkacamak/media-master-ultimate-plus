import * as path from 'path';
import * as fs from 'fs/promises';
import * as sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite3';
import { promisify } from 'util';
import { app } from 'electron';
import log from 'electron-log';

// Global database connection
let db: Database | null = null;

/**
 * Initialize the SQLite database for the application
 */
export async function initializeDatabase(): Promise<void> {
    try {
        const userDataPath = app.getPath('userData');
        const dbDir = path.join(userDataPath, 'database');
        const dbPath = path.join(dbDir, 'mediamaster.db');

        // Ensure database directory exists
        await fs.mkdir(dbDir, { recursive: true });

        // Open database connection
        const openDatabase = promisify<string, sqlite3.Database>(open);
        db = await openDatabase(dbPath);

        // Enable foreign keys
        await runAsync('PRAGMA foreign_keys = ON');

        // Create tables if they don't exist
        await createTables();

        log.info('Database initialized successfully');
    } catch (error) {
        log.error('Error initializing database:', error);
        throw error;
    }
}

/**
 * Run a SQL query with optional parameters
 */
export async function runAsync(sql: string, params: any[] = []): Promise<void> {
    if (!db) {
        throw new Error('Database not initialized');
    }

    return new Promise<void>((resolve, reject) => {
        db!.run(sql, params, function(err) {
            if (err) return reject(err);
            resolve();
        });
    });
}

/**
 * Get a single row from a SQL query
 */
export async function getAsync<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    if (!db) {
        throw new Error('Database not initialized');
    }

    return new Promise<T | undefined>((resolve, reject) => {
        db!.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row as T | undefined);
        });
    });
}

/**
 * Get all rows from a SQL query
 */
export async function allAsync<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!db) {
        throw new Error('Database not initialized');
    }

    return new Promise<T[]>((resolve, reject) => {
        db!.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows as T[]);
        });
    });
}

/**
 * Create database tables
 */
async function createTables(): Promise<void> {
    // Tasks table
    await runAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      source_path TEXT NOT NULL,
      destination_path TEXT NOT NULL,
      operation TEXT NOT NULL,
      pattern TEXT NOT NULL,
      options TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      total_files INTEGER DEFAULT 0,
      processed_files INTEGER DEFAULT 0,
      succeeded_files INTEGER DEFAULT 0,
      skipped_files INTEGER DEFAULT 0,
      error_files INTEGER DEFAULT 0
    )
  `);

    // Files table
    await runAsync(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      source_path TEXT NOT NULL,
      destination_path TEXT,
      file_name TEXT NOT NULL,
      extension TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at TIMESTAMP,
      modified_at TIMESTAMP,
      exif_data TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )
  `);

    // Settings table
    await runAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_name TEXT NOT NULL UNIQUE,
      settings TEXT NOT NULL,
      is_default BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
    if (db) {
        return new Promise<void>((resolve, reject) => {
            db!.close((err) => {
                if (err) return reject(err);
                db = null;
                resolve();
            });
        });
    }
}

// Handle application quit
app.on('quit', async () => {
    try {
        await closeDatabase();
        log.info('Database connection closed');
    } catch (error) {
        log.error('Error closing database:', error);
    }
});