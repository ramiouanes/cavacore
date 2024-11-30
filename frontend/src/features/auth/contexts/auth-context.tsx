import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, UserResponse, AuthResponse } from '../services/auth-service';

interface AuthContextType {
  user: UserResponse | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<AuthResponse>;
  logout: () => void;
  loading: boolean;
  isVerified: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const user = await authService.getCurrentUser();
          // console.log('Current user fetched:', user);
          setUser(user);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Error fetching current user:', error);
          authService.logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        // console.log('Fetched user:', user);
        setUser(user);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching current user:', error);
        setUser(null);
        setLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      // console.log('Login response:', response);
      if (response.user) {
        setUser(response.user);
        setIsLoggedIn(true);
        localStorage.setItem('token', response.accessToken);
      }    
      setLoading(false);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      throw error;
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const response = await authService.register({ email, password, firstName, lastName });
    setUser(response.user);
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsLoggedIn(false);    
  };

  const value: AuthContextType = {
    user,
    loading,
    isLoggedIn,
    isVerified: user?.verificationStatus === "verified",
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};