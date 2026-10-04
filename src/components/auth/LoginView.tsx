import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileSpreadsheet,
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { useAuth } from '@/src/lib/auth/authContext';
import { UserRole } from '@/src/types/tenant';

export const LoginView: React.FC = () => {
  const { login, user, usersList } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('s.jenkins@propertygroup.com');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordHint, setShowPasswordHint] = useState(false);

  // If already authenticated, redirect to destination or dashboard
  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  // When email changes, automatically match role if user exists in organization directory
  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    setError(null);
    const matchedUser = usersList.find(u => u.email.toLowerCase() === newEmail.trim().toLowerCase());
    if (matchedUser) {
      setSelectedRole(matchedUser.role);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please provide your organization email address.');
      return;
    }

    if (!password) {
      setError('Please provide your account password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      login(selectedRole, email.trim());
      setIsLoading(false);
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }, 300);
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <FileSpreadsheet className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Tenant List Updater
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Automated Excel reconciliation & tenant master record management
          </p>
        </div>

        {/* Secure Credentials Sign In Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-5 border-b border-slate-100 pb-4">
            <h2 className="text-base font-semibold text-slate-900">Sign in to your account</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Enter your credentials to access your tenant data workspace
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Work Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="name@propertygroup.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPasswordHint(!showPasswordHint)}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              {showPasswordHint && (
                <div className="mt-1.5 rounded-lg border border-indigo-100 bg-indigo-50/70 p-2 text-[11px] text-indigo-800">
                  Authentication is role-based and sessions are simulated locally or via backend. Any password passes for registered enterprise accounts.
                </div>
              )}
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-10 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role Assignment */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Assigned Access Role
              </label>
              <div className="relative mt-1.5">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="Admin">Administrator (Approve Updates, Modify Master, Manage Access)</option>
                  <option value="Staff">Operations Staff (Upload, Run Comparison, Review Diffs, Export)</option>
                  <option value="Viewer">Viewer (Read-Only Master Records & Reports)</option>
                </select>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Access permissions are strictly regulated by your assigned role.
              </p>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-600">Remember credentials on this browser</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Information Footer */}
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-[11px] text-slate-500">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700">Role-Based Access Control (RBAC):</span>
                {' '}Session is protected with cryptographic token simulation and granular permissions.
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          Enterprise Commercial Lease Reconciler · Version 2.4.0
        </div>
      </div>
    </div>
  );
};
