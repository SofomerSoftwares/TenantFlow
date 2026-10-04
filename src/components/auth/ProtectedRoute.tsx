import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Shield, Lock, RotateCcw } from 'lucide-react';
import { useAuth, Permission } from '@/src/lib/auth/authContext';
import { UserRole } from '@/src/types/tenant';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: Permission;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission
}) => {
  const { user, switchRole, hasPermission } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isRoleAllowed = allowedRoles ? allowedRoles.includes(user.role) : true;
  const isPermissionAllowed = requiredPermission ? hasPermission(requiredPermission) : true;

  if (!isRoleAllowed || !isPermissionAllowed) {
    const requiredRoleName = allowedRoles ? allowedRoles.join(' or ') : 'Administrator';

    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Lock className="h-7 w-7" />
          </div>

          <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
            Access Restricted
          </h2>

          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            This module requires <strong>{requiredRoleName}</strong> permissions. You are currently signed in as{' '}
            <span className="font-bold text-slate-800">{user.name}</span> with the{' '}
            <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 font-bold text-indigo-700">
              {user.role}
            </span>{' '}
            role.
          </p>

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-left text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-slate-400" />
              <span>Role Permissions:</span>
            </div>
            {user.role === 'Viewer' && (
              <div className="text-[11px] text-slate-500">
                Viewers have read-only access to master tenants, change reports, and logs. They cannot upload files, modify records, or apply reconciliations.
              </div>
            )}
            {user.role === 'Staff' && (
              <div className="text-[11px] text-slate-500">
                Staff can upload, compare, review, and export files, but cannot commit changes directly to the master database without Administrator approval.
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            {/* Quick Switch Button for testing */}
            <button
              onClick={() => switchRole('Admin')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Switch to Administrator Role (Test Mode)</span>
            </button>

            <Link
              to="/dashboard"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
