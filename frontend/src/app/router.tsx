import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Login } from '@/pages/auth/Login';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '@/shared/components/layouts/MainLayout';
import { MyPetsPage } from '@/pages/owner/MyPetsPage';
import { PetDetailsPage } from '@/pages/owner/PetDetailsPage';
import { ReportFormPage } from '@/pages/owner/ReportFormPage';
import { PetHistoryPage } from '@/pages/owner/PetHistoryPage';
import { CompleteProfile } from '@/pages/auth/CompleteProfile';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/complete-profile',
    element:  <CompleteProfile />,
  },
  {
    element: <ProtectedRoute />,
    children:[
      {
        element: <MainLayout />,
        children:[
          {
            path: '/', // Ruta raíz: Lista de Mascotas (o pacientes si es vet)
            element: <MyPetsPage />,
          },
          {
            path: '/pets/:id', // Pantalla de detalle de la mascota
            element: <PetDetailsPage />,
          },
          { path: '/report/:monitoringId', element: <ReportFormPage />, },
          {
            path: '/history/:monitoringId', 
            element: <PetHistoryPage />,
          },
        ]
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
]);