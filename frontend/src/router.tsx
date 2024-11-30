// frontend/src/router.tsx
import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import { MainLayout } from './layouts/main-layout';
import { AdminLayout } from './features/admin/components/admin-layout';
import { useAuth } from '@/features/auth/contexts/auth-context';
import { useEffect, useState } from 'react';

// Page Imports
import { LoginPage } from './features/auth/pages/login-page';
import { RegisterPage } from './features/auth/pages/register-page';
import { VerifyEmailPage } from './features/auth/pages/verify-email-page';
import { HorsesPage } from './features/horses/pages/horses-page';
import { CreateHorsePage } from '@/features/horses/pages/create-horse-page';
import { ErrorBoundary } from './components/error-boundary';
import AdminDashboard from '@/features/admin/components/admin-dashboard';
import UserList from '@/features/admin/components/user-list';
import UserDetails from '@/features/admin/components/user-details';
import HorseList from '@/features/admin/components/horse-list';
import HorseDetails from '@/features/admin/components/horse-details';
import { HomePage } from "@/pages/home";
import { HorseDetailsPage } from './features/horses/pages/horse-details-page';

import { DealListPage } from '@/features/deals/pages/deals-list-page';
import { DealDetailPage } from '@/features/deals/pages/deal-detail-page';
// import { DealSearchPage } from '@/features/deals/pages/DealSearchPage';
import { DealWizardContainer } from '@/features/deals/components/deal-wizard-container';
import { CreateDealPage } from '@/features/deals/pages/create-deal-page';
import { RouteObject } from 'react-router-dom';
import { DealProvider } from '@/features/deals/context/deal-context';
import { AuthGuard } from '@/components/auth-guard';
import { HorseSearchProvider } from './features/horses/contexts/horse-search-context';



// Route Guards
const ProtectedRoute = ({ 
  children, 
  adminOnly = false 
}: { 
  children: React.ReactNode;
  adminOnly?: boolean;
}) => {
  const { user, isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn) {
        navigate('/login');
      } else if (adminOnly && user?.role !== 'admin') {
        navigate('/horses');
      } else if (!adminOnly && user?.role == 'admin') {
        navigate('/admin');
      }
    }
  }, [loading, isLoggedIn, user, adminOnly, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!isLoggedIn) return null;
  if (adminOnly && user?.role !== 'admin') return null;
  return children;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/horses" />;
  }
  
  return <>{children}</>;
};


const HomeRedirect = () => {
  const { user, loading } = useAuth();
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setRedirect(true), 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || !redirect) return <div>Loading...</div>;

  if (user?.role === 'admin') return <Navigate to="/admin" />;
  return <Navigate to="/horses" />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      // Public Routes
      { path: '/', element: <HomeRedirect /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
      { path: 'verify-email/:token', element: <VerifyEmailPage /> },

      // Protected User Routes
      {
        path: 'horses',
        children: [
          { 
            index: true, 
            element: <ProtectedRoute><HorsesPage /></ProtectedRoute> 
          },
          {
            path: 'create',
            element: <ProtectedRoute><CreateHorsePage /></ProtectedRoute>
          },
          {
            path: ':id',
            element: <ProtectedRoute><HorseDetailsPage /></ProtectedRoute>
          },
          {
            path: ':id/edit',
            element: <ProtectedRoute><div>Edit Horse Page</div></ProtectedRoute>
          }
        ]
      },
      {
        path: 'deals',
        children: [
          {
            index: true,
            element: <ProtectedRoute><DealListPage /></ProtectedRoute>
          },
          {
            path: 'create',
            element: <ProtectedRoute><CreateDealPage /></ProtectedRoute>
          },
          // {
          //   path: 'search',
          //   element: <ProtectedRoute><DealSearchPage /></ProtectedRoute>
          // },
          {
            path: ':id',
            element: <ProtectedRoute><DealDetailPage /></ProtectedRoute>
          },
          {
            path: ':id/edit',
            element: <ProtectedRoute>
            <HorseSearchProvider>
              <DealProvider>
                <DealWizardContainer/>
              </DealProvider>
            </HorseSearchProvider>
          </ProtectedRoute>
          }
        ]
      },
      {
        path: 'profile',
        element: <ProtectedRoute><div>Profile Page</div></ProtectedRoute>
      },
      {
        path: 'messages',
        element: <ProtectedRoute><div>Messages Page</div></ProtectedRoute>
      },
      {
        path: 'favorites',
        element: <ProtectedRoute><div>Favorites Page</div></ProtectedRoute>
      },
      {
        path: 'settings',
        element: <ProtectedRoute><div>Settings Page</div></ProtectedRoute>
      },
    ]
  },
  // Admin Routes in separate layout
  {
    path: 'admin',
    element: <AdminLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <AdminRoute><AdminDashboard /></AdminRoute>
      },
      {
        path: 'users',
        element: <AdminRoute><UserList /></AdminRoute>
      },
      {
        path: 'users/:id',
        element: <AdminRoute><UserDetails /></AdminRoute>
      },
      {
        path: 'horses',
        element: <AdminRoute><HorseList /></AdminRoute>
      },
      {
        path: 'horses/:id',
        element: <AdminRoute><HorseDetails /></AdminRoute>
      }
    ]
  }
]);