// frontend/src/features/auth/interceptors/verification-interceptor.ts

import axios from 'axios';

export function setupVerificationInterceptor() {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 403 && 
          error.response?.data?.message === 'Email verification required') {
        window.location.href = '/verify-email';
        return Promise.reject(error);
      }
      return Promise.reject(error);
    }
  );
}