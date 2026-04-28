import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Login } from '@/pages/auth/Login';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '@/shared/components/layouts/MainLayout';
import { MyPetsPage } from '@/pages/owner/MyPetsPage';
import { PetDetailsPage } from '@/pages/owner/PetDetailsPage';
import { ReportFormPage } from '@/pages/owner/ReportFormPage';
import { PetHistoryPage } from '@/pages/owner/PetHistoryPage';
import { CompleteProfile } from '@/pages/auth/CompleteProfile';
import { AcceptTermsPage } from '@/pages/auth/AcceptTermsPage';
import { ProfilePage } from '@/pages/owner/ProfilePage'; 

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    element: <ProtectedRoute />,
    children:[
      {
        path: '/accept-terms',
        element: <AcceptTermsPage />,
      },
      {
        path: '/complete-profile',
        element: <CompleteProfile />,
      },
      {
        element: <MainLayout />,
        children:[
          { path: '/', element: <MyPetsPage /> },
          { path: '/pets/:id', element: <PetDetailsPage /> },
          { path: '/report/:monitoringId', element: <ReportFormPage /> },
          { path: '/history/:monitoringId', element: <PetHistoryPage /> },
          { path: '/profile', element: <ProfilePage /> }, 
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);