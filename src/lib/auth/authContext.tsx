import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/src/types/tenant';

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
  usersList: User[];
  login: (role: UserRole, customEmail?: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
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
    email: 's.jenkins@propertygroup.com',
    role: 'Admin',
    avatar: 'SJ'
  },
  Staff: {
    id: 'usr-staff-1',
    name: 'Marcus Chen',
    email: 'm.chen@propertygroup.com',
    role: 'Staff',
    avatar: 'MC'
  },
  Viewer: {
    id: 'usr-viewer-1',
    name: 'Elena Rostova',
    email: 'e.rostova@propertygroup.com',
    role: 'Viewer',
    avatar: 'ER'
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const [usersList, setUsersList] = useState<User[]>([
    PRESET_USERS.Admin,
    PRESET_USERS.Staff,
    PRESET_USERS.Viewer,
    {
      id: 'usr-staff-2',
      name: 'David Kim',
      email: 'd.kim@propertygroup.com',
      role: 'Staff',
      avatar: 'DK'
    },
    {
      id: 'usr-viewer-2',
      name: 'Sophia Patel',
      email: 's.patel@propertygroup.com',
      role: 'Viewer',
      avatar: 'SP'
    }
  ]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('tlu_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('tlu_auth_user');
    }
  }, [user]);

  const login = (role: UserRole, customEmail?: string) => {
    if (customEmail) {
      const found = usersList.find(u => u.email.toLowerCase() === customEmail.toLowerCase());
      if (found) {
        setUser({ ...found, role });
        return;
      }
      const initials = customEmail.split('@')[0].slice(0, 2).toUpperCase();
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: customEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        email: customEmail,
        role: role,
        avatar: initials
      };
      setUser(newUser);
      return;
    }
    setUser(PRESET_USERS[role]);
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    setUser(PRESET_USERS[role]);
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsersList(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (user && user.id === userId) {
      setUser({ ...user, role: newRole });
    }
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
        usersList,
        login,
        logout,
        switchRole,
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
