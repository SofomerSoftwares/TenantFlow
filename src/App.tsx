import React, { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  Link
} from 'react-router-dom';
import { AuthProvider, useAuth } from '@/src/lib/auth/authContext';
import { ComparisonProvider } from '@/src/context/ComparisonContext';
import { Header } from '@/src/components/layout/Header';
import { Sidebar } from '@/src/components/layout/Sidebar';
import { DashboardView } from '@/src/components/dashboard/DashboardView';
import { UploadView } from '@/src/components/upload/UploadView';
import { CompareView } from '@/src/components/comparison/CompareView';
import { ReviewView } from '@/src/components/review/ReviewView';
import { TenantsView } from '@/src/components/tenants/TenantsView';
import { TenantDetailView } from '@/src/components/tenants/TenantDetailView';
import { TenantListsView } from '@/src/components/tenant-lists/TenantListsView';
import { ReportsView } from '@/src/components/reports/ReportsView';
import { HistoryView } from '@/src/components/history/HistoryView';
import { SettingsView } from '@/src/components/settings/SettingsView';
import { LoginView } from '@/src/components/auth/LoginView';
import { ProtectedRoute } from '@/src/components/auth/ProtectedRoute';
import { ChevronRight, Home } from 'lucide-react';

const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Protected route check
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path.startsWith('/tenants/')) {
      const code = path.split('/')[2];
      return (
        <>
          <Link to="/tenants" className="hover:text-slate-800">
            Master Tenants
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <span className="font-semibold text-slate-800">Tenant {code}</span>
        </>
      );
    }

    const titleMap: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/upload': 'Upload & Reconcile',
      '/compare': 'Comparison Summary',
      '/review': 'Review Changes',
      '/tenants': 'Master Tenants',
      '/tenant-lists': 'Tenant Catalogs',
      '/reports': 'Change Reports',
      '/history': 'Update History',
      '/settings': 'Settings & Rules'
    };

    const title = titleMap[path] || 'Overview';
    return <span className="font-semibold text-slate-800">{title}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          isMobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
            <Link to="/dashboard" className="flex items-center gap-1 text-slate-500 hover:text-slate-800">
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            {getBreadcrumbs()}
          </nav>

          {/* Render Active Route View via React Router Outlet */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ComparisonProvider>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<LoginView />} />

            {/* Authenticated Dashboard & App Routes */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardView />} />
              <Route
                path="upload"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
                    <UploadView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="compare"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
                    <CompareView />
                  </ProtectedRoute>
                }
              />
              <Route path="review" element={<ReviewView />} />
              <Route path="tenants" element={<TenantsView />} />
              <Route path="tenants/:tenantCode" element={<TenantDetailView />} />
              <Route path="tenant-lists" element={<TenantListsView />} />
              <Route path="reports" element={<ReportsView />} />
              <Route path="history" element={<HistoryView />} />
              <Route
                path="settings"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <SettingsView />
                  </ProtectedRoute>
                }
              />
              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </ComparisonProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
