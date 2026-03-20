import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Login } from '@/pages/auth/Login';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '@/shared/components/layouts/MainLayout';
import { MyPetsPage } from '@/pages/owner/MyPetsPage';
import { PetDetailsPage } from '@/pages/owner/PetDetailsPage';
import { ReportFormPage } from '@/pages/owner/ReportFormPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
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
        ]
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
]);