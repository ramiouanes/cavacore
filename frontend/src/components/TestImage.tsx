import { useState } from 'react';

export function TestImage() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2>Direct Image Tag:</h2>
        <img 
          src="/hero.jpg" 
          alt="Test" 
          className="w-96 h-64 object-cover"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            console.error('Image failed to load:', e);
            setError(true);
          }}
        />
        {imageLoaded && <p className="text-green-500">Image loaded successfully!</p>}
        {error && <p className="text-red-500">Image failed to load</p>}
      </div>

      <div>
        <h2>Background Image:</h2>
        <div 
          className="w-96 h-64 bg-center bg-cover" 
          style={{ backgroundImage: 'url(/hero.jpg)' }}
        />
      </div>

      <div>
        {/* Debug info */}
        <h3>Debug Information:</h3>
        <pre className="bg-gray-100 p-2 rounded">
          {JSON.stringify({
            publicUrl: import.meta.env.VITE_PUBLIC_URL || '/',
            mode: import.meta.env.MODE,
            base: import.meta.env.BASE_URL,
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

