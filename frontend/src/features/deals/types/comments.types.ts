export enum CommentType {
    GENERAL = 'GENERAL',
    DOCUMENT = 'DOCUMENT',
    PARTICIPANT = 'PARTICIPANT',
    STAGE = 'STAGE',
    STATUS = 'STATUS'
  }
  
  export interface Comment {
    id: string;
    dealId: string;
    type: CommentType;
    content: string;
    createdBy: string;
    createdAt: Date;
    updatedAt?: Date;
    parentId?: string;
    metadata?: {
      documentId?: string;
      participantId?: string;
      stage?: string;
      status?: string;
      attachments?: Array<{
        id: string;
        type: string;
        url: string;
      }>;
      mentions?: string[];
      [key: string]: any;
    };
    replies?: Comment[];
  }
  
  export interface AddCommentPayload {
    content: string;
    type: CommentType;
    parentId?: string;
    metadata?: Record<string, any>;
  }
  
  export interface UpdateCommentPayload {
    content?: string;
    metadata?: Record<string, any>;
  }