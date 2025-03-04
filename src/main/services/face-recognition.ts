import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import log from 'electron-log';
import axios from 'axios';
import * as crypto from 'crypto';

const execPromise = promisify(exec);

/**
 * Face detection result structure
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
  faceDescriptor?: number[];  // Face embedding vector for recognition (128D)
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
 * Face recognition options
 */
export interface FaceRecognitionOptions {
  minFaceSize: number;      // Minimum face size to detect (px)
  maxFaceSize: number;      // Maximum face size to detect (px)
  confidenceThreshold: number; // Minimum confidence for face detection
  recognitionThreshold: number; // Minimum confidence for face recognition
  enableLandmarks: boolean; // Enable facial landmark detection
  enableAttributes: boolean; // Enable attribute detection (age, gender, etc.)
  maxFacesPerImage: number; // Maximum number of faces to detect per image
  useLocalModel: boolean;   // Use local model instead of cloud API
  apiKey?: string;          // Cloud API key if not using local model
}

/**
 * Manages face detection and recognition
 */
export class FaceRecognitionService {
  private dbDir: string;
  private modelsDir: string;
  private peopleDir: string;
  private peopleDbPath: string;
  private facesDbPath: string;
  private cacheDir: string;
  private options: FaceRecognitionOptions;
  private people: Map<string, Person> = new Map();
  private peopleByName: Map<string, Person> = new Map();
  private detectionModelLoaded: boolean = false;
  private recognitionModelLoaded: boolean = false;

  constructor() {
    // Set up directories
    const userDataPath = app.getPath('userData');
    this.dbDir = path.join(userDataPath, 'facerecognition');
    this.modelsDir = path.join(this.dbDir, 'models');
    this.peopleDir = path.join(this.dbDir, 'people');
    this.peopleDbPath = path.join(this.dbDir, 'people.json');
    this.facesDbPath = path.join(this.dbDir, 'faces.json');
    this.cacheDir = path.join(this.dbDir, 'cache');

    // Default options
    this.options = {
      minFaceSize: 20,
      maxFaceSize: 0, // 0 means no limit
      confidenceThreshold: 0.7,
      recognitionThreshold: 0.6,
      enableLandmarks: true,
      enableAttributes: true,
      maxFacesPerImage: 20,
      useLocalModel: true,
      apiKey: '',
    };

    // Initialize
    this.initialize();
  }

  /**
   * Initialize the face recognition service
   */
  private async initialize(): Promise<void> {
    try {
      // Create necessary directories
      await fs.mkdir(this.dbDir, { recursive: true });
      await fs.mkdir(this.modelsDir, { recursive: true });
      await fs.mkdir(this.peopleDir, { recursive: true });
      await fs.mkdir(this.cacheDir, { recursive: true });

      // Load people database if it exists
      await this.loadPeopleDatabase();

      // Load models if using local model
      if (this.options.useLocalModel) {
        await this.loadModels();
      }

      log.info('Face recognition service initialized');
    } catch (error) {
      log.error('Error initializing face recognition service:', error);
    }
  }

  /**
   * Load face recognition models
   * In a real implementation, this would load actual ML models
   */
  private async loadModels(): Promise<void> {
    try {
      // This is a simulated model loading
      // In a real implementation, this would load TensorFlow.js models

      // Simulate model loading time
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.detectionModelLoaded = true;
      this.recognitionModelLoaded = true;
      log.info('Face recognition models loaded');
    } catch (error) {
      log.error('Error loading face recognition models:', error);
      throw error;
    }
  }

  /**
   * Load people database from disk
   */
  private async loadPeopleDatabase(): Promise<void> {
    try {
      // Check if people database exists
      try {
        await fs.access(this.peopleDbPath);
      } catch (error) {
        // Create empty database if it doesn't exist
        await fs.writeFile(this.peopleDbPath, JSON.stringify({ people: [] }), 'utf8');
        return;
      }

      // Read and parse people database
      const peopleData = await fs.readFile(this.peopleDbPath, 'utf8');
      const peopleDb = JSON.parse(peopleData);

      // Load people into memory
      this.people.clear();
      this.peopleByName.clear();

      if (Array.isArray(peopleDb.people)) {
        for (const person of peopleDb.people) {
          this.people.set(person.id, person);
          this.peopleByName.set(person.name.toLowerCase(), person);
        }
      }

      log.info(`Loaded ${this.people.size} people from database`);
    } catch (error) {
      log.error('Error loading people database:', error);
    }
  }

  /**
   * Save people database to disk
   */
  private async savePeopleDatabase(): Promise<void> {
    try {
      const peopleArray = Array.from(this.people.values());
      const peopleDb = { people: peopleArray };
      await fs.writeFile(this.peopleDbPath, JSON.stringify(peopleDb, null, 2), 'utf8');
      log.info(`Saved ${this.people.size} people to database`);
    } catch (error) {
      log.error('Error saving people database:', error);
    }
  }

  /**
   * Configure face recognition options
   */
  public configure(options: Partial<FaceRecognitionOptions>): void {
    this.options = { ...this.options, ...options };

    // If switching to local model and models aren't loaded, load them
    if (this.options.useLocalModel && (!this.detectionModelLoaded || !this.recognitionModelLoaded)) {
      this.loadModels().catch(error => {
        log.error('Error loading models after reconfiguration:', error);
      });
    }

    log.info('Face recognition service configured with new options');
  }

  /**
   * Calculate file hash for caching and tracking
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256');
      hash.update(fileBuffer);
      return hash.digest('hex');
    } catch (error) {
      log.error(`Error calculating file hash for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Detect faces in an image
   */
  public async detectFaces(filePath: string): Promise<FaceRecognitionResult> {
    try {
      // Validate file exists and is an image
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw new Error(`Not a file: ${filePath}`);
      }

      // Check supported image format
      const ext = path.extname(filePath).toLowerCase();
      const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];
      if (!supportedFormats.includes(ext)) {
        throw new Error(`Unsupported image format: ${ext}`);
      }

      // Calculate file hash for caching
      const fileHash = await this.calculateFileHash(filePath);

      // Check cache for this image
      const cacheResult = await this.getCachedResult(fileHash);
      if (cacheResult) {
        log.info(`Using cached face detection result for ${filePath}`);
        return cacheResult;
      }

      // Perform face detection
      const result = this.options.useLocalModel
        ? await this.detectFacesWithLocalModel(filePath, fileHash)
        : await this.detectFacesWithCloudApi(filePath, fileHash);

      // Cache the result
      await this.cacheResult(fileHash, result);

      // Try to recognize faces if we have people in the database
      if (this.people.size > 0) {
        await this.recognizeFaces(result);
      }

      return result;
    } catch (error) {
      log.error(`Error detecting faces in ${filePath}:`, error);
      return {
        filePath,
        fileHash: '',
        imageWidth: 0,
        imageHeight: 0,
        faces: [],
        error: (error as Error).message
      };
    }
  }

  /**
   * Batch process multiple images
   */
  public async processBatch(filePaths: string[]): Promise<FaceRecognitionResult[]> {
    const results: FaceRecognitionResult[] = [];

    for (const filePath of filePaths) {
      try {
        const result = await this.detectFaces(filePath);
        results.push(result);
      } catch (error) {
        log.error(`Error processing ${filePath} in batch:`, error);
        results.push({
          filePath,
          fileHash: '',
          imageWidth: 0,
          imageHeight: 0,
          faces: [],
          error: (error as Error).message
        });
      }
    }

    return results;
  }

  /**
   * Create or update a person
   */
  public async createOrUpdatePerson(person: Partial<Person> & { name: string }): Promise<Person> {
    try {
      // Check if person with this name already exists
      const existingPerson = this.peopleByName.get(person.name.toLowerCase());

      if (existingPerson) {
        // Update existing person
        const updatedPerson: Person = {
          ...existingPerson,
          ...person,
          dateModified: new Date().toISOString()
        };

        this.people.set(updatedPerson.id, updatedPerson);
        this.peopleByName.set(updatedPerson.name.toLowerCase(), updatedPerson);

        // Save the updated database
        await this.savePeopleDatabase();

        return updatedPerson;
      } else {
        // Create new person
        const newPerson: Person = {
          id: crypto.randomUUID(),
          name: person.name,
          faceIds: person.faceIds || [],
          faceDescriptors: person.faceDescriptors || [],
          sampleImages: person.sampleImages || [],
          thumbnailPath: person.thumbnailPath,
          dateCreated: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          imageCount: person.imageCount || 0
        };

        this.people.set(newPerson.id, newPerson);
        this.peopleByName.set(newPerson.name.toLowerCase(), newPerson);

        // Save the updated database
        await this.savePeopleDatabase();

        return newPerson;
      }
    } catch (error) {
      log.error('Error creating/updating person:', error);
      throw error;
    }
  }

  /**
   * Delete a person
   */
  public async deletePerson(personId: string): Promise<boolean> {
    try {
      const person = this.people.get(personId);
      if (!person) {
        return false;
      }

      // Remove from the maps
      this.people.delete(personId);
      this.peopleByName.delete(person.name.toLowerCase());

      // Remove sample images
      for (const imagePath of person.sampleImages) {
        try {
          await fs.unlink(imagePath);
        } catch (error) {
          log.warn(`Error deleting sample image ${imagePath}:`, error);
        }
      }

      // Remove thumbnail if it exists
      if (person.thumbnailPath) {
        try {
          await fs.unlink(person.thumbnailPath);
        } catch (error) {
          log.warn(`Error deleting thumbnail ${person.thumbnailPath}:`, error);
        }
      }

      // Save the updated database
      await this.savePeopleDatabase();

      return true;
    } catch (error) {
      log.error(`Error deleting person ${personId}:`, error);
      return false;
    }
  }

  /**
   * Get all people
   */
  public getAllPeople(): Person[] {
    return Array.from(this.people.values());
  }

  /**
   * Get a person by ID
   */
  public getPersonById(personId: string): Person | undefined {
    return this.people.get(personId);
  }

  /**
   * Add face to a person
   */
  public async addFaceToPerson(personId: string, faceImage: string, faceRect: { x: number, y: number, width: number, height: number }): Promise<Person | undefined> {
    try {
      const person = this.people.get(personId);
      if (!person) {
        return undefined;
      }

      // Generate unique ID for this face
      const faceId = crypto.randomUUID();

      // Extract face from image
      const faceImagePath = path.join(this.peopleDir, `${personId}_${faceId}${path.extname(faceImage)}`);

      // In a real implementation, we would crop the face from the image
      // Here we'll just copy the image for demonstration
      await fs.copyFile(faceImage, faceImagePath);

      // In a real implementation, we would compute the face descriptor here
      // For demonstration, we'll generate a random descriptor
      const faceDescriptor = Array.from({ length: 128 }, () => Math.random() * 2 - 1);

      // Update person
      person.faceIds.push(faceId);
      person.faceDescriptors.push(faceDescriptor);
      person.sampleImages.push(faceImagePath);
      person.dateModified = new Date().toISOString();

      // If this is the first face, use it as thumbnail
      if (!person.thumbnailPath) {
        person.thumbnailPath = faceImagePath;
      }

      // Save the updated database
      await this.savePeopleDatabase();

      return person;
    } catch (error) {
      log.error(`Error adding face to person ${personId}:`, error);
      return undefined;
    }
  }

  /**
   * Remove face from a person
   */
  public async removeFaceFromPerson(personId: string, faceId: string): Promise<Person | undefined> {
    try {
      const person = this.people.get(personId);
      if (!person) {
        return undefined;
      }

      // Find the index of the face
      const index = person.faceIds.indexOf(faceId);
      if (index === -1) {
        return person;
      }

      // Get the image path
      const imagePath = person.sampleImages[index];

      // Remove face from arrays
      person.faceIds.splice(index, 1);
      person.faceDescriptors.splice(index, 1);
      person.sampleImages.splice(index, 1);
      person.dateModified = new Date().toISOString();

      // Delete the image file
      try {
        await fs.unlink(imagePath);
      } catch (error) {
        log.warn(`Error deleting face image ${imagePath}:`, error);
      }

      // If this was the thumbnail, update the thumbnail
      if (person.thumbnailPath === imagePath) {
        person.thumbnailPath = person.sampleImages.length > 0 ? person.sampleImages[0] : undefined;
      }

      // Save the updated database
      await this.savePeopleDatabase();

      return person;
    } catch (error) {
      log.error(`Error removing face from person ${personId}:`, error);
      return undefined;
    }
  }

  /**
   * Get cached face detection result
   */
  private async getCachedResult(fileHash: string): Promise<FaceRecognitionResult | null> {
    try {
      const cachePath = path.join(this.cacheDir, `${fileHash}.json`);

      // Check if cache file exists
      try {
        await fs.access(cachePath);
      } catch {
        return null;
      }

      // Read and parse cache file
      const cacheData = await fs.readFile(cachePath, 'utf8');
      return JSON.parse(cacheData);
    } catch (error) {
      log.error('Error reading cached face detection result:', error);
      return null;
    }
  }

  /**
   * Cache face detection result
   */
  private async cacheResult(fileHash: string, result: FaceRecognitionResult): Promise<void> {
    try {
      const cachePath = path.join(this.cacheDir, `${fileHash}.json`);
      await fs.writeFile(cachePath, JSON.stringify(result), 'utf8');
    } catch (error) {
      log.error('Error caching face detection result:', error);
    }
  }

  /**
   * Detect faces using local model
   * This is a simulated implementation for demonstration
   */
  private async detectFacesWithLocalModel(filePath: string, fileHash: string): Promise<FaceRecognitionResult> {
    if (!this.detectionModelLoaded) {
      await this.loadModels();
    }

    // This is a simulated implementation
    // In a real implementation, this would use a face detection library

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate a deterministic but random number of faces based on the file hash
    const hashSum = fileHash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const numFaces = (hashSum % 5) + 1; // 1 to 5 faces

    const faces: FaceDetection[] = [];

    // Generate artificial image dimensions based on the file name
    const imageWidth = 800 + (hashSum % 1600); // 800 to 2400 pixels
    const imageHeight = 600 + (hashSum % 1200); // 600 to 1800 pixels

    // Generate simulated faces
    for (let i = 0; i < numFaces; i++) {
      // Create deterministic but random face position based on the file hash and face index
      const faceHashBase = fileHash + i.toString();
      const faceHashSum = faceHashBase.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

      const x = faceHashSum % (imageWidth - 200);
      const y = (faceHashSum * 13) % (imageHeight - 200);
      const width = 100 + (faceHashSum % 150);
      const height = width * (0.8 + (faceHashSum % 40) / 100);

      // Random confidence between 0.7 and 0.99
      const confidence = 0.7 + ((faceHashSum % 29) / 100);

      // Generate a face descriptor (128D vector) - this would normally come from a face recognition model
      const faceDescriptor = Array.from({ length: 128 }, (_, j) => {
        const seed = (faceHashSum + j) % 1000;
        return (seed / 500) - 1; // Range: -1 to 1
      });

      // Create face object
      const face: FaceDetection = {
        id: crypto.createHash('md5').update(faceHashBase).digest('hex'),
        boundingBox: {
          x,
          y,
          width,
          height
        },
        confidence,
        faceDescriptor
      };

      // Add facial landmarks if enabled
      if (this.options.enableLandmarks) {
        face.landmarks = {
          leftEye: [x + width * 0.3, y + height * 0.4],
          rightEye: [x + width * 0.7, y + height * 0.4],
          nose: [x + width * 0.5, y + height * 0.5],
          mouth: [x + width * 0.5, y + height * 0.7],
          leftEar: [x + width * 0.1, y + height * 0.5],
          rightEar: [x + width * 0.9, y + height * 0.5]
        };
      }

      // Add attributes if enabled
      if (this.options.enableAttributes) {
        const ageBase = 15 + (faceHashSum % 60); // 15 to 75 years
        const emotions = ['neutral', 'happy', 'sad', 'angry', 'surprised'];
        const emotionIndex = faceHashSum % emotions.length;

        face.attributes = {
          age: ageBase,
          gender: faceHashSum % 2 === 0 ? 'male' : 'female',
          emotion: emotions[emotionIndex],
          glasses: faceHashSum % 3 === 0,
          smile: faceHashSum % 2 === 0,
          pose: {
            roll: (faceHashSum % 30) - 15, // -15 to 15 degrees
            yaw: (faceHashSum % 40) - 20,  // -20 to 20 degrees
            pitch: (faceHashSum % 30) - 15 // -15 to 15 degrees
          }
        };
      }

      faces.push(face);
    }

    return {
      filePath,
      fileHash,
      imageWidth,
      imageHeight,
      faces
    };
  }

  /**
   * Detect faces using cloud API
   * This is a simulated implementation for demonstration
   */
  private async detectFacesWithCloudApi(filePath: string, fileHash: string): Promise<FaceRecognitionResult> {
    if (!this.options.apiKey) {
      throw new Error('API key is required for cloud-based face detection');
    }

    // This is a simulated implementation
    // In a real implementation, this would call a cloud API

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Similar to local model but with different parameters to simulate cloud API
    const hashSum = fileHash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const numFaces = (hashSum % 6) + 1; // 1 to 6 faces

    const faces: FaceDetection[] = [];

    // Generate artificial image dimensions based on the file name
    const imageWidth = 1000 + (hashSum % 2000); // 1000 to 3000 pixels
    const imageHeight = 750 + (hashSum % 1500); // 750 to 2250 pixels

    // Generate simulated faces
    for (let i = 0; i < numFaces; i++) {
      // Create deterministic but random face position based on the file hash and face index
      const faceHashBase = fileHash + i.toString();
      const faceHashSum = faceHashBase.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

      const x = faceHashSum % (imageWidth - 250);
      const y = (faceHashSum * 17) % (imageHeight - 250);
      const width = 120 + (faceHashSum % 180);
      const height = width * (0.8 + (faceHashSum % 40) / 100);

      // Higher accuracy for cloud API (0.8 to 0.99)
      const confidence = 0.8 + ((faceHashSum % 19) / 100);

      // Generate a face descriptor (128D vector)
      const faceDescriptor = Array.from({ length: 128 }, (_, j) => {
        const seed = (faceHashSum + j) % 1000;
        return (seed / 500) - 1; // Range: -1 to 1
      });

      // Create face object
      const face: FaceDetection = {
        id: crypto.createHash('md5').update(faceHashBase).digest('hex'),
        boundingBox: {
          x,
          y,
          width,
          height
        },
        confidence,
        faceDescriptor
      };

      // Cloud APIs typically have more accurate landmarks and attributes
      face.landmarks = {
        leftEye: [x + width * 0.31, y + height * 0.38],
        rightEye: [x + width * 0.69, y + height * 0.38],
        nose: [x + width * 0.5, y + height * 0.48],
        mouth: [x + width * 0.5, y + height * 0.68],
        leftEar: [x + width * 0.08, y + height * 0.5],
        rightEar: [x + width * 0.92, y + height * 0.5]
      };

      const ageBase = 15 + (faceHashSum % 60); // 15 to 75 years
      const emotions = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted'];
      const emotionIndex = faceHashSum % emotions.length;

      face.attributes = {
        age: ageBase,
        gender: faceHashSum % 2 === 0 ? 'male' : 'female',
        emotion: emotions[emotionIndex],
        glasses: faceHashSum % 3 === 0,
        smile: faceHashSum % 2 === 0,
        pose: {
          roll: (faceHashSum % 30) - 15, // -15 to 15 degrees
          yaw: (faceHashSum % 40) - 20,  // -20 to 20 degrees
          pitch: (faceHashSum % 30) - 15 // -15 to 15 degrees
        }
      };

      faces.push(face);
    }

    return {
      filePath,
      fileHash,
      imageWidth,
      imageHeight,
      faces
    };
  }

  /**
   * Recognize faces by comparing with known people
   * This is a simplified implementation for demonstration
   */
  private async recognizeFaces(result: FaceRecognitionResult): Promise<void> {
    // Skip if no people in the database or no faces in the image
    if (this.people.size === 0 || result.faces.length === 0) {
      return;
    }

    // Get all people with face descriptors
    const peopleWithFaces = Array.from(this.people.values())
      .filter(person => person.faceDescriptors.length > 0);

    if (peopleWithFaces.length === 0) {
      return;
    }

    // For each detected face
    for (const face of result.faces) {
      // Skip if no face descriptor
      if (!face.faceDescriptor) {
        continue;
      }

      let bestMatchPerson: Person | null = null;
      let bestMatchConfidence = 0;

      // Compare with each person
      for (const person of peopleWithFaces) {
        // Compare with each face descriptor of this person
        for (const personFaceDescriptor of person.faceDescriptors) {
          // Compute similarity (cosine distance)
          const similarity = this.computeSimilarity(face.faceDescriptor, personFaceDescriptor);

          // Update best match if better than previous and above threshold
          if (similarity > bestMatchConfidence && similarity >= this.options.recognitionThreshold) {
            bestMatchConfidence = similarity;
            bestMatchPerson = person;
          }
        }
      }

      // If we found a match, update the face
      if (bestMatchPerson) {
        face.personId = bestMatchPerson.id;
        face.personName = bestMatchPerson.name;
        face.matchConfidence = bestMatchConfidence;

        // Update person's image count
        bestMatchPerson.imageCount += 1;
      }
    }

    // Save any changes to people database
    await this.savePeopleDatabase();
  }

  /**
   * Compute similarity between two face descriptors
   * Uses cosine similarity: 1 is perfect match, 0 is no similarity
   */
  private computeSimilarity(descriptor1: number[], descriptor2: number[]): number {
    // Calculate dot product
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < descriptor1.length; i++) {
      dotProduct += descriptor1[i] * descriptor2[i];
      norm1 += descriptor1[i] * descriptor1[i];
      norm2 += descriptor2[i] * descriptor2[i];
    }

    // Compute cosine similarity
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    // Save any pending changes
    await this.savePeopleDatabase();

    // In a real implementation, this would unload models and free resources
    this.detectionModelLoaded = false;
    this.recognitionModelLoaded = false;

    log.info('Face recognition service resources cleaned up');
  }
}

// Export a singleton instance for global usage
export const faceRecognitionService = new FaceRecognitionService();