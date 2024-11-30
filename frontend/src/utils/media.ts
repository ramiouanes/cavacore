const getMediaUrl = (path?: string): string => {
    if (!path) return '/placeholder-image.jpg';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL}${path}`;
  };
  
  export { getMediaUrl };