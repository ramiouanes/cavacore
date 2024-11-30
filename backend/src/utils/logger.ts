// src/utils/logger.ts

import * as fs from 'fs';
import * as path from 'path';
import { MultipartFile } from '@fastify/multipart';
import { ProcessedFile } from '../shared/fastify-files.interceptor';

export class FileLogger {
  private static logStream: fs.WriteStream;
  private static instance: FileLogger;

  private constructor() {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }

    const logFile = path.join(logDir, `debug-${new Date().toISOString().split('T')[0]}.log`);
    FileLogger.logStream = fs.createWriteStream(logFile, { flags: 'a' });
  }

  static getInstance(): FileLogger {
    if (!FileLogger.instance) {
      FileLogger.instance = new FileLogger();
    }
    return FileLogger.instance;
  }

  private stringifyValue(value: any, depth = 0, maxDepth = 3): string {
    // Prevent infinite recursion
    if (depth > maxDepth) {
      return '[Max Depth Reached]';
    }

    if (value === null || value === undefined) return 'null';
    
    if (typeof value === 'string') return value;
    
    if (Buffer.isBuffer(value)) {
      return `[Buffer: ${value.length} bytes]`;
    }

    // Handle ProcessedFile objects
    if (this.isProcessedFile(value)) {
      return `[ProcessedFile: ${value.originalname}, ${value.buffer.length} bytes, ${value.mimetype}]`;
    }

    // Handle MultipartFile objects
    if (this.isMultipartFile(value)) {
      return `[MultipartFile: ${value.filename}, ${value.mimetype}]`;
    }
    
    if (typeof value === 'object') {
      try {
        // Handle arrays
        if (Array.isArray(value)) {
          const items = value.map(v => this.stringifyValue(v, depth + 1, maxDepth));
          return `[${items.join(', ')}]`;
        }

        // Handle Fastify multipart fields
        if (value.fieldname && value.value !== undefined) {
          return `Field(${value.fieldname}): ${this.stringifyValue(value.value, depth + 1, maxDepth)}`;
        }

        // Regular object
        const seen = new WeakSet();
        const stringifyObject = (obj: any): string => {
          if (seen.has(obj)) {
            return '[Circular]';
          }
          seen.add(obj);

          const entries = Object.entries(obj)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => `${k}: ${this.stringifyValue(v, depth + 1, maxDepth)}`);
          
          return `{ ${entries.join(', ')} }`;
        };

        return stringifyObject(value);
      } catch (error) {
        return '[Error during stringification]';
      }
    }
    
    return String(value);
  }

  private isProcessedFile(value: any): value is ProcessedFile {
    return value &&
           typeof value === 'object' &&
           Buffer.isBuffer(value.buffer) &&
           typeof value.originalname === 'string' &&
           typeof value.mimetype === 'string' &&
           typeof value.fieldname === 'string';
  }

  private isMultipartFile(value: any): value is MultipartFile {
    return value &&
           typeof value === 'object' &&
           typeof value.filename === 'string' &&
           typeof value.mimetype === 'string' &&
           typeof value.fieldname === 'string';
  }

  log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    let logMessage = `\n[${timestamp}] ${message}\n`;
    
    if (data !== undefined) {
      try {
        if (typeof data === 'object' && data !== null) {
          logMessage += 'Object Properties:\n';
          const stringified = this.stringifyValue(data);
          logMessage += `  ${stringified}\n`;
        } else {
          logMessage += this.stringifyValue(data);
        }
      } catch (error) {
        logMessage += `[Error logging data: ${error instanceof Error ? error.message : 'Unknown error'}]\n`;
      }
    }
    
    logMessage += '\n----------------------------------------';
    FileLogger.logStream.write(logMessage + '\n');
  }

  error(message: string, error: any) {
    const timestamp = new Date().toISOString();
    let logMessage = `\n[${timestamp}] ERROR: ${message}\n`;
    
    if (error) {
      logMessage += `Error Type: ${error.constructor.name}\n`;
      logMessage += `Message: ${error.message}\n`;
      if (error.stack) {
        logMessage += `Stack: ${error.stack}\n`;
      }
    }
    
    logMessage += '\n----------------------------------------';
    FileLogger.logStream.write(logMessage + '\n');
  }
}