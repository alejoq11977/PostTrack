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
import { ClinicSelector } from '@/features/clinics/components/ClinicSelector';
import { PolicyPage } from '@/pages/auth/PolicyPage';
import { AuthorizationPage } from '@/pages/auth/AuthorizationPage';
import { AlertsPage } from '@/pages/vet/AlertsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    element: <ProtectedRoute />,
    children:[
      {
        path: '/select-clinic',
        element: <ClinicSelector />,
      },
      {
        path: '/accept-terms',
        element: <AcceptTermsPage />,
      },
      {
        path: '/complete-profile',
        element: <CompleteProfile />,
      },
      {
        path: '/politica-datos',
        element: <PolicyPage />,
      },
      {
        path: '/autorizacion-datos',
        element: <AuthorizationPage />,
      },
      {
        path: '/alerts',
        element: <AlertsPage />,
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