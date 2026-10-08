import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile as updateFbProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/src/lib/firebase/firebase';
import { handleFirestoreError, OperationType } from '@/src/lib/firebase/firestoreErrors';
import { User, UserRole } from '@/src/types/tenant';
import { tenantDb } from '@/src/lib/database/tenantStore';

export type Permission =
  | 'UPLOAD_FILES'
  | 'COMPARE_FILES'
  | 'REVIEW_DIFFS'
  | 'BULK_RESOLVE'
  | 'APPROVE_UPDATE'
  | 'MANAGE_TENANTS'
  | 'MANAGE_SETTINGS'
  | 'MANAGE_USERS'
  | 'VIEW_AUDIT_LOGS'
  | 'VIEW_TENANTS'
  | 'VIEW_REPORTS'
  | 'EXPORT_EXCEL';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  Admin: [
    'UPLOAD_FILES',
    'COMPARE_FILES',
    'REVIEW_DIFFS',
    'BULK_RESOLVE',
    'APPROVE_UPDATE',
    'MANAGE_TENANTS',
    'MANAGE_SETTINGS',
    'MANAGE_USERS',
    'VIEW_AUDIT_LOGS',
    'VIEW_TENANTS',
    'VIEW_REPORTS',
    'EXPORT_EXCEL'
  ],
  Staff: [
    'UPLOAD_FILES',
    'COMPARE_FILES',
    'REVIEW_DIFFS',
    'BULK_RESOLVE',
    'VIEW_TENANTS',
    'VIEW_REPORTS',
    'EXPORT_EXCEL'
  ],
  Viewer: [
    'VIEW_TENANTS',
    'VIEW_REPORTS'
  ]
};

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  authLoading: boolean;
  usersList: User[];
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string,
    department?: string,
    branch?: string
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  login: (role: UserRole, customEmail?: string) => void;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
  updateUser: (userId: string, updatedData: Partial<User>) => void;
  addUser: (newUser: Omit<User, 'id'>) => User;
  deleteUser: (userId: string) => void;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<boolean>;
  hasPermission: (permission: Permission) => boolean;
  canUpload: boolean;
  canApprove: boolean;
  canManageTenants: boolean;
  canManageSettings: boolean;
  canBulkResolve: boolean;
  canExport: boolean;
  isReadOnly: boolean;
}

const PRESET_USERS: Record<UserRole, User> = {
  Admin: {
    id: 'usr-admin-1',
    name: 'Sarah Jenkins',
    email: 's.jenkins@fhc.gov.et',
    role: 'Admin',
    avatar: 'SJ',
    avatarColor: 'bg-indigo-600',
    jobTitle: 'Senior Housing Operations Director',
    department: 'Property Administration & Reconciliation Directorate',
    branch: 'Head Office - Addis Ababa',
    phone: '+251 91 123 4567',
    bio: 'Oversees national housing register reconciliation, FHC Form 01 compliance, and tenancy approvals across 10 municipal branch zones.',
    language: 'en',
    joinedDate: '2023-01-15',
    lastActive: 'Active Now',
    notifications: {
      emailAlerts: true,
      reconciliationCompleted: true,
      discrepancyAlerts: true,
      approvalRequests: true
    }
  },
  Staff: {
    id: 'usr-staff-1',
    name: 'Marcus Chen',
    email: 'm.chen@fhc.gov.et',
    role: 'Staff',
    avatar: 'MC',
    avatarColor: 'bg-emerald-600',
    jobTitle: 'Lead Reconciliation Officer',
    department: 'Data Verification & Cadastre Unit',
    branch: 'Bole Sub-City Branch',
    phone: '+251 92 987 6543',
    bio: 'Responsible for Excel bulk imports, VLOOKUP comparisons, and discrepancy flagging for municipal housing units.',
    language: 'en',
    joinedDate: '2023-06-10',
    lastActive: '10 mins ago',
    notifications: {
      emailAlerts: true,
      reconciliationCompleted: true,
      discrepancyAlerts: true,
      approvalRequests: false
    }
  },
  Viewer: {
    id: 'usr-viewer-1',
    name: 'Elena Rostova',
    email: 'e.rostova@fhc.gov.et',
    role: 'Viewer',
    avatar: 'ER',
    avatarColor: 'bg-amber-600',
    jobTitle: 'Cadastral Auditor',
    department: 'Internal Audit & Reporting Inspectorate',
    branch: 'Kirkos Sub-City Branch',
    phone: '+251 93 456 7890',
    bio: 'Reviews Form 01 branch statements, verified cadastral boundaries, and historical occupancy audit trails.',
    language: 'am',
    joinedDate: '2024-02-01',
    lastActive: '1 hour ago',
    notifications: {
      emailAlerts: false,
      reconciliationCompleted: true,
      discrepancyAlerts: false,
      approvalRequests: false
    }
  }
};

const DEFAULT_USERS_ROSTER: User[] = [
  PRESET_USERS.Admin,
  PRESET_USERS.Staff,
  PRESET_USERS.Viewer,
  {
    id: 'usr-staff-2',
    name: 'David Kim',
    email: 'd.kim@fhc.gov.et',
    role: 'Staff',
    avatar: 'DK',
    avatarColor: 'bg-teal-600',
    jobTitle: 'Cadastre Field Inspector',
    department: 'Field Survey & Verification',
    branch: 'Yeka Sub-City Branch',
    phone: '+251 94 567 8901',
    bio: 'Performs on-site inspections for newly regularized properties, Kebele housing verifications, and room counts.',
    language: 'en',
    joinedDate: '2023-09-18',
    lastActive: '2 hours ago',
    notifications: {
      emailAlerts: true,
      reconciliationCompleted: false,
      discrepancyAlerts: true,
      approvalRequests: false
    }
  },
  {
    id: 'usr-viewer-2',
    name: 'Sophia Patel',
    email: 's.patel@fhc.gov.et',
    role: 'Viewer',
    avatar: 'SP',
    avatarColor: 'bg-purple-600',
    jobTitle: 'Financial Compliance Analyst',
    department: 'Rental Revenue & Audit Office',
    branch: 'Arada Sub-City Branch',
    phone: '+251 95 678 9012',
    bio: 'Monitors rental rate conformity, billing schedules, and monthly lease collections.',
    language: 'en',
    joinedDate: '2024-04-05',
    lastActive: 'Yesterday',
    notifications: {
      emailAlerts: false,
      reconciliationCompleted: false,
      discrepancyAlerts: false,
      approvalRequests: false
    }
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return PRESET_USERS.Admin;
    const stored = localStorage.getItem('tlu_auth_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return PRESET_USERS.Admin;
      }
    }
    return PRESET_USERS.Admin;
  });

  const [usersList, setUsersList] = useState<User[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_USERS_ROSTER;
    const stored = localStorage.getItem('tlu_users_roster');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // ignore
      }
    }
    return DEFAULT_USERS_ROSTER;
  });

  // Keep localStorage updated with active user
  useEffect(() => {
    if (user) {
      localStorage.setItem('tlu_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('tlu_auth_user');
    }
  }, [user]);

  // Keep usersList persisted
  useEffect(() => {
    localStorage.setItem('tlu_users_roster', JSON.stringify(usersList));
  }, [usersList]);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const isBootstrapAdminEmail =
          fbUser.email?.trim().toLowerCase() === 'tesfuniguse18@gmail.com';
        const assignedRole: UserRole = isBootstrapAdminEmail ? 'Admin' : 'Staff';

        const initials =
          (fbUser.displayName || fbUser.email || 'US')
            .trim()
            .split(' ')
            .map((part) => part[0])
            .filter(Boolean)
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'US';

        const fallbackProfile: User = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || (isBootstrapAdminEmail ? 'Admin User' : 'Staff User'),
          email: fbUser.email || (isBootstrapAdminEmail ? 'tesfuniguse18@gmail.com' : ''),
          role: assignedRole,
          avatar: initials,
          avatarColor: isBootstrapAdminEmail ? 'bg-indigo-600' : 'bg-emerald-600',
          jobTitle: isBootstrapAdminEmail ? 'System Administrator' : 'Reconciliation Specialist',
          department: 'Property Administration Directorate',
          branch: 'Head Office - Addis Ababa',
          phone: fbUser.phoneNumber || '',
          bio: isBootstrapAdminEmail
            ? 'System Administrator with full corporate administrative privileges.'
            : 'Authenticated team member via Firebase Authentication.',
          language: 'en',
          joinedDate: new Date().toISOString().split('T')[0],
          lastActive: 'Active Now',
          notifications: {
            emailAlerts: true,
            reconciliationCompleted: true,
            discrepancyAlerts: true,
            approvalRequests: true
          }
        };

        try {
          // Fetch user profile from Firestore /users/{uid}
          const userDocRef = doc(db, 'users', fbUser.uid);
          let docSnap;
          try {
            docSnap = await getDoc(userDocRef);
          } catch (getErr) {
            handleFirestoreError(getErr, OperationType.GET, `users/${fbUser.uid}`);
          }

          if (docSnap && docSnap.exists()) {
            const profileData = docSnap.data() as User;
            setUser(profileData);
            setUsersList((prev) => {
              const idx = prev.findIndex((u) => u.id === profileData.id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = profileData;
                return updated;
              }
              return [profileData, ...prev];
            });
          } else {
            // First time sign-in: create Firestore profile document
            try {
              await setDoc(userDocRef, fallbackProfile);
            } catch (createErr) {
              handleFirestoreError(createErr, OperationType.CREATE, `users/${fbUser.uid}`);
            }
            setUser(fallbackProfile);
            setUsersList((prev) => {
              const idx = prev.findIndex((u) => u.id === fallbackProfile.id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = fallbackProfile;
                return updated;
              }
              return [fallbackProfile, ...prev];
            });
          }
        } catch (err) {
          // Fallback to local profile gracefully so user session remains usable
          setUser((prev) => prev || fallbackProfile);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Firebase Email/Password Sign-In
  const loginWithEmail = async (email: string, password: string): Promise<void> => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const fbUser = cred.user;
    setFirebaseUser(fbUser);
  };

  // Firebase Email/Password Sign-Up (Self-registration defaults to Staff; Admin role assigned by Admin)
  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string,
    department: string = 'Property Administration Directorate',
    branch: string = 'Head Office - Addis Ababa'
  ): Promise<void> => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const fbUser = cred.user;

    await updateFbProfile(fbUser, { displayName: name });

    const initials =
      name
        .trim()
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'US';

    const isBootstrapAdminEmail = fbUser.email?.trim().toLowerCase() === 'tesfuniguse18@gmail.com';
    const defaultRole: UserRole = isBootstrapAdminEmail ? 'Admin' : 'Staff';

    const newProfile: User = {
      id: fbUser.uid,
      name,
      email: fbUser.email || email,
      role: defaultRole,
      avatar: initials,
      avatarColor: 'bg-indigo-600',
      jobTitle: `Operations Staff`,
      department,
      branch,
      phone: '',
      bio: `Registered staff member via Firebase Authentication. System role is managed by Administrator.`,
      language: 'en',
      joinedDate: new Date().toISOString().split('T')[0],
      lastActive: 'Active Now',
      notifications: {
        emailAlerts: true,
        reconciliationCompleted: true,
        discrepancyAlerts: true,
        approvalRequests: false
      }
    };

    const userDocRef = doc(db, 'users', fbUser.uid);
    await setDoc(userDocRef, newProfile);
    setUser(newProfile);
    setUsersList((prev) => [newProfile, ...prev]);
  };

  // Firebase Google Sign-In
  const loginWithGoogle = async (): Promise<void> => {
    const cred = await signInWithPopup(auth, googleProvider);
    const fbUser = cred.user;
    setFirebaseUser(fbUser);
  };

  // Firebase Password Reset Email
  const sendPasswordReset = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  // Fast Login / Preset Login (Simulated / Testing compatibility)
  const login = (role: UserRole, customEmail?: string) => {
    if (customEmail) {
      const found = usersList.find((u) => u.email.toLowerCase() === customEmail.toLowerCase());
      if (found) {
        setUser({ ...found, role });
        return;
      }
      const initials = customEmail.split('@')[0].slice(0, 2).toUpperCase();
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: customEmail
          .split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        email: customEmail,
        role: role,
        avatar: initials,
        avatarColor: 'bg-indigo-600',
        joinedDate: new Date().toISOString().split('T')[0],
        lastActive: 'Active Now'
      };
      setUser(newUser);
      return;
    }
    setUser(PRESET_USERS[role]);
  };

  // Sign out
  const logout = async (): Promise<void> => {
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
    setFirebaseUser(null);
    setUser(null);
  };

  // Switch role in current test session
  const switchRole = (role: UserRole) => {
    const matched = usersList.find((u) => u.role === role);
    if (matched) {
      setUser(matched);
    } else {
      setUser(PRESET_USERS[role]);
    }
  };

  // Update user profile in state and Firestore (Self-role escalation is blocked)
  const updateProfile = async (updatedData: Partial<User>): Promise<void> => {
    if (!user) return;

    // Non-administrators cannot modify or self-assign system roles
    const sanitized = { ...updatedData };
    if (user.role !== 'Admin' && 'role' in sanitized) {
      delete sanitized.role;
    }

    const updated = { ...user, ...sanitized };
    setUser(updated);
    setUsersList((prev) => prev.map((u) => (u.id === user.id ? updated : u)));

    // Sync to Firestore if authenticated with Firebase UID
    if (firebaseUser && firebaseUser.uid === user.id) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userDocRef, updated, { merge: true });
      } catch (err) {
        console.warn('Could not persist profile to Firestore:', err);
      }
    }
  };

  const updateUser = (userId: string, updatedData: Partial<User>) => {
    // Only admins can alter other users' roles
    const sanitized = { ...updatedData };
    if (user?.role !== 'Admin' && 'role' in sanitized) {
      delete sanitized.role;
    }

    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, ...sanitized };
        }
        return u;
      })
    );
    if (user && user.id === userId) {
      setUser((prev) => (prev ? { ...prev, ...sanitized } : null));
    }
  };

  const addUser = (newUser: Omit<User, 'id'>): User => {
    const id = `usr-${Date.now()}`;
    const initials =
      newUser.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'US';

    // Only Admin can create users with Admin role; others default to Staff
    const assignedRole: UserRole = user?.role === 'Admin' ? newUser.role : 'Staff';

    const userCreated: User = {
      ...newUser,
      role: assignedRole,
      id,
      avatar: newUser.avatar || initials,
      joinedDate: new Date().toISOString().split('T')[0],
      lastActive: 'Just now'
    };
    setUsersList((prev) => [...prev, userCreated]);
    return userCreated;
  };

  const deleteUser = (userId: string) => {
    if (user?.role !== 'Admin') {
      alert('Access Restricted: Only Administrators can remove user accounts.');
      return;
    }
    setUsersList((prev) => prev.filter((u) => u.id !== userId));
  };

  // Dedicated Admin-Only Role Management
  const updateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
    if (user?.role !== 'Admin') {
      alert('Permission Denied: System roles can only be managed and modified by Administrators.');
      return false;
    }

    const targetUser = usersList.find((u) => u.id === userId);
    if (!targetUser) return false;

    // Safety guardrail: Prevent demoting the last remaining active Administrator
    const adminCount = usersList.filter((u) => u.role === 'Admin').length;
    if (targetUser.role === 'Admin' && newRole !== 'Admin' && adminCount <= 1) {
      alert('Security Policy: At least one Administrator account must remain active in the system.');
      return false;
    }

    // Update locally
    setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    if (user && user.id === userId) {
      setUser({ ...user, role: newRole });
    }

    // Sync role to Firestore
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { role: newRole });
    } catch (err) {
      console.warn('Could not sync updated role to Firestore:', err);
    }

    // Record in audit log
    tenantDb.addAuditLog(
      'System Role Modified',
      `Administrator ${user.name} changed role for ${targetUser.name} (${targetUser.email}) from ${targetUser.role} to ${newRole}.`,
      user
    );

    return true;
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  };

  const role = user?.role;
  const canUpload = hasPermission('UPLOAD_FILES');
  const canApprove = hasPermission('APPROVE_UPDATE');
  const canManageTenants = hasPermission('MANAGE_TENANTS');
  const canManageSettings = hasPermission('MANAGE_SETTINGS');
  const canBulkResolve = hasPermission('BULK_RESOLVE');
  const canExport = hasPermission('EXPORT_EXCEL');
  const isReadOnly = role === 'Viewer';

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        authLoading,
        usersList,
        loginWithEmail,
        signUpWithEmail,
        loginWithGoogle,
        sendPasswordReset,
        login,
        logout,
        switchRole,
        updateProfile,
        updateUser,
        addUser,
        deleteUser,
        updateUserRole,
        hasPermission,
        canUpload,
        canApprove,
        canManageTenants,
        canManageSettings,
        canBulkResolve,
        canExport,
        isReadOnly
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
