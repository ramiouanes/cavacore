// backend/src/shared/interceptors/fastify-files.interceptor.ts

import { 
    Injectable, 
    NestInterceptor, 
    ExecutionContext, 
    CallHandler,
    BadRequestException,
    UseInterceptors
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import {FastifyRequest as OriginalFastifyRequest} from 'fastify';
  import { MultipartFile } from '@fastify/multipart';
  import { FileLogger } from '../utils/logger';
  import { Readable } from 'stream';

  export interface FastifyFileFields {
    name: string;
    maxCount?: number;
  }
  
  export interface ProcessedFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    fieldname: string;
  }

  interface ExtendedFastifyRequest extends OriginalFastifyRequest {
    processedFiles?: ProcessedFile[];
    processedFields?: Record<string, string>;
  }
  
@Injectable()
export class FastifyFilesInterceptor implements NestInterceptor {
    constructor(
        private readonly fields: FastifyFileFields[],
        private readonly options: {
        maxFileSize?: number;
        maxFiles?: number;
        allowedMimeTypes?: string[];
        } = {}
    ) {}
  
    async intercept(
      context: ExecutionContext,
      next: CallHandler
    ): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest<ExtendedFastifyRequest>();
        const processedFiles: ProcessedFile[] = [];
        let processedFields: {};
        const logger = FileLogger.getInstance();
  
      try {
        processedFields = {};
        logger.log('Starting file processing');

        // Get all parts from the request
        const parts = await request.parts();
  
        for await (const part of parts) {
            logger.log('Processing part:', {
                filename: part.filename,
                fieldname: part.fieldname,
                mimetype: part.mimetype,
                isFile: !!part.filename,
                content: part,
            });

            if (!!part.filename) {
                await this.validateFile(part);

                const field = this.fields.find(f => f.name === part.fieldname);
                if (!field) {
                    throw new BadRequestException(`Unexpected field: ${part.fieldname}`);
                    }

                const fieldCount = processedFiles.filter(f => f.fieldname === part.fieldname).length;
                if (field.maxCount && fieldCount >= field.maxCount) {
                    throw new BadRequestException(
                        `Too many files for field ${part.fieldname}. Maximum allowed: ${field.maxCount}`
                    );
                }

                const buffer = await part.toBuffer();
                processedFiles.push({
                    buffer,
                    originalname: part.filename,
                    mimetype: part.mimetype,
                    fieldname: part.fieldname
                });
            } else {
                // Handle form field
                try {
                    logger.log('content:', part.fields);
                    let fieldContent = part.fields;
                    let value = '';
                    
                    // // Handle the field value
                    // if (typeof part.fields[part.fieldname] === 'string') {
                    //   // Direct string value
                    //   value = fieldContent;
                    // } else if (Buffer.isBuffer(part.fields[part.fieldname])) {
                    //   // Buffer value
                    //   value = fieldContent;
                    // } else if (part.fields[part.fieldname] && typeof part.fields[part.fieldname] === 'object') {
                    //   // Object value (likely JSON)
                    //   value = JSON.stringify(part.fields[part.fieldname]);
                    // }
        
                    // if (!part.fields[part.fieldname] && part.fields) {
                    //   // Handle fields property if value is not set
                    //   value = JSON.stringify(part.fields[part.fieldname]) || '';
                    // }
        
                    processedFields = fieldContent;
                    logger.log(`Processed field ${part.fieldname}:`, fieldContent);
        
                  } catch (error) {
                    logger.error(`Error processing field ${part.fieldname}:`, error);
                    throw new BadRequestException(`Failed to process field ${part.fieldname}`);
                  }
            }
    }

    logger.log('Processed files count:', processedFiles.length);
    logger.log('Processed fields:', processedFields);

    // Add the processed files to the request object
    request.processedFiles = processedFiles;
    request.processedFields = processedFields;
  
    return next.handle();

    } catch (error) {
        logger.error('Error in file interceptor:', error);
        if (error instanceof BadRequestException) {
            throw error;
        }
        throw new BadRequestException('Error processing file upload');
    }
}
  
private async validateFile(file: MultipartFile) {
    if (this.options.maxFileSize) {
      const buffer = await file.toBuffer();
      if (buffer.length > this.options.maxFileSize) {
        throw new BadRequestException(
          `File ${file.filename} is too large. Maximum size: ${
            this.options.maxFileSize / (1024 * 1024)
          }MB`
        );
      }
    }
 
    if (this.options.allowedMimeTypes?.length) {
      if (!this.options.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid file type for ${file.filename}. Allowed types: ${
            this.options.allowedMimeTypes.join(', ')
          }`
        );
      }
    }
  }
}
  
  // Create a decorator for easier use
  export function FastifyFiles(
    fields: FastifyFileFields[],
    options: {
      maxFileSize?: number;
      maxFiles?: number;
      allowedMimeTypes?: string[];
    } = {}
   ) {
    return UseInterceptors(new FastifyFilesInterceptor(fields, options));
   }
  
  export type FastifyRequest = ExtendedFastifyRequest;