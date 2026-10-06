import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  User,
  ShieldCheck,
  ChevronDown,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/src/lib/auth/authContext';
import { useComparison } from '@/src/context/ComparisonContext';
import { UserRole } from '@/src/types/tenant';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const { resetComparisonWorkflow, navigate } = useComparison();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link
          to="/dashboard"
          className="flex cursor-pointer items-center gap-2.5 font-semibold text-slate-900 tracking-tight"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 leading-tight">Tenant List Updater</div>
            <div className="text-xs text-slate-500 font-normal">Automated Excel Reconciliation</div>
          </div>
        </Link>
      </div>

      {/* Action Controls & User Account */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* User Role Switcher */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-800 transition hover:bg-slate-100"
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                  user.avatarColor || 'bg-slate-800'
                }`}
              >
                {user.avatar || user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-semibold leading-tight text-slate-900">{user.name}</div>
                <div className="text-[10px] text-slate-500 font-normal">
                  Role: <span className="font-medium text-indigo-600">{user.role}</span>
                </div>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setRoleDropdownOpen(false)}
                />
                <div className="absolute right-0 z-50 mt-1 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                  {/* Profile Link */}
                  <Link
                    to="/profile"
                    onClick={() => setRoleDropdownOpen(false)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 hover:bg-indigo-50 hover:text-indigo-900 transition"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-600" />
                      <span>My Profile & Team</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">View →</span>
                  </Link>

                  <div className="my-1 border-t border-slate-100" />

                  <div className="px-2.5 py-1.5 text-[11px] text-slate-500 leading-tight">
                    <div className="font-semibold text-slate-700 mb-0.5">Role: {user.role}</div>
                    {user.role === 'Admin'
                      ? 'Admin: Full access to approve, upload, modify master records and manage roles'
                      : user.role === 'Staff'
                      ? 'Staff: Can upload, compare, review, and export records'
                      : 'Viewer: Read-only access to records and reports'}
                  </div>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => {
                      logout();
                      navigate('login');
                      setRoleDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
