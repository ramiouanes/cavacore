import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './styles/globals.css'
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupVerificationInterceptor } from './features/auth/interceptors/verification-interceptor';

setupVerificationInterceptor();

// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       staleTime: 5 * 60 * 1000, // 5 minutes
//       retry: 1,
//     },
//   },
// })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
