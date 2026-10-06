import React, { useState, useMemo } from 'react';
import {
  User as UserIcon,
  Shield,
  ShieldCheck,
  Mail,
  Phone,
  Building2,
  MapPin,
  Briefcase,
  Calendar,
  Check,
  Edit3,
  Users,
  UserPlus,
  Trash2,
  RotateCcw,
  Clock,
  Sparkles,
  Search,
  Globe,
  Bell,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Lock,
  ChevronRight,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/src/lib/auth/authContext';
import { User, UserRole, UserNotificationPreferences } from '@/src/types/tenant';
import { tenantDb } from '@/src/lib/database/tenantStore';

const AVATAR_COLOR_OPTIONS = [
  { id: 'bg-indigo-600', label: 'Indigo', hex: '#4f46e5' },
  { id: 'bg-emerald-600', label: 'Emerald', hex: '#059669' },
  { id: 'bg-teal-600', label: 'Teal', hex: '#0d9488' },
  { id: 'bg-blue-600', label: 'Blue', hex: '#2563eb' },
  { id: 'bg-purple-600', label: 'Purple', hex: '#9333ea' },
  { id: 'bg-amber-600', label: 'Amber', hex: '#d97706' },
  { id: 'bg-rose-600', label: 'Rose', hex: '#e11d48' },
  { id: 'bg-slate-700', label: 'Slate', hex: '#334155' }
];

const FHC_BRANCHES = [
  'Head Office - Addis Ababa',
  'ቅርንጫፍ 1 (ቦሌ - Bole Sub-City)',
  'ቅርንጫፍ 2 (ቂርቆስ - Kirkos Sub-City)',
  'ቅርንጫፍ 3 (የካ - Yeka Sub-City)',
  'ቅርንጫፍ 4 (አራዳ - Arada Sub-City)',
  'ቅርንጫፍ 5 (ጉለሌ - Gulele Sub-City)',
  'ቅርንጫፍ 6 (ልደታ - Lideta Sub-City)',
  'ቅርንጫፍ 7 (ኮልፌ - Kolfe Keranio Sub-City)',
  'ቅርንጫፍ 8 (ንፋስ ስልክ - Nifas Silk Lafto)',
  'ቅርንጫፍ 9 (አቃቂ ቃሊቲ - Akaki Kality)',
  'ቅርንጫፍ 10 (አዲስ ከተማ - Addis Ketema)'
];

const PERMISSION_DEFINITIONS: {
  key: string;
  nameEn: string;
  nameAm: string;
  desc: string;
  requiredRoles: UserRole[];
}[] = [
  {
    key: 'UPLOAD_FILES',
    nameEn: 'Upload & Parse Excel Spreadsheets',
    nameAm: 'ኤክሴል ሰነዶችን መጫን እና ማረጋገጥ',
    desc: 'Upload multi-thousand row Master & External Update spreadsheets (.xlsx/.xls/.csv).',
    requiredRoles: ['Admin', 'Staff']
  },
  {
    key: 'VLOOKUP_MATCH',
    nameEn: 'VLOOKUP & Identifier Code Matching',
    nameAm: 'በመለያ ኮድ (Identifier) ማዛመድ',
    desc: 'Perform O(n) hash-map reconciliation matching against unique property identifier codes.',
    requiredRoles: ['Admin', 'Staff', 'Viewer']
  },
  {
    key: 'REVIEW_DIFFS',
    nameEn: 'Inspect Field Differences & Flags',
    nameAm: 'የተለዋወጡ እና የጎደሉ መረጃዎችን መገምገም',
    desc: 'Review side-by-side differences for rental amounts, occupant names, and room counts.',
    requiredRoles: ['Admin', 'Staff']
  },
  {
    key: 'BULK_RESOLVE',
    nameEn: 'Heuristic Bulk Discrepancy Resolution',
    nameAm: 'የጅምላ ልዩነቶችን በደንብ መፍታት',
    desc: 'Execute automated heuristic resolution rules across hundreds of discrepancies.',
    requiredRoles: ['Admin', 'Staff']
  },
  {
    key: 'APPROVE_UPDATE',
    nameEn: 'Commit Updates to Master Registry',
    nameAm: 'ውሳኔዎችን ወደ ዋናው መዝገብ ማፅደቅ',
    desc: 'Permanently apply approved changes to the active property registry and archive update sessions.',
    requiredRoles: ['Admin']
  },
  {
    key: 'MANAGE_SETTINGS',
    nameEn: 'Configure Matching Rules & Thresholds',
    nameAm: 'የደህንነት ደንቦችን እና ቅንብሮችን ማስተካከል',
    desc: 'Define missing-tenant safeguard policies, duplicate detection, and threshold limits.',
    requiredRoles: ['Admin']
  },
  {
    key: 'VIEW_REPORTS',
    nameEn: 'Generate & Export FHC Form 01 Reports',
    nameAm: 'የቅጽ - 01 ሪፖርቶችን ማመንጨት እና ማውጣት',
    desc: 'Compute dynamic Ethiopian Federal Housing Corporation branch housing matrices.',
    requiredRoles: ['Admin', 'Staff', 'Viewer']
  },
  {
    key: 'MANAGE_USERS',
    nameEn: 'Manage Team Users & Access Roles',
    nameAm: 'የተጠቃሚዎችን ሚና እና መለያ ማስተዳደር',
    desc: 'Add, edit, or modify role permissions for municipal staff and audit personnel.',
    requiredRoles: ['Admin']
  }
];

export const ProfileView: React.FC = () => {
  const { user, usersList, updateProfile, updateUser, addUser, deleteUser, updateUserRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'myProfile' | 'teamDirectory'>('myProfile');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [prefSaveSuccess, setPrefSaveSuccess] = useState(false);

  // My Profile Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    jobTitle: user?.jobTitle || '',
    department: user?.department || '',
    branch: user?.branch || 'Head Office - Addis Ababa',
    phone: user?.phone || '',
    bio: user?.bio || '',
    avatarColor: user?.avatarColor || 'bg-indigo-600',
    language: (user?.language || 'en') as 'en' | 'am'
  });

  // Notification Preferences State
  const [notifications, setNotifications] = useState<UserNotificationPreferences>({
    emailAlerts: user?.notifications?.emailAlerts ?? true,
    reconciliationCompleted: user?.notifications?.reconciliationCompleted ?? true,
    discrepancyAlerts: user?.notifications?.discrepancyAlerts ?? true,
    approvalRequests: user?.notifications?.approvalRequests ?? (user?.role === 'Admin')
  });

  // Team Directory Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'Staff' as UserRole,
    jobTitle: '',
    department: 'Property Administration Directorate',
    branch: 'ቅርንጫፍ 1 (ቦሌ - Bole Sub-City)',
    phone: '',
    avatarColor: 'bg-emerald-600'
  });

  // Edit User Modal State (for Team Directory)
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Sync formData when user changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        jobTitle: user.jobTitle || '',
        department: user.department || '',
        branch: user.branch || 'Head Office - Addis Ababa',
        phone: user.phone || '',
        bio: user.bio || '',
        avatarColor: user.avatarColor || 'bg-indigo-600',
        language: user.language || 'en'
      });
      setNotifications({
        emailAlerts: user.notifications?.emailAlerts ?? true,
        reconciliationCompleted: user.notifications?.reconciliationCompleted ?? true,
        discrepancyAlerts: user.notifications?.discrepancyAlerts ?? true,
        approvalRequests: user.notifications?.approvalRequests ?? (user.role === 'Admin')
      });
    }
  }, [user]);

  // Handle Save Profile Form
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const initials = formData.name
      .trim()
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase() || user.avatar || 'US';

    await updateProfile({
      name: formData.name.trim(),
      email: formData.email.trim(),
      jobTitle: formData.jobTitle.trim(),
      department: formData.department.trim(),
      branch: formData.branch,
      phone: formData.phone.trim(),
      bio: formData.bio.trim(),
      avatar: initials,
      avatarColor: formData.avatarColor,
      language: formData.language,
      notifications
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Handle Save Notifications
  const handleSavePreferences = async () => {
    if (!user) return;
    await updateProfile({
      notifications,
      language: formData.language
    });
    setPrefSaveSuccess(true);
    setTimeout(() => setPrefSaveSuccess(false), 2500);
  };

  // Handle Create New User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name.trim() || !newUserForm.email.trim()) return;

    addUser({
      name: newUserForm.name.trim(),
      email: newUserForm.email.trim(),
      role: newUserForm.role,
      jobTitle: newUserForm.jobTitle.trim() || `${newUserForm.role} Officer`,
      department: newUserForm.department.trim(),
      branch: newUserForm.branch,
      phone: newUserForm.phone.trim(),
      avatarColor: newUserForm.avatarColor,
      language: 'en',
      bio: `Registered staff member for ${newUserForm.branch}`,
      notifications: {
        emailAlerts: true,
        reconciliationCompleted: true,
        discrepancyAlerts: newUserForm.role !== 'Viewer',
        approvalRequests: newUserForm.role === 'Admin'
      }
    });

    setIsAddUserOpen(false);
    setNewUserForm({
      name: '',
      email: '',
      role: 'Staff',
      jobTitle: '',
      department: 'Property Administration Directorate',
      branch: 'ቅርንጫፍ 1 (ቦሌ - Bole Sub-City)',
      phone: '',
      avatarColor: 'bg-emerald-600'
    });
  };

  // Handle Edit User Save
  const handleSaveEditingUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Check if system role was altered
    const prev = usersList.find((u) => u.id === editingUser.id);
    if (prev && prev.role !== editingUser.role) {
      if (user?.role === 'Admin') {
        const success = await updateUserRole(editingUser.id, editingUser.role);
        if (!success) return;
      } else {
        alert('Action Prohibited: Only Administrators can alter user roles.');
        return;
      }
    }

    updateUser(editingUser.id, editingUser);
    setEditingUser(null);
  };

  // Filtered Users Roster
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = u.name.toLowerCase().includes(q);
        const emailMatch = u.email.toLowerCase().includes(q);
        const deptMatch = (u.department || '').toLowerCase().includes(q);
        const branchMatch = (u.branch || '').toLowerCase().includes(q);
        const titleMatch = (u.jobTitle || '').toLowerCase().includes(q);
        return nameMatch || emailMatch || deptMatch || branchMatch || titleMatch;
      }
      return true;
    });
  }, [usersList, roleFilter, searchQuery]);

  // Recent audit logs for current user
  const recentUserLogs = useMemo(() => {
    if (!user) return [];
    const allLogs = tenantDb.getAuditLogs();
    const userLogs = allLogs.filter((log) => log.userName.toLowerCase() === user.name.toLowerCase());
    return userLogs.length > 0 ? userLogs.slice(0, 5) : allLogs.slice(0, 4);
  }, [user]);

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <span>Identity & Access Management</span>
            <span>·</span>
            <span>የተጠቃሚ መገለጫ</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            User Profile & Team Roster
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage your personal profile, credentials, organizational branch, and system access permissions.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          <button
            onClick={() => setActiveTab('myProfile')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'myProfile'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>My Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('teamDirectory')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'teamDirectory'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Team Users ({usersList.length})</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: MY PROFILE ================= */}
      {activeTab === 'myProfile' && (
        <div className="space-y-6">
          {/* Profile Hero Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {/* Background Accent Banner */}
            <div className="h-28 bg-gradient-to-r from-indigo-700 via-indigo-600 to-slate-800" />

            <div className="px-6 pb-6 pt-0">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-14">
                {/* Avatar & Key Info */}
                <div className="flex items-end gap-4">
                  <div
                    className={`flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white text-2xl sm:text-3xl font-black text-white shadow-md ${
                      formData.avatarColor || user.avatarColor || 'bg-indigo-600'
                    }`}
                  >
                    {user.avatar || user.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="pb-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{user.name}</h2>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-bold ${
                          user.role === 'Admin'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : user.role === 'Staff'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        <span>{user.role} Role</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Active Session</span>
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                        <span>{user.jobTitle || 'Property Registrar'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{user.department || 'Property Administration Directorate'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>{user.branch || 'Head Office - Addis Ababa'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form & Permissions Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column (2 Cols): Personal Details Form */}
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Personal & Station Details</h3>
                    <p className="text-xs text-slate-500">
                      Update your account contact details, organizational branch, and profile appearance.
                    </p>
                  </div>
                  {saveSuccess && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                      <Check className="h-3.5 w-3.5" />
                      <span>Profile Updated!</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
                  {/* Avatar Theme Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Avatar Accent Color</label>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {AVATAR_COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, avatarColor: c.id })}
                          className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${c.id} ${
                            formData.avatarColor === c.id
                              ? 'ring-2 ring-offset-2 ring-slate-900 scale-105'
                              : 'opacity-85 hover:opacity-100'
                          }`}
                          title={c.label}
                        >
                          {formData.avatarColor === c.id && <Check className="h-4 w-4 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name and Email */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. Sarah Jenkins"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Official Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="s.jenkins@fhc.gov.et"
                      />
                    </div>
                  </div>

                  {/* Job Title & Department */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Job Title / Position</label>
                      <input
                        type="text"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. Senior Housing Operations Director"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Department / Directorate</label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. Property Administration Directorate"
                      />
                    </div>
                  </div>

                  {/* Branch & Phone */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">FHC Sub-City Branch</label>
                      <select
                        value={formData.branch}
                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {FHC_BRANCHES.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Contact Phone Number</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="+251 91 123 4567"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Professional Summary & Responsibilities</label>
                    <textarea
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                      placeholder="Brief description of property management duties, cadastre oversight, or reconciliation responsibilities..."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>Save Profile Changes</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Notification & System Preferences */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-base font-bold text-slate-900">Alerts & System Preferences</h3>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Configure email digests and automated discrepancy notification rules.
                    </p>
                  </div>
                  {prefSaveSuccess && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                      <Check className="h-3.5 w-3.5" />
                      <span>Saved!</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Reconciliation Completion Digests</div>
                      <div className="text-[11px] text-slate-500">
                        Receive a report notification when external files are parsed and matched.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.reconciliationCompleted}
                      onChange={(e) =>
                        setNotifications({ ...notifications, reconciliationCompleted: e.target.checked })
                      }
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Discrepancy Threshold Warnings</div>
                      <div className="text-[11px] text-slate-500">
                        Alert when missing or changed tenants exceed 15% of the baseline register.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.discrepancyAlerts}
                      onChange={(e) =>
                        setNotifications({ ...notifications, discrepancyAlerts: e.target.checked })
                      }
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Batch Approval Notices</div>
                      <div className="text-[11px] text-slate-500">
                        Notify when an Administrator commits updates to the live master registry.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.approvalRequests}
                      onChange={(e) =>
                        setNotifications({ ...notifications, approvalRequests: e.target.checked })
                      }
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <button
                    onClick={handleSavePreferences}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                  >
                    <span>Save Alert Preferences</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column (1 Col): Role Permissions Matrix & Activity */}
            <div className="space-y-6">
              {/* Permissions Breakdown Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Operational Role Permissions</h3>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Your current account is assigned to the{' '}
                  <strong className="text-slate-800">{user.role}</strong> authorization tier:
                </p>

                <div className="mt-4 divide-y divide-slate-100">
                  {PERMISSION_DEFINITIONS.map((perm) => {
                    const hasAccess = perm.requiredRoles.includes(user.role);
                    return (
                      <div key={perm.key} className="py-2.5 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>{perm.nameEn}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{perm.desc}</div>
                        </div>

                        <div className="shrink-0 pt-0.5">
                          {hasAccess ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <Check className="h-3 w-3" />
                              <span>Allowed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                              <Lock className="h-3 w-3" />
                              <span>Restricted</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Audit Activities */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-900">Recent User Actions</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Audit Trail</span>
                </div>

                <div className="mt-3 space-y-2.5">
                  {recentUserLogs.length > 0 ? (
                    recentUserLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{log.action}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500 line-clamp-2">{log.details}</div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No audit history actions recorded yet for this session.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: TEAM USERS ROSTER ================= */}
      {activeTab === 'teamDirectory' && (
        <div className="space-y-6">
          {/* Top Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search team users by name, email, department, or branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Role Filter & Add User Button */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5 text-xs">
                {(['ALL', 'Admin', 'Staff', 'Viewer'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                      roleFilter === r
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsAddUserOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((item) => {
              const isCurrentUser = item.id === user.id;
              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-md ${
                    isCurrentUser ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Header with Avatar and Role */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-2xs text-sm ${
                            item.avatarColor || 'bg-indigo-600'
                          }`}
                        >
                          {item.avatar || item.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                            {isCurrentUser && (
                              <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{item.email}</div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          item.role === 'Admin'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : item.role === 'Staff'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <Shield className="h-2.5 w-2.5" />
                        <span>{item.role}</span>
                      </span>
                    </div>

                    {/* Metadata Specs */}
                    <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{item.jobTitle || 'Property Specialist'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{item.department || 'Property Directorate'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{item.branch || 'Addis Ababa'}</span>
                      </div>
                      {item.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>{item.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {!isCurrentUser ? (
                      <span className="text-[11px] font-medium text-slate-500">
                        {item.branch || 'Addis Ababa Station'}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Current Active Account</span>
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingUser(item)}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                        title="Edit profile & role"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      {!isCurrentUser && user.role === 'Admin' && (
                        <button
                          onClick={() => deleteUser(item.id)}
                          className="rounded-lg border border-rose-200 bg-white p-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Remove user (Admin only)"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <div className="text-sm font-bold text-slate-700">No Users Match Search Filter</div>
              <div className="mt-1 text-xs text-slate-400">
                Try modifying your search query or reset role filters.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: ADD USER ================= */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Add New Team User</h3>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yohannes Mengistu"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Official Email</label>
                <input
                  type="email"
                  required
                  placeholder="y.mengistu@fhc.gov.et"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">System Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900 focus:outline-none"
                  >
                    <option value="Staff">Staff (Operations)</option>
                    <option value="Admin">Admin (Full Access)</option>
                    <option value="Viewer">Viewer (Read Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Cadastral Officer"
                    value={newUserForm.jobTitle}
                    onChange={(e) => setNewUserForm({ ...newUserForm, jobTitle: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Assigned Branch</label>
                <select
                  value={newUserForm.branch}
                  onChange={(e) => setNewUserForm({ ...newUserForm, branch: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:outline-none"
                >
                  {FHC_BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Phone Number</label>
                <input
                  type="text"
                  placeholder="+251 91 ..."
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="rounded-xl border border-slate-200 px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-1.5 font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT USER (ROSTER) ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Edit User Details</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditingUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Official Email</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-700">Role Authorization</label>
                    {user?.role !== 'Admin' && (
                      <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                        <Lock className="h-3 w-3" /> Admin Managed
                      </span>
                    )}
                  </div>
                  <select
                    disabled={user?.role !== 'Admin'}
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="Admin">Admin (Full Access)</option>
                    <option value="Staff">Staff (Operations)</option>
                    <option value="Viewer">Viewer (Read Only)</option>
                  </select>
                  {user?.role !== 'Admin' && (
                    <p className="mt-1 text-[10px] text-slate-400">
                      System roles can only be changed by an Administrator.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">Job Title</label>
                  <input
                    type="text"
                    value={editingUser.jobTitle || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, jobTitle: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Department</label>
                <input
                  type="text"
                  value={editingUser.department || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Branch Station</label>
                <select
                  value={editingUser.branch || FHC_BRANCHES[0]}
                  onChange={(e) => setEditingUser({ ...editingUser, branch: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:outline-none"
                >
                  {FHC_BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-slate-200 px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-1.5 font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
