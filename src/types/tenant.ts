export type UserRole = 'Admin' | 'Staff' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type RecordChangeType = 'NEW' | 'UPDATED' | 'UNCHANGED' | 'MISSING' | 'DUPLICATE' | 'ERROR';

export type MissingTenantAction = 'keep' | 'deactivate' | 'remove';

export interface TenantRecord {
  tenantCode: string;
  tenantName: string;
  unit: string;
  branch?: string;
  floor?: string;
  phone?: string;
  email?: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Terminated' | string;
  rent?: number | string;
  contractStart?: string;
  contractEnd?: string;
  category?: string;
  rawFields: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface FieldDiff {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
  isChanged: boolean;
}

export interface TenantComparisonItem {
  id: string;
  tenantCode: string;
  tenantName: string;
  changeType: RecordChangeType;
  diffs: FieldDiff[];
  masterRecord?: TenantRecord;
  newRecord?: TenantRecord;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  missingAction?: MissingTenantAction;
  issues?: string[];
  rowNumber?: number;
  heuristicTag?: string;
}

export interface HeuristicRule {
  id: string;
  name: string;
  category: 'naming' | 'phone' | 'financial' | 'status' | 'lifecycle' | 'formatting';
  description: string;
  confidence: number;
  suggestedAction: 'approve' | 'reject' | 'deactivate' | 'keep';
  itemCount: number;
  sampleItems: {
    tenantCode: string;
    tenantName: string;
    field: string;
    oldValue: any;
    newValue: any;
    explanation: string;
  }[];
  matchedItemIds: string[];
}

export interface ComparisonSummary {
  totalMaster: number;
  totalNew: number;
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  missingCount: number;
  duplicateCount: number;
  errorCount: number;
}

export interface ColumnMapping {
  tenantCode: string;
  tenantName?: string;
  unit?: string;
  branch?: string;
  floor?: string;
  phone?: string;
  email?: string;
  status?: string;
  rent?: string;
  contractStart?: string;
  contractEnd?: string;
  category?: string;
}

export interface UploadSession {
  id: string;
  createdAt: string;
  masterFileName: string;
  newFileName: string;
  summary: ComparisonSummary;
  appliedAt?: string;
  appliedBy?: string;
  status: 'draft' | 'applied' | 'discarded';
}

export interface TenantHistoryItem {
  id: string;
  tenantCode: string;
  tenantName: string;
  field: string;
  oldValue: string;
  newValue: string;
  changeType: string;
  updatedBy: string;
  updatedDate: string;
  sessionId: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
}

export interface ParsedExcelFile {
  fileName: string;
  fileSize: number;
  fileSizeBytes: number;
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
  detectedMapping: ColumnMapping;
  isTenantCodeDetected: boolean;
}
