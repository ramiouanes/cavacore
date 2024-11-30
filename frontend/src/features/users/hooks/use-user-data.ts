import { useState, useEffect } from 'react';
import { userService } from '../services/user-service';
import { User } from '../types/user.types';

export function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

//   console.log('userId', userId);

  useEffect(() => {

    // console.log('useEffect triggered with userId:', userId);
    const fetchUser = async () => {
      try {
        // console.log('Making API call for userId:', userId);
      const userData = await userService.findById(userId);
    //   console.log('API response:', userData);
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }

    return () => {
        // Cleanup if needed
        // console.log('useEffect cleanup for userId:', userId);
      };
  }, [userId]);

  return { user, isLoading, error };
}