import {
  TenantRecord,
  TenantComparisonItem,
  ComparisonSummary,
  FieldDiff,
  RecordChangeType
} from '@/src/types/tenant';

// Fields to systematically compare for updates
const COMPARABLE_FIELDS: { key: keyof TenantRecord; label: string }[] = [
  { key: 'tenantName', label: 'Tenant Name' },
  { key: 'unit', label: 'Unit / Space' },
  { key: 'status', label: 'Status' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'branch', label: 'Branch / Property' },
  { key: 'floor', label: 'Floor' },
  { key: 'rent', label: 'Rent' },
  { key: 'contractStart', label: 'Contract Start' },
  { key: 'contractEnd', label: 'Contract End' },
  { key: 'category', label: 'Category' },
];

function valuesAreEqual(v1: any, v2: any): boolean {
  if (v1 === v2) return true;
  if ((v1 === undefined || v1 === null || v1 === '') && (v2 === undefined || v2 === null || v2 === '')) {
    return true;
  }
  return String(v1 ?? '').trim().toLowerCase() === String(v2 ?? '').trim().toLowerCase();
}

export function compareTenantLists(
  masterTenants: TenantRecord[],
  newTenants: TenantRecord[]
): {
  items: TenantComparisonItem[];
  summary: ComparisonSummary;
} {
  const items: TenantComparisonItem[] = [];

  // Step 1: Detect Duplicates & Validation Errors in New List
  const newTenantCodeCount = new Map<string, number>();
  const newTenantCodeRows = new Map<string, number[]>();

  newTenants.forEach((tenant, idx) => {
    const code = tenant.tenantCode.trim();
    if (!code) return;
    newTenantCodeCount.set(code, (newTenantCodeCount.get(code) || 0) + 1);
    const rows = newTenantCodeRows.get(code) || [];
    rows.push(idx + 2); // 1-based, plus 1 for header
    newTenantCodeRows.set(code, rows);
  });

  // Track Master Tenants Map
  const masterMap = new Map<string, TenantRecord>();
  masterTenants.forEach((tenant) => {
    const code = tenant.tenantCode.trim();
    if (code) {
      masterMap.set(code, tenant);
    }
  });

  // Track codes seen in New List
  const processedNewCodes = new Set<string>();

  // Iterate over New Tenants to detect: ERROR, DUPLICATE, NEW, UPDATED, UNCHANGED
  newTenants.forEach((newRecord, idx) => {
    const rowNumber = idx + 2;
    const rawCode = newRecord.tenantCode.trim();
    const issues: string[] = [];

    // Validation checks
    if (!rawCode) {
      issues.push('Missing Tenant Code');
    }
    if (!newRecord.tenantName || newRecord.tenantName === 'Unnamed Tenant') {
      issues.push('Missing or empty Tenant Name');
    }
    if (!newRecord.unit || newRecord.unit === 'N/A') {
      issues.push('Missing Unit Number');
    }

    // Check invalid date formats if contract dates provided
    if (newRecord.contractStart && isNaN(Date.parse(newRecord.contractStart))) {
      issues.push(`Invalid Contract Start date: "${newRecord.contractStart}"`);
    }
    if (newRecord.contractEnd && isNaN(Date.parse(newRecord.contractEnd))) {
      issues.push(`Invalid Contract End date: "${newRecord.contractEnd}"`);
    }

    // Check for Duplicates in new file
    const countInNew = rawCode ? (newTenantCodeCount.get(rawCode) || 0) : 0;
    const isDuplicate = countInNew > 1;
    if (isDuplicate) {
      const rows = newTenantCodeRows.get(rawCode)?.join(', ');
      issues.push(`Duplicate Tenant Code "${rawCode}" detected in rows ${rows}`);
    }

    // If missing tenant code or critical error: classify as ERROR
    if (!rawCode || (issues.length > 0 && !rawCode)) {
      items.push({
        id: `err-${idx}`,
        tenantCode: rawCode || `[ROW ${rowNumber}]`,
        tenantName: newRecord.tenantName || 'Unknown',
        changeType: 'ERROR',
        diffs: [],
        newRecord,
        reviewStatus: 'rejected',
        issues,
        rowNumber
      });
      return;
    }

    // If duplicate in the new file, flag DUPLICATE
    if (isDuplicate) {
      items.push({
        id: `dup-${rawCode}-${idx}`,
        tenantCode: rawCode,
        tenantName: newRecord.tenantName,
        changeType: 'DUPLICATE',
        diffs: [],
        newRecord,
        masterRecord: masterMap.get(rawCode),
        reviewStatus: 'pending',
        issues,
        rowNumber
      });
      processedNewCodes.add(rawCode);
      return;
    }

    // Check if code exists in Master
    const masterRecord = masterMap.get(rawCode);

    if (!masterRecord) {
      // Record is in new, but not in master => NEW
      items.push({
        id: `new-${rawCode}`,
        tenantCode: rawCode,
        tenantName: newRecord.tenantName,
        changeType: issues.length > 0 ? 'ERROR' : 'NEW',
        diffs: [],
        newRecord,
        reviewStatus: 'approved',
        issues: issues.length > 0 ? issues : undefined,
        rowNumber
      });
      processedNewCodes.add(rawCode);
      return;
    }

    // Record exists in both Master and New -> Compare fields
    processedNewCodes.add(rawCode);

    const diffs: FieldDiff[] = [];
    COMPARABLE_FIELDS.forEach(({ key, label }) => {
      const oldVal = masterRecord[key];
      const newVal = newRecord[key];
      const isChanged = !valuesAreEqual(oldVal, newVal);
      if (isChanged) {
        diffs.push({
          field: key as string,
          label,
          oldValue: oldVal ?? '(Empty)',
          newValue: newVal ?? '(Empty)',
          isChanged: true
        });
      }
    });

    // Also check raw custom fields if present
    if (newRecord.rawFields && masterRecord.rawFields) {
      const customKeys = new Set([
        ...Object.keys(newRecord.rawFields),
        ...Object.keys(masterRecord.rawFields)
      ]);
      customKeys.forEach((key) => {
        // Skip keys that correspond to mapped fields
        const isMapped = COMPARABLE_FIELDS.some(f => f.key.toLowerCase() === key.toLowerCase() || f.label.toLowerCase() === key.toLowerCase());
        if (!isMapped && key !== 'tenantCode') {
          const oldRaw = masterRecord.rawFields[key];
          const newRaw = newRecord.rawFields[key];
          if (!valuesAreEqual(oldRaw, newRaw)) {
            diffs.push({
              field: key,
              label: key,
              oldValue: oldRaw ?? '(Empty)',
              newValue: newRaw ?? '(Empty)',
              isChanged: true
            });
          }
        }
      });
    }

    if (diffs.length > 0) {
      items.push({
        id: `upd-${rawCode}`,
        tenantCode: rawCode,
        tenantName: newRecord.tenantName,
        changeType: issues.length > 0 ? 'ERROR' : 'UPDATED',
        diffs,
        masterRecord,
        newRecord,
        reviewStatus: 'approved',
        issues: issues.length > 0 ? issues : undefined,
        rowNumber
      });
    } else {
      items.push({
        id: `unchanged-${rawCode}`,
        tenantCode: rawCode,
        tenantName: newRecord.tenantName,
        changeType: 'UNCHANGED',
        diffs: [],
        masterRecord,
        newRecord,
        reviewStatus: 'approved',
        rowNumber
      });
    }
  });

  // Step 2: Check Master tenants that were NOT present in the new list => MISSING
  masterTenants.forEach((masterRecord) => {
    const rawCode = masterRecord.tenantCode.trim();
    if (!rawCode) return;

    if (!processedNewCodes.has(rawCode)) {
      items.push({
        id: `missing-${rawCode}`,
        tenantCode: rawCode,
        tenantName: masterRecord.tenantName,
        changeType: 'MISSING',
        diffs: [],
        masterRecord,
        reviewStatus: 'pending',
        missingAction: 'keep', // Default safety rule: Never automatically delete!
        issues: ['Missing from latest external system file']
      });
    }
  });

  // Calculate Summary Metrics
  let newCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  let missingCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  items.forEach((item) => {
    switch (item.changeType) {
      case 'NEW':
        newCount++;
        break;
      case 'UPDATED':
        updatedCount++;
        break;
      case 'UNCHANGED':
        unchangedCount++;
        break;
      case 'MISSING':
        missingCount++;
        break;
      case 'DUPLICATE':
        duplicateCount++;
        break;
      case 'ERROR':
        errorCount++;
        break;
    }
  });

  const summary: ComparisonSummary = {
    totalMaster: masterTenants.length,
    totalNew: newTenants.length,
    newCount,
    updatedCount,
    unchangedCount,
    missingCount,
    duplicateCount,
    errorCount
  };

  return { items, summary };
}
