interface Environment {
  apiUrl: string;
  uploadMaxSize: number;
  allowedFileTypes: string[];
}

export const environment: Environment = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  uploadMaxSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf']
};