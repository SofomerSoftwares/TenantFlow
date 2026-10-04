import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  GitCompare,
  CheckSquare,
  Users,
  FolderKanban,
  FileBarChart,
  History,
  Settings,
  Sparkles,
  ChevronRight,
  Lock,
  Shield,
  ShieldAlert
} from 'lucide-react';
import { useComparison } from '@/src/context/ComparisonContext';
import { useAuth } from '@/src/lib/auth/authContext';
import { UserRole } from '@/src/types/tenant';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { comparisonItems, summary } = useComparison();
  const { user } = useAuth();

  const navItems: {
    path: string;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
    requiredRoles?: UserRole[];
  }[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      path: '/upload',
      label: 'Upload & Reconcile',
      icon: UploadCloud,
      requiredRoles: ['Admin', 'Staff']
    },
    {
      path: '/compare',
      label: 'Compare Records',
      icon: GitCompare,
      badge: summary ? summary.totalNew : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-800',
      requiredRoles: ['Admin', 'Staff']
    },
    {
      path: '/review',
      label: 'Review Changes',
      icon: CheckSquare,
      badge: comparisonItems.length > 0 ? (summary ? summary.updatedCount + summary.newCount + summary.missingCount : undefined) : undefined,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      path: '/tenants',
      label: 'Master Tenants',
      icon: Users
    },
    {
      path: '/tenant-lists',
      label: 'Tenant Catalogs',
      icon: FolderKanban
    },
    {
      path: '/reports',
      label: 'Change Reports',
      icon: FileBarChart
    },
    {
      path: '/history',
      label: 'Update History',
      icon: History
    },
    {
      path: '/settings',
      label: 'Settings & Rules',
      icon: Settings,
      requiredRoles: ['Admin']
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Workflow Steps Indicator if comparing */}
            {summary && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                  <span>Reconciliation Active</span>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="mt-1 text-[11px] text-indigo-700 leading-tight">
                  {summary.newCount} New · {summary.updatedCount} Updated · {summary.missingCount} Missing
                </div>
                <Link
                  to="/review"
                  onClick={onCloseMobile}
                  className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-md bg-indigo-600 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-indigo-700"
                >
                  <span>Open Review Table</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {/* Navigation Links using NavLink */}
            <div>
              <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Main Menu
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isRestricted = item.requiredRoles && user && !item.requiredRoles.includes(user.role);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-xs'
                            : isRestricted
                            ? 'text-slate-400 hover:bg-slate-50'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`h-4 w-4 transition ${
                                isActive ? 'text-white' : isRestricted ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-700'
                              }`}
                            />
                            <span>{item.label}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isRestricted && (
                              <span className="flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
                                <Lock className="h-2.5 w-2.5" />
                                <span>{item.requiredRoles?.[0]}</span>
                              </span>
                            )}

                            {item.badge !== undefined && !isRestricted && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                  isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* User Role Card & Scope */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            {user && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-indigo-600" />
                    <span className="font-bold text-slate-900">{user.role} Role</span>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      user.role === 'Admin'
                        ? 'bg-indigo-100 text-indigo-800'
                        : user.role === 'Staff'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {user.role === 'Admin' ? 'Full Access' : user.role === 'Staff' ? 'Operational' : 'Read Only'}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500 leading-tight">
                  {user.role === 'Admin'
                    ? 'Can approve batches, manage master database, edit settings, and resolve discrepancies.'
                    : user.role === 'Staff'
                    ? 'Can upload, compare, review, and export. Approval requires Administrator.'
                    : 'Read-only access to tenant lists, change history, and exportable reports.'}
                </div>
              </div>
            )}

            <div className="rounded-lg bg-slate-50/60 p-2.5 text-[11px] text-slate-500 flex items-center justify-between">
              <span>VLOOKUP Automator</span>
              <span className="font-mono text-[10px] text-slate-400">v2.4 RBAC</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
