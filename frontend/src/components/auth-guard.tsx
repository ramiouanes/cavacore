// src/components/auth-guard.tsx

import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, useMatches } from 'react-router-dom';
import { useAuth } from '@/features/auth/contexts/auth-context';
import { useDealProfileForm } from '@/features/deals/hooks/forms/use-deal-profile-form';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface RouteHandle {
    crumb?: string | ((data: any) => string);
    clearFormOnExit?: boolean;
  }

  export function AuthGuard() {
    // const navigate = useNavigate();
    // const location = useLocation();
    const matches = useMatches();
    const { user, loading: authLoading } = useAuth();
    const { clearFormData } = useDealProfileForm();

    // Handle form cleanup on navigation based on route config
    useEffect(() => {
        const currentMatch = matches[matches.length - 1];
        // Type assertion to handle the route handle type
        const handle = currentMatch?.handle as RouteHandle | undefined;
        
        if (handle?.clearFormOnExit) {
          return () => {
            clearFormData();
          };
        }
      }, [matches, clearFormData]);
    
      if (authLoading) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size="lg" />
          </div>
        );
      }
    
      if (!user) {
        return null;
      }
    
      return <Outlet />;
    }
  

    export interface AuthGuardProps {
        requireAdmin?: boolean;
        children: React.ReactNode;
      }
      
      export function ComponentAuthGuard({ requireAdmin = false, children }: AuthGuardProps) {
        const { user, loading } = useAuth();
        const navigate = useNavigate();
        const location = useLocation();
  
      
        useEffect(() => {
          if (!loading && !user) {
            navigate('/login', {
              state: { returnUrl: location.pathname }
            });
          }
      
          if (!loading && requireAdmin && user?.role !== 'admin') {
            navigate('/deals');
          }
        }, [user, loading, requireAdmin, navigate, location]);
      
        if (loading) {
          return (
            <div className="flex items-center justify-center p-4">
              <LoadingSpinner size="sm" />
            </div>
          );
        }
      
        if (!user || (requireAdmin && user.role !== 'admin')) {
          return null;
        }
      
        return <>{children}</>;
      }
      