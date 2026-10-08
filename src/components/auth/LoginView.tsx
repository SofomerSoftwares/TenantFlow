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
  Building2,
  User as UserIcon,
  Sparkles,
  AlertCircle,
  Check,
  X,
  ExternalLink,
  HelpCircle,
  Copy,
  Globe
} from 'lucide-react';
import { useAuth } from '@/src/lib/auth/authContext';
import { UserRole } from '@/src/types/tenant';

export const LoginView: React.FC = () => {
  const {
    loginWithEmail,
    signUpWithEmail,
    loginWithGoogle,
    sendPasswordReset,
    login,
    user
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Staff');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerDisabledNotice, setProviderDisabledNotice] = useState(false);
  const [unauthorizedDomainNotice, setUnauthorizedDomainNotice] = useState<{ domain: string } | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Forgot password modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  // If already authenticated, redirect to destination or dashboard
  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleCopyDomain = async (domainToCopy: string) => {
    try {
      await navigator.clipboard.writeText(domainToCopy);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    } catch {
      // fallback
    }
  };

  const parseFirebaseError = (err: any): string => {
    const code = err?.code || '';
    const message = err?.message || '';

    if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
      setUnauthorizedDomainNotice({ domain: currentHost });
      return `Domain "${currentHost}" is not authorized for Google Sign-In in Firebase project chrome-acumen-671nt. Authorize it in Firebase Console or use Instant Admin Access below.`;
    }
    if (code === 'auth/operation-not-allowed' || message.includes('operation-not-allowed')) {
      setProviderDisabledNotice(true);
      return 'Firebase Authentication provider disabled: Email/Password sign-in is not yet enabled in the Firebase Console for project chrome-acumen-671nt. Please use "Continue with Google" (enabled by default) or Quick Demo Access below.';
    }
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'Invalid email or password. You can also create a new account, use "Continue with Google", or use Quick Demo Sign-In.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'This email address is already registered. Please sign in instead.';
    }
    if (code === 'auth/weak-password') {
      return 'Password should be at least 6 characters long.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google sign-in popup was cancelled.';
    }
    if (code === 'auth/popup-blocked') {
      return 'Google sign-in popup was blocked by browser. Please allow popups or use Quick Demo Access.';
    }
    return err?.message || 'Authentication error. Please try again.';
  };

  const handleQuickDemoLogin = (demoRole: UserRole, customEmail?: string) => {
    login(demoRole, customEmail);
    navigate('/dashboard', { replace: true });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!email.trim() || !password) {
      setError('Please provide email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
    } catch (err: any) {
      setError(parseFirebaseError(err));
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Please provide email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await signUpWithEmail(email.trim(), password, name.trim());
    } catch (err: any) {
      setError(parseFirebaseError(err));
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(parseFirebaseError(err));
      setIsGoogleLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    setResetMessage(null);
    try {
      await sendPasswordReset(resetEmail.trim());
      setSuccessNotice('Password reset link sent! Please check your inbox.');
      setIsResetModalOpen(false);
    } catch (err: any) {
      setResetMessage(parseFirebaseError(err));
    } finally {
      setResetLoading(false);
    }
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
          {/* Mode Tabs: Sign In / Create Account */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 w-full">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>

          {unauthorizedDomainNotice ? (
            <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50/95 p-4 text-xs text-amber-950 shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <Globe className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-amber-950 text-sm">Domain Authorization Required</span>
                      <span className="font-mono text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-semibold">auth/unauthorized-domain</span>
                    </div>
                    <p className="text-[11.5px] text-amber-800 leading-relaxed">
                      Google OAuth requires this hosting domain to be registered in the <strong>Authorized Domains</strong> whitelist in Firebase Console (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-semibold">chrome-acumen-671nt</code>).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUnauthorizedDomainNotice(null)}
                  className="text-amber-500 hover:text-amber-800 p-1 -mr-1 -mt-1 cursor-pointer"
                  title="Dismiss notice"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Copy domain box */}
              <div className="rounded-lg border border-amber-200 bg-white p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-700">Domain to register in Firebase:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyDomain(unauthorizedDomainNotice.domain)}
                    className="inline-flex items-center gap-1 font-bold text-xs text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                  >
                    {copiedDomain ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Domain</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-xs bg-slate-50 border border-slate-200 text-slate-900 px-2.5 py-1.5 rounded-md break-all select-all flex items-center justify-between">
                  <span>{unauthorizedDomainNotice.domain}</span>
                </div>
              </div>

              {/* Instant Access Bypass */}
              <div className="pt-0.5 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-950 block">Instant Access (Bypass Domain Check):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('Admin', 'tesfuniguse18@gmail.com')}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 px-3 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Enter as Admin (tesfuniguse18)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('Staff', 'm.chen@fhc.gov.et')}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-white py-2 px-3 text-xs font-bold text-amber-900 hover:bg-amber-100/60 transition cursor-pointer"
                  >
                    <UserIcon className="h-4 w-4 text-emerald-600" />
                    <span>Enter as Lead Staff</span>
                  </button>
                </div>
              </div>

              {/* Instructions to authorize */}
              <div className="rounded-lg bg-white/80 border border-amber-200 p-2.5 text-[11px] text-amber-900 space-y-1">
                <div className="font-semibold text-amber-950 flex items-center justify-between">
                  <span>How to authorize in Firebase Console:</span>
                  <a
                    href="https://console.firebase.google.com/project/chrome-acumen-671nt/authentication/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-1 font-bold"
                  >
                    Firebase Auth Settings <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <ol className="list-decimal list-inside text-amber-800 text-[10.5px] space-y-0.5 leading-tight">
                  <li>Open the <strong>Firebase Auth Settings</strong> link above.</li>
                  <li>Scroll down to the <strong>Authorized domains</strong> section and click <strong>Add domain</strong>.</li>
                  <li>Paste <code className="font-mono bg-amber-100 px-1 rounded">{unauthorizedDomainNotice.domain}</code> and save.</li>
                </ol>
              </div>
            </div>
          ) : providerDisabledNotice ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 shadow-2xs space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-950 block">Email/Password Sign-In Disabled in Firebase</span>
                  <p className="mt-0.5 text-[11px] text-amber-800 leading-relaxed">
                    By default, this Firebase project (<code className="font-mono bg-amber-100 px-1 py-0.2 rounded font-semibold text-amber-900">chrome-acumen-671nt</code>) has only <strong>Google Sign-In</strong> enabled. Choose an option below to proceed:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-1.5 px-2.5 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isGoogleLoading ? 'Connecting...' : 'Sign In with Google'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin(email?.toLowerCase() === 'tesfuniguse18@gmail.com' ? 'Admin' : 'Staff', email || undefined)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-white py-1.5 px-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100/60 transition cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
                  <span>Use Quick Demo Session</span>
                </button>
              </div>

              <div className="rounded-lg bg-white/80 border border-amber-200 p-2 text-[10.5px] text-amber-900 space-y-1">
                <div className="font-semibold text-amber-950 flex items-center justify-between">
                  <span>To enable Email/Password permanently:</span>
                  <a
                    href="https://console.firebase.google.com/project/chrome-acumen-671nt/authentication/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-0.5 font-bold"
                  >
                    Firebase Console <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <p className="text-amber-800 leading-tight">
                  1. Open the Firebase Console link above &bull; 2. Click <strong>Email/Password</strong> &bull; 3. Turn on <strong>Enable</strong> and click <strong>Save</strong>.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : null}

          {successNotice && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2">
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer active:scale-[0.99]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGoogleLoading ? 'Connecting Google...' : 'Continue with Google'}</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-slate-400">
              <span className="bg-white px-2">or with Firebase email</span>
            </div>
          </div>

          {/* Form */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@fhc.gov.et"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setIsResetModalOpen(true);
                    }}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In via Firebase</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                <div className="relative mt-1">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Samuel Bekele"
                    className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="samuel@fhc.gov.et"
                    className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <div className="relative mt-1">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-10 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs text-indigo-950">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  <span>Initial Access Tier: Operations Staff</span>
                </div>
                <p className="mt-1 text-[11px] text-indigo-700 leading-relaxed">
                  New accounts are initialized as Staff. System roles and Administrator privileges are managed and assigned exclusively by authorized Administrators.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    <span>Creating Firebase Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Firebase Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Quick Demo Access Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>Instant Role Access (Quick Demo)</span>
            </div>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
              No Password Needed
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Instantly test the application with any pre-configured role to verify Form 01 approvals, VLOOKUP reconciliation, or tenant data:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('Admin', 'tesfuniguse18@gmail.com')}
              className="flex flex-col items-start p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 transition text-left cursor-pointer group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-indigo-950">Administrator</span>
                <Shield className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <span className="text-[10px] text-indigo-700 mt-1 font-medium truncate max-w-full">tesfuniguse18@gmail.com</span>
              <span className="text-[9.5px] text-slate-500 mt-0.5">Full System Access</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('Staff', 'm.chen@fhc.gov.et')}
              className="flex flex-col items-start p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300 transition text-left cursor-pointer group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-emerald-950">Operations Staff</span>
                <UserIcon className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <span className="text-[10px] text-emerald-700 mt-1 font-medium truncate max-w-full">Marcus Chen</span>
              <span className="text-[9.5px] text-slate-500 mt-0.5">Excel & VLOOKUP</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('Viewer', 'e.rostova@fhc.gov.et')}
              className="flex flex-col items-start p-2.5 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 transition text-left cursor-pointer group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-amber-950">Cadastral Viewer</span>
                <Eye className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <span className="text-[10px] text-amber-700 mt-1 font-medium truncate max-w-full">Elena Rostova</span>
              <span className="text-[9.5px] text-slate-500 mt-0.5">Audit & Read-Only</span>
            </button>
          </div>
        </div>

        {/* Security Information Footer */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-[11px] text-slate-500 text-center">
          <div className="flex items-center justify-center gap-1.5 text-slate-600 font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Secured with Firebase Authentication & Firestore Security Rules</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Reset Password</h3>
              <button
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetMessage(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your registered Firebase email address to receive a secure password reset link.
            </p>

            {resetMessage && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-900">
                {resetMessage}
              </div>
            )}

            <form onSubmit={handlePasswordResetSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@fhc.gov.et"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
