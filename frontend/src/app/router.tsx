import { Suspense, lazy, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Login } from '@/pages/auth/Login';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '@/shared/components/layouts/MainLayout';

// Carga diferida por ruta: el propietario no descarga las páginas del veterinario
// (ni viceversa), lo que reduce el JS del arranque y acelera la primera carga.
const ReportFormPage = lazy(() => import('@/pages/owner/ReportFormPage').then(m => ({ default: m.ReportFormPage })));
const MyPetsPage = lazy(() => import('@/pages/owner/MyPetsPage').then(m => ({ default: m.MyPetsPage })));
const PetDetailsPage = lazy(() => import('@/pages/owner/PetDetailsPage').then(m => ({ default: m.PetDetailsPage })));
const PetHistoryPage = lazy(() => import('@/pages/owner/PetHistoryPage').then(m => ({ default: m.PetHistoryPage })));
const ProfilePage = lazy(() => import('@/pages/owner/ProfilePage').then(m => ({ default: m.ProfilePage })));
const FormResultPage = lazy(() => import('@/pages/owner/FormResultPage').then(m => ({ default: m.FormResultPage })));
const CompleteProfile = lazy(() => import('@/pages/auth/CompleteProfile').then(m => ({ default: m.CompleteProfile })));
const AcceptTermsPage = lazy(() => import('@/pages/auth/AcceptTermsPage').then(m => ({ default: m.AcceptTermsPage })));
const PolicyPage = lazy(() => import('@/pages/auth/PolicyPage').then(m => ({ default: m.PolicyPage })));
const AuthorizationPage = lazy(() => import('@/pages/auth/AuthorizationPage').then(m => ({ default: m.AuthorizationPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ClinicSelector = lazy(() => import('@/features/clinics/components/ClinicSelector').then(m => ({ default: m.ClinicSelector })));
const AlertsPage = lazy(() => import('@/pages/vet/AlertsPage').then(m => ({ default: m.AlertsPage })));
const VetDashboardPage = lazy(() => import('@/pages/vet/VetDashboardPage').then(m => ({ default: m.VetDashboardPage })));
const VetReportsPage = lazy(() => import('@/pages/vet/VetReportsPage').then(m => ({ default: m.VetReportsPage })));
const VetReportDetailPage = lazy(() => import('@/pages/vet/VetReportDetailPage').then(m => ({ default: m.VetReportDetailPage })));
const VetUsersPage = lazy(() => import('@/pages/vet/VetUsersPage').then(m => ({ default: m.VetUsersPage })));
const VetMonitoringsPage = lazy(() => import('@/pages/vet/VetMonitoringsPage').then(m => ({ default: m.VetMonitoringsPage })));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
  </div>
);

// Envuelve un elemento diferido en un límite de Suspense con spinner de marca.
const s = (el: ReactNode) => <Suspense fallback={<PageLoader />}>{el}</Suspense>;

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/forgot-password',
    element: s(<ForgotPasswordPage />),
  },
  {
    element: <ProtectedRoute />,
    children:[
      {
        path: '/select-clinic',
        element: s(<ClinicSelector />),
      },
      {
        path: '/accept-terms',
        element: s(<AcceptTermsPage />),
      },
      {
        path: '/complete-profile',
        element: s(<CompleteProfile />),
      },
      {
        path: '/politica-datos',
        element: s(<PolicyPage />),
      },
      {
        path: '/autorizacion-datos',
        element: s(<AuthorizationPage />),
      },
      {
        path: '/alerts',
        element: s(<AlertsPage />),
      },
      {
        element: <MainLayout />,
        children:[
          { path: '/', element: s(<MyPetsPage />) },
          { path: '/pets/:id', element: s(<PetDetailsPage />) },
          { path: '/report/:monitoringId', element: s(<ReportFormPage />) },
          { path: '/history/:monitoringId', element: s(<PetHistoryPage />) },
          { path: '/profile', element: s(<ProfilePage />) },
          { path: '/form-result', element: s(<FormResultPage />) },
          { path: '/vet/dashboard', element: s(<VetDashboardPage />) },
          { path: '/vet/reports', element: s(<VetReportsPage />) },
          { path: '/vet/reports/:id', element: s(<VetReportDetailPage />) },
          { path: '/vet/users', element: s(<VetUsersPage />) },
          { path: '/vet/monitorings', element: s(<VetMonitoringsPage />) },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
