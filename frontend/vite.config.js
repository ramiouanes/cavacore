import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: [
            { find: '@', replacement: path.resolve(__dirname, 'src') }
        ]
    },
    publicDir: 'public', 
    server: {
        host: '0.0.0.0', // Allow access from other devices
        port: 5173,      // Optional: Specify a port
      },
});
