// src/features/horses/services/horse-service.ts

import axios from 'axios';
import { 
  Horse, 
  HorseCreateResponse, 
  HorseSearchParams,
  UploadProgressCallback
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class HorseService {
  private static instance: HorseService;

  private constructor() {}

  static getInstance(): HorseService {
    if (!HorseService.instance) {
      HorseService.instance = new HorseService();
    }
    return HorseService.instance;
  }

  async searchHorses(params: HorseSearchParams) {
    try {
      const response = await axios.get<{
        horses: Horse[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`${API_URL}/api/horses`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getHorse(id: string) {
    try {
      const response = await axios.get<Horse>(`${API_URL}/api/horses/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createProfile(
    formData: FormData,
    onProgress?: UploadProgressCallback
  ): Promise<HorseCreateResponse> {
    try {
      // const formData = await this.prepareFormData(data);

      // Log cleaned FormData contents for debugging
      // for (const pair of formData.entries()) {
      //   //console.log('FormData entry -', pair[0], ':', 
      //     pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]
      //   );
      // }  
      
      const response = await axios.post<HorseCreateResponse>(
        `${API_URL}/api/horses`,
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
      console.error('Error in createProfile:', error);
      throw this.handleError(error);
    }
  }

  async updateProfile(
    id: string,
    data: Horse,
    onProgress?: UploadProgressCallback
  ): Promise<Horse> {
    try {
      const formData = await this.prepareFormData(data);
      
      const response = await axios.put<Horse>(
        `${API_URL}/api/horses/${id}`,
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
      throw this.handleError(error);
    }
  }

  async recordView(horseId: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/api/horses/${horseId}/view`);
    } catch (error) {
      // Silently fail view recording as it's not critical
      console.error('Failed to record view:', error);
    }
  }

  private async prepareFormData(data: Horse): Promise<FormData> {
    const formData = new FormData();

    // Convert date string or Date object to ISO string
    const formatDate = (date: string | Date): string => {
      if (date instanceof Date) {
        return date.toISOString();
      }
      // If it's already a string, return as is if it's ISO format
      // or create a new Date from it
      return new Date(date).toISOString();
    };

    // Add basic info
    // Clean and stringify the data before sending
    const cleanBasicInfo = {
      ...data.basicInfo,
      dateOfBirth: formatDate(data.basicInfo.dateOfBirth),
    };
    formData.append('basicInfo', JSON.stringify(cleanBasicInfo));


    // Clean and append media metadata
    const mediaMetadata = data.media.map((m, index) => ({
      type: m.type || 'image',
      caption: m.caption || '',
      isMain: index === 0
    }));
    formData.append('media', JSON.stringify(mediaMetadata));

    // Append media files
    data.media.forEach((mediaItem, index) => {
      if (mediaItem.file) {
        formData.append(`mediaFiles`, mediaItem.file);
      }
    });

    // Clean and append performance data
    const cleanPerformance = {
      ...data.performance,
      achievements: data.performance.achievements.map(a => ({
        ...a,
        date: new Date(a.date).toISOString()
      }))
    };
    formData.append('performance', JSON.stringify(cleanPerformance));

    // Clean and append health data
    const cleanHealth = {
      ...data.health,
      vaccinations: data.health.vaccinations.map(v => ({
        ...v,
        date: new Date(v.date).toISOString(),
        nextDueDate: new Date(v.nextDueDate).toISOString()
      })),
      medicalRecords: data.health.medicalRecords.map(r => ({
        ...r,
        date: new Date(r.date).toISOString()
      })),
      vetRecords: data.health.vetRecords.map(r => ({
        ...r,
        date: new Date(r.date).toISOString(),
        files: r.files.map(f => ({
          originalName: f instanceof File ? f.name : f.originalName
        }))
      }))
    };
    formData.append('health', JSON.stringify(cleanHealth));

    // Append vet files
    data.health.vetRecords.forEach(record => {
      record.files.forEach(file => {
        if (file instanceof File) {
          formData.append('vetFiles', file);
        }
      });
    });

    // Clean and append lineage data
    formData.append('lineage', JSON.stringify(data.lineage));

    return formData;
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

  // Utility method to create object URLs for files
  async getFilePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const horseService = HorseService.getInstance();