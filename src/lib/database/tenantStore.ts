import {
  TenantRecord,
  TenantComparisonItem,
  TenantHistoryItem,
  UploadSession,
  AuditLog,
  ComparisonSummary,
  User
} from '@/src/types/tenant';

const STORAGE_KEYS = {
  TENANTS: 'tlu_tenants_v1',
  HISTORY: 'tlu_history_v1',
  SESSIONS: 'tlu_sessions_v1',
  AUDIT_LOGS: 'tlu_audit_logs_v1',
  SETTINGS: 'tlu_settings_v1',
  LAST_UPDATE: 'tlu_last_update_v1'
};

export type TenantChangeListener = (tenants: TenantRecord[]) => void;

export class TenantDatabase {
  private static instance: TenantDatabase;
  private listeners: TenantChangeListener[] = [];

  public static getInstance(): TenantDatabase {
    if (!TenantDatabase.instance) {
      TenantDatabase.instance = new TenantDatabase();
    }
    return TenantDatabase.instance;
  }

  public subscribe(listener: TenantChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(tenants: TenantRecord[]) {
    this.listeners.forEach(l => {
      try { l(tenants); } catch (e) { console.error('Tenant listener error:', e); }
    });
  }

  constructor() {
    this.initializeIfEmpty();
  }

  private initializeIfEmpty() {
    if (typeof window === 'undefined') return;

    // Purge local database data as requested by user
    const purgeDone = localStorage.getItem('tlu_local_db_purged_flag_v8');
    if (!purgeDone) {
      this.clearAllData();
      localStorage.setItem('tlu_local_db_purged_flag_v8', 'true');
      return;
    }

    const existing = localStorage.getItem(STORAGE_KEYS.TENANTS);
    if (!existing) {
      this.clearAllData();
      return;
    }

    // Purge legacy mock demo data or auto-generated batches if previously loaded
    try {
      const parsed = JSON.parse(existing);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return;
      }
      const isLegacyDemo = parsed.some((t: any) =>
        t.tenantCode?.startsWith('T0') ||
        t.tenantName === 'Apex Global Logistics' ||
        t.identifier_code?.startsWith('ETH-AA-B01') ||
        t.identifier_code?.startsWith('ETH-FHC-B1-') ||
        t.identifier_code?.startsWith('ETH-AA-')
      );
      if (isLegacyDemo) {
        this.clearAllData();
      }
    } catch {
      this.clearAllData();
    }
  }

  public clearAllData() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.TENANTS);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem('tlu_form01_report_v1');
    localStorage.removeItem('tlu_form02_report_v1');
    localStorage.removeItem('tlu_form03_report_v1');
    localStorage.removeItem('tlu_settings_v1');
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
    this.notify([]);
  }

  public clearDatabase(user?: User) {
    this.clearAllData();
    if (user) {
      this.addAuditLog(
        'Master Records Purged',
        'All master property and tenant records, sessions, and histories have been cleared.',
        user
      );
    }
  }

  public resetToDefaultDemoData() {
    // Alias to clearDatabase for backward compatibility without loading sample data
    this.clearAllData();
  }

  // --- Tenants CRUD ---
  public getTenants(): TenantRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TENANTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getTenant(code: string): TenantRecord | undefined {
    const list = this.getTenants();
    const cleanCode = code.trim().toLowerCase();
    return list.find((t) => t.tenantCode.trim().toLowerCase() === cleanCode);
  }

  public saveTenants(tenants: TenantRecord[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
    this.notify(tenants);
  }

  public updateSingleTenant(code: string, updates: Partial<TenantRecord>, user: User): TenantRecord {
    const list = this.getTenants();
    const idx = list.findIndex(t => t.tenantCode.toLowerCase() === code.toLowerCase());
    if (idx === -1) {
      throw new Error(`Tenant with code ${code} not found.`);
    }

    const current = list[idx];
    const updated: TenantRecord = {
      ...current,
      ...updates,
      identifier_code: updates.identifier_code || current.identifier_code || current.tenantCode,
      tenant_name: updates.tenant_name || updates.tenantName || current.tenant_name || current.tenantName,
      resident_name: updates.resident_name || current.resident_name,
      house_number: updates.house_number || updates.unit || current.house_number || current.unit,
      sub_city: updates.sub_city || updates.branch || current.sub_city || current.branch,
      floor_level: updates.floor_level || updates.floor || current.floor_level || current.floor,
      mobile_phone: updates.mobile_phone || updates.phone || current.mobile_phone || current.phone,
      rent_amount: updates.rent_amount !== undefined ? Number(updates.rent_amount) : (updates.rent !== undefined ? Number(updates.rent) : current.rent_amount),
      historical_use: updates.historical_use || updates.category || current.historical_use || current.category,
      work_status: updates.work_status || updates.status || current.work_status || current.status,
      tenantCode: updates.identifier_code || current.identifier_code || current.tenantCode,
      tenantName: updates.tenant_name || updates.tenantName || current.tenant_name || current.tenantName,
      unit: updates.house_number || updates.unit || current.house_number || current.unit,
      branch: updates.sub_city || updates.branch || current.sub_city || current.branch,
      floor: updates.floor_level || updates.floor || current.floor_level || current.floor,
      phone: updates.mobile_phone || updates.phone || current.mobile_phone || current.phone,
      rent: updates.rent_amount !== undefined ? Number(updates.rent_amount) : (updates.rent !== undefined ? Number(updates.rent) : current.rent),
      updatedAt: new Date().toISOString()
    };
    list[idx] = updated;
    this.saveTenants(list);

    this.addAuditLog(
      'Manual Tenant Update',
      `Updated fields for tenant ${code} (${updated.tenantName})`,
      user
    );

    return updated;
  }

  // --- Comparison Application Engine ---
  public applyComparisonUpdate(
    items: TenantComparisonItem[],
    sessionMetadata: {
      masterFileName: string;
      newFileName: string;
      summary: ComparisonSummary;
    },
    user: User
  ): {
    sessionId: string;
    updatedCount: number;
    newCount: number;
    missingCount: number;
    totalActive: number;
  } {
    const currentTenants = this.getTenants();
    const tenantMap = new Map<string, TenantRecord>(
      currentTenants.map((t) => [t.tenantCode.trim().toLowerCase(), { ...t }])
    );

    const sessionId = `sess-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];
    const historyEntries: TenantHistoryItem[] = [];

    let appliedNew = 0;
    let appliedUpdated = 0;
    let appliedMissing = 0;

    for (const item of items) {
      if (item.reviewStatus === 'rejected') {
        continue;
      }

      const codeLower = item.tenantCode.trim().toLowerCase();

      if (item.changeType === 'NEW' && item.newRecord) {
        tenantMap.set(codeLower, {
          ...item.newRecord,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        appliedNew++;

        historyEntries.push({
          id: `hist-${Date.now()}-${codeLower}`,
          tenantCode: item.tenantCode,
          tenantName: item.tenantName,
          field: 'ALL',
          oldValue: '(None)',
          newValue: 'New Record Created',
          changeType: 'NEW',
          updatedBy: user.name,
          updatedDate: dateStr,
          sessionId
        });
      } else if (item.changeType === 'UPDATED' && item.newRecord) {
        const existing = tenantMap.get(codeLower);
        if (existing) {
          // Log each changed field in History
          item.diffs.forEach((diff) => {
            historyEntries.push({
              id: `hist-${Date.now()}-${codeLower}-${diff.field}`,
              tenantCode: item.tenantCode,
              tenantName: item.tenantName,
              field: diff.label,
              oldValue: String(diff.oldValue ?? ''),
              newValue: String(diff.newValue ?? ''),
              changeType: 'UPDATED',
              updatedBy: user.name,
              updatedDate: dateStr,
              sessionId
            });
          });

          // Apply updates
          tenantMap.set(codeLower, {
            ...existing,
            ...item.newRecord,
            rawFields: {
              ...(existing.rawFields || {}),
              ...(item.newRecord.rawFields || {})
            },
            updatedAt: new Date().toISOString()
          });
          appliedUpdated++;
        }
      } else if (item.changeType === 'MISSING' && item.masterRecord) {
        const existing = tenantMap.get(codeLower);
        if (existing) {
          const action = item.missingAction || 'keep';
          if (action === 'deactivate') {
            tenantMap.set(codeLower, {
              ...existing,
              status: 'Inactive',
              updatedAt: new Date().toISOString()
            });
            historyEntries.push({
              id: `hist-${Date.now()}-${codeLower}-status`,
              tenantCode: item.tenantCode,
              tenantName: item.tenantName,
              field: 'Status',
              oldValue: existing.status,
              newValue: 'Inactive (Missing File Action)',
              changeType: 'DEACTIVATED',
              updatedBy: user.name,
              updatedDate: dateStr,
              sessionId
            });
            appliedMissing++;
          } else if (action === 'remove') {
            tenantMap.delete(codeLower);
            historyEntries.push({
              id: `hist-${Date.now()}-${codeLower}-remove`,
              tenantCode: item.tenantCode,
              tenantName: item.tenantName,
              field: 'Record',
              oldValue: 'Active Record',
              newValue: 'Removed by Admin Decision',
              changeType: 'REMOVED',
              updatedBy: user.name,
              updatedDate: dateStr,
              sessionId
            });
            appliedMissing++;
          }
          // if 'keep', do nothing to preserve data safely!
        }
      }
    }

    const updatedList = Array.from(tenantMap.values());
    this.saveTenants(updatedList);

    // Save history entries
    const existingHistory = this.getHistory();
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([...historyEntries, ...existingHistory]));

    // Record session
    const newSession: UploadSession = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      masterFileName: sessionMetadata.masterFileName,
      newFileName: sessionMetadata.newFileName,
      summary: sessionMetadata.summary,
      appliedAt: new Date().toISOString(),
      appliedBy: user.name,
      status: 'applied'
    };
    const existingSessions = this.getSessions();
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([newSession, ...existingSessions]));

    // Record audit log
    this.addAuditLog(
      'Tenant Batch Update Applied',
      `Applied reconciliation session: ${appliedNew} new, ${appliedUpdated} updated, ${appliedMissing} missing processed from ${sessionMetadata.newFileName}`,
      user
    );

    const totalActive = updatedList.filter(t => t.status.toLowerCase() === 'active').length;

    return {
      sessionId,
      updatedCount: appliedUpdated,
      newCount: appliedNew,
      missingCount: appliedMissing,
      totalActive
    };
  }

  // --- History & Audit ---
  public getHistory(tenantCode?: string): TenantHistoryItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      const list: TenantHistoryItem[] = data ? JSON.parse(data) : [];
      if (tenantCode) {
        return list.filter(h => h.tenantCode.toLowerCase() === tenantCode.toLowerCase());
      }
      return list;
    } catch {
      return [];
    }
  }

  public getSessions(): UploadSession[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getSessionById(sessionId: string): UploadSession | undefined {
    return this.getSessions().find(s => s.id === sessionId);
  }

  public getAuditLogs(): AuditLog[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public addAuditLog(action: string, details: string, user: User) {
    if (typeof window === 'undefined') return;
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action,
      details,
      userName: user.name,
      userRole: user.role,
      timestamp: new Date().toISOString()
    };
    const logs = this.getAuditLogs();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([log, ...logs.slice(0, 99)]));
  }

  public getLastUpdateDate(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
  }
}

export const tenantDb = TenantDatabase.getInstance();
