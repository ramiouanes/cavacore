
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { DataProvider } from './providers/DataProvider';
import { AuthProvider } from '@/features/auth/contexts/auth-context';

export function App() {
  return (
    <DataProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </DataProvider>
  );
}

export default App;