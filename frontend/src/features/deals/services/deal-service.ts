// src/features/api/deals/services/deal-service.ts

import axios from 'axios';
import {
  Deal,
  DealDocument,
  DealStage,
  DealCreateResponse,
  UploadProgressCallback
} from '../types/deal.types';
import { json } from 'stream/consumers';
import { UpdateParticipantPayload } from '../types/participant.dto';
import { Comment, AddCommentPayload, UpdateCommentPayload } from '../types/comments.types';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class DealService {
  private static instance: DealService;

  private constructor() { }

  static getInstance(): DealService {
    if (!DealService.instance) {
      DealService.instance = new DealService();
    }
    return DealService.instance;
  }

  async uploadDocuments(dealId: string, files: File[]): Promise<DealDocument[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post<DealDocument[]>(
        `${API_URL}/api/deals/${dealId}/documents`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  

  async downloadDocuments(dealId: string, documents: DealDocument | DealDocument[]): Promise<void> {
    
    try {
      const token = localStorage.getItem('token');
      const docs = Array.isArray(documents) ? documents : [documents];
      
      // Single document download
      if (docs.length === 1) {
        const doc = docs[0];
        const response = await axios.get(
          `${API_URL}/api/deals/${dealId}/documents/${doc.id}/preview`,
          { 
            responseType: 'blob',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        
        console.log('url from service', `${API_URL}/api/deals/${dealId}/documents/${doc.id}/download`);
        // const response = await axios.get(
        //   `${API_URL}/api/deals/${dealId}/documents/${doc.id}/download`,
        //   { 
        //     responseType: 'blob',
        //     headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        //   }
        // );
        
        const url = window.URL.createObjectURL(new Blob([response.data], { 
          type: doc.metadata?.mimeType 
        }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', doc.name || 'document');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const response = await axios.post(
          `${API_URL}/api/deals/${dealId}/documents/download`,
          { documentIds: docs.map(d => d.id) },
          { responseType: 'blob' }
        );
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'documents.zip');
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }


  async previewDocument(dealId: string, document: DealDocument): Promise<string> {
    try {
      const response = await axios.get(
        `${API_URL}/api/deals/${dealId}/documents/${document.id}/preview`,
        { 
          responseType: 'blob',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      return URL.createObjectURL(new Blob([response.data], { 
        type: document.metadata?.mimeType || 'application/pdf' 
      }));
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  

  // async downloadDocuments(dealId: string, documents: DealDocument | DealDocument[]): Promise<void> {
  //   try {
  //     const docs = Array.isArray(documents) ? documents : [documents];
      
  //     if (docs.length > 1) {
  //       // Download as zip
  //       const response = await axios.post(
  //         `${API_URL}/api/deals/${dealId}/documents/download`,
  //         { documentIds: docs.map(d => d.id) },
  //         { responseType: 'blob' }
  //       );
        
  //       const url = window.URL.createObjectURL(new Blob([response.data]));
  //       const link = document.createElement('a');
  //       link.href = url;
  //       link.setAttribute('download', 'documents.zip');
  //       document.body.appendChild(link);
  //       link.click();
  //       link.parentNode?.removeChild(link);
  //       window.URL.revokeObjectURL(url);
  //     } else {
  //       // Single document download
  //       const response = await axios.get(
  //         `${API_URL}/api/deals/${dealId}/documents/${docs[0].id}/download`,
  //         { responseType: 'blob' }
  //       );
        
  //       const url = window.URL.createObjectURL(new Blob([response.data]));
  //       const link = document.createElement('a');
  //       link.href = url;
  //       link.setAttribute('download', docs[0].name ?? 'document');
  //       document.body.appendChild(link);
  //       link.click();
  //       link.parentNode?.removeChild(link);
  //       window.URL.revokeObjectURL(url);
  //     }
  //   } catch (error) {
  //     throw this.handleError(error);
  //   }
  // }

  async deleteDocument(dealId: string, documentId: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/api/deals/${dealId}/documents/${documentId}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async approveDocument(dealId: string, documentId: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/api/deals/${dealId}/documents/${documentId}/approve`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async rejectDocument(dealId: string, documentId: string, reason: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/api/deals/${dealId}/documents/${documentId}/reject`, { reason });
    } catch (error) {
      throw this.handleError(error);
    }
  }


  async removeParticipant(dealId: string, participantId: string): Promise<void> {
    await axios.delete(`${API_URL}/api/deals/${dealId}/participants/${participantId}`);
  }

  async updateParticipant(dealId: string, participantId: string, data: UpdateParticipantPayload): Promise<void> {
    await axios.put(`${API_URL}/api/deals/${dealId}/participants/${participantId}`, data);
  }


  async createDeal(
    data: any,
    onProgress?: UploadProgressCallback
  ): Promise<DealCreateResponse> {
    try {


      const formData = data //await this.prepareFormData(data);

      const logFormDataContent = (formData: FormData) => {
        console.log('=== FormData Content ===');
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: [File] ${value.name} (${value.type})`);
          } else {
            try {
              // Try to parse as JSON to log structured data
              const parsed = JSON.parse(value as string);
              console.log(`${key}:`, parsed);
            } catch {
              console.log(`${key}:`, value);
            }
          }
        }
        console.log('=====================');
      };
      
      // Use it before the axios call:
      // logFormDataContent(formData);
      

      // console.log('data from service', data.toString());
      // console.log('data from service', JSON.parse(FormData.toString()) );

      const response = await axios.post<DealCreateResponse>(
        `${API_URL}/api/deals`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total || 0)
              );
              onProgress(percentCompleted);
            }
          },
        }
      );

      return response.data;

    } catch (error) {
      console.error('Error in createDeal:', error);
      throw this.handleError(error);
    }
  }

  private async prepareFormData(data: any): Promise<FormData> {
    const formData = new FormData();

    for (const [key, value] of data.entries()) {
      console.log(`${key}:`, value);
  }

    // console.log('data from prepare form data in service', data);

    // Add basic info
    formData.append('basicInfo', JSON.stringify(data.basicInfo));

    // Add participants
    formData.append('participants', JSON.stringify(data.participants));

    // Add terms
    formData.append('terms', JSON.stringify(data.terms));

    // Add logistics if present
    if (data.logistics) {
      formData.append('logistics', JSON.stringify(data.logistics));
    }

    // Clean and append document metadata
    const documentMetadata = data.docs.map((doc: any, index: number) => ({
      type: doc.documentType || doc.type,
      name: doc.name || `document-${index}`,
      status: 'pending',
      metadata: doc.metadata || {}
    }));
    formData.append('docs', JSON.stringify(documentMetadata));

    // Append document files
    data.docs.forEach((doc: any) => {
      if (doc.file instanceof File) {
        formData.append('documentFiles', doc.file);
      }
    });

    // console.log('formData from prepare form data in service', formData);

    return formData;
  }


  async updateDeal(id: string, data: any): Promise<Deal> {
    try {
      const response = await axios.put<Deal>(
        `${API_URL}/api/deals/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateStage(id: string, stage: DealStage): Promise<Deal> {
    try {
      console.log('stage from service', stage);
      const response = await axios.post<Deal>(
        `${API_URL}/api/deals/${id}/stage`,
        { stage }
      );
      console.log('response from updateStage', response);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateStatus(id: string, status: string): Promise<Deal> {
    try {
      const response = await axios.post<Deal>(
        `${API_URL}/api/deals/${id}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addParticipant(id: string, participant: any): Promise<Deal> {
    // console.log('participant from service', participant);
    try {
      const response = await axios.post<Deal>(
        `${API_URL}/api/deals/${id}/participants`,
        participant
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async validateStage(id: string, stage: DealStage): Promise<any> {
    try {
      const response = await axios.post<any>(
        `${API_URL}/api/deals/${id}/stage/validate`,
        { stage }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDeal(id: string): Promise<Deal> {
    try {
      const response = await axios.get<Deal>(`${API_URL}/api/deals/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async searchDeals(params: any) {
    try {
      const response = await axios.get(`${API_URL}/api/deals`, { params });
      // console.log('response from searchDeals', response);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'An unknown error occurred';
      console.error('API Error:', message);
      return new Error(message);
    }
    console.error('Unknown Error:', error);
    return new Error('An unexpected error occurred');
  }

  async getComments(dealId: string): Promise<Comment[]> {
    try {
      const response = await axios.get<Comment[]>(
        `${API_URL}/api/deals/${dealId}/comments`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  async addComment(dealId: string, data: AddCommentPayload): Promise<Comment> {
    try {
      const response = await axios.post<Comment>(
        `${API_URL}/api/deals/${dealId}/comments`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  async updateComment(dealId: string, commentId: string, data: UpdateCommentPayload): Promise<Comment> {
    try {
      const response = await axios.put<Comment>(
        `${API_URL}/api/deals/${dealId}/comments/${commentId}`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  async deleteComment(dealId: string, commentId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_URL}/api/deals/${dealId}/comments/${commentId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
}

export const dealService = DealService.getInstance();