// src/features/horse-profile/services/horse-profile-service.ts

import axios from 'axios';
import { environment } from '../../../config/environment';
import type { HorseProfileData } from '../types';

export class HorseProfileService {
  private static instance: HorseProfileService;
  private constructor() {}

  static getInstance(): HorseProfileService {
    if (!HorseProfileService.instance) {
      HorseProfileService.instance = new HorseProfileService();
    }
    return HorseProfileService.instance;
  }

  async createProfile(data: HorseProfileData): Promise<any> {
    const formData = new FormData();

    // Add basic info
    formData.append('basicInfo', JSON.stringify(data.basicInfo));
    
    // Add media files
    data.media.forEach((file, index) => {
      formData.append(`media_${index}`, file.file);
    });

    // Add other data
    formData.append('performance', JSON.stringify(data.performance));
    formData.append('health', JSON.stringify(data.health));
    formData.append('lineage', JSON.stringify(data.lineage));

    const response = await axios.post(
      `${environment.apiUrl}/api/horses`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  async getProfile(id: string): Promise<HorseProfileData> {
    const response = await axios.get(`${environment.apiUrl}/api/horses/${id}`);
    return response.data;
  }

  async updateProfile(id: string, data: Partial<HorseProfileData>): Promise<any> {
    const response = await axios.put(
      `${environment.apiUrl}/api/horses/${id}`,
      data
    );
    return response.data;
  }
}

export const horseProfileService = HorseProfileService.getInstance();