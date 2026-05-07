import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { ClinicProvider } from '@/features/clinics/context/ClinicContext';
import { router } from '@/app/router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ClinicProvider>
        <RouterProvider router={router} />
      </ClinicProvider>
    </AuthProvider>
  </StrictMode>
);