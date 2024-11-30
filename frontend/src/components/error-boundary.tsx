// frontend/src/components/error-boundary.tsx
import { useRouteError } from 'react-router-dom';

export function ErrorBoundary() {
  const error = useRouteError();
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong</h1>
        <pre className="text-sm bg-gray-100 p-4 rounded">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    </div>
  );
}