import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  User,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Download,
  Play,
  RotateCcw,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/src/lib/auth/authContext';
import { useComparison } from '@/src/context/ComparisonContext';
import {
  downloadDemoMasterExcel,
  downloadDemoNewSystemExcel
} from '@/src/lib/excel/demoDataGenerator';
import { UserRole } from '@/src/types/tenant';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const { user, switchRole, logout } = useAuth();
  const { loadDemoComparison, resetComparisonWorkflow, navigate } = useComparison();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [sampleDropdownOpen, setSampleDropdownOpen] = useState(false);

  const roles: UserRole[] = ['Admin', 'Staff', 'Viewer'];

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
        {/* 1-Click Load Demo Button */}
        <button
          onClick={() => {
            loadDemoComparison();
            navigate('compare');
          }}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100/80 hover:border-indigo-300"
          title="Load 100 realistic tenants and sample comparison changes in 1 click"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          <span>Load Demo Comparison</span>
        </button>

        {/* Download Sample Files Dropdown */}
        <div className="relative">
          <button
            onClick={() => setSampleDropdownOpen(!sampleDropdownOpen)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden md:inline">Sample Files</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {sampleDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setSampleDropdownOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
                <div className="px-2.5 py-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Download Test Files
                </div>
                <button
                  onClick={() => {
                    downloadDemoMasterExcel();
                    setSampleDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="font-medium">Master List (100 Tenants)</div>
                    <div className="text-[10px] text-slate-500">tenant_master_sample.xlsx</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    downloadDemoNewSystemExcel();
                    setSampleDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                  <div>
                    <div className="font-medium">New System Export</div>
                    <div className="text-[10px] text-slate-500">With 12 new, 20 updated, 10 missing</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Role Switcher */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-800 transition hover:bg-slate-100"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-white">
                {user.avatar || user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-semibold leading-tight text-slate-900">{user.name}</div>
                <div className="text-[10px] text-slate-500 font-normal">Role: <span className="font-medium text-indigo-600">{user.role}</span></div>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setRoleDropdownOpen(false)}
                />
                <div className="absolute right-0 z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
                  <div className="px-2.5 py-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                    Switch Test Role
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r);
                        setRoleDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                        user.role === r
                          ? 'bg-indigo-50 text-indigo-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`h-3.5 w-3.5 ${user.role === r ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span>{r}</span>
                      </div>
                      {user.role === r && (
                        <span className="text-[10px] text-indigo-600">Active</span>
                      )}
                    </button>
                  ))}
                  <div className="my-1 border-t border-slate-100" />
                  <div className="px-2.5 py-1 text-[10px] text-slate-500 leading-tight">
                    {user.role === 'Admin'
                      ? 'Admin: Full access to approve, upload, modify database'
                      : user.role === 'Staff'
                      ? 'Staff: Can upload, compare, review, export'
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
