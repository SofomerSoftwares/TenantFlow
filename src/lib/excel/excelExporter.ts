import * as XLSX from 'xlsx';
import {
  TenantRecord,
  TenantComparisonItem,
  TenantHistoryItem
} from '@/src/types/tenant';

function downloadWorkbook(workbook: XLSX.WorkBook, fileName: string) {
  XLSX.writeFile(workbook, fileName, { compression: true });
}

export function exportUpdatedMasterExcel(
  updatedTenants: TenantRecord[],
  fileNamePrefix: string = 'Tenant_List_Updated'
) {
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `${fileNamePrefix}_${dateStr}.xlsx`;

  // Determine headers preserving original or comprehensive order
  const dataRows: Record<string, any>[] = updatedTenants.map((t) => {
    // Lead with clean standard tenant headers
    const row: Record<string, any> = {
      'Tenant Code': t.tenantCode,
      'Tenant Name': t.tenantName,
      'Unit': t.unit,
      'Status': t.status,
      'Branch': t.branch || '',
      'Floor': t.floor || '',
      'Phone': t.phone || '',
      'Email': t.email || '',
      'Rent': t.rent || '',
      'Contract Start': t.contractStart || '',
      'Contract End': t.contractEnd || '',
      'Category': t.category || ''
    };

    // Append any extra preserved raw columns
    if (t.rawFields) {
      Object.keys(t.rawFields).forEach((k) => {
        if (!row[k] && k !== 'tenantCode' && k !== 'tenantName' && k !== 'unit' && k !== 'status') {
          row[k] = t.rawFields[k];
        }
      });
    }

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(dataRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Tenants');

  downloadWorkbook(workbook, fileName);
}

export function exportNewTenantsExcel(items: TenantComparisonItem[]) {
  const newItems = items.filter((i) => i.changeType === 'NEW');
  const rows = newItems.map((item) => {
    const rec = item.newRecord;
    return {
      'Tenant Code': item.tenantCode,
      'Tenant Name': item.tenantName,
      'Unit': rec?.unit || '',
      'Branch': rec?.branch || '',
      'Status': rec?.status || 'Active',
      'Phone': rec?.phone || '',
      'Email': rec?.email || '',
      'Rent': rec?.rent || '',
      'Contract Start': rec?.contractStart || '',
      'Contract End': rec?.contractEnd || ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'New Tenants');
  downloadWorkbook(workbook, `New_Tenants_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportUpdatedTenantsExcel(items: TenantComparisonItem[]) {
  const updatedItems = items.filter((i) => i.changeType === 'UPDATED');
  const rows = updatedItems.map((item) => {
    const changedFields = item.diffs.map((d) => d.label).join(', ');
    return {
      'Tenant Code': item.tenantCode,
      'Tenant Name': item.tenantName,
      'Unit': item.newRecord?.unit || item.masterRecord?.unit || '',
      'Status': item.newRecord?.status || item.masterRecord?.status || '',
      'Total Changes': item.diffs.length,
      'Changed Fields': changedFields
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Updated Tenants');
  downloadWorkbook(workbook, `Updated_Tenants_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportMissingTenantsExcel(items: TenantComparisonItem[]) {
  const missingItems = items.filter((i) => i.changeType === 'MISSING');
  const rows = missingItems.map((item) => {
    const rec = item.masterRecord;
    return {
      'Tenant Code': item.tenantCode,
      'Tenant Name': item.tenantName,
      'Unit': rec?.unit || '',
      'Branch': rec?.branch || '',
      'Current Status': rec?.status || 'Active',
      'Action Taken': item.missingAction || 'keep',
      'Note': 'Missing from latest external system file'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Missing Tenants');
  downloadWorkbook(workbook, `Missing_Tenants_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportChangeReportExcel(
  items: TenantComparisonItem[],
  updatedBy: string = 'Admin'
) {
  const dateStr = new Date().toISOString().split('T')[0];
  const reportRows: Record<string, any>[] = [];

  items.forEach((item) => {
    if (item.changeType === 'UPDATED') {
      item.diffs.forEach((diff) => {
        reportRows.push({
          'Tenant Code': item.tenantCode,
          'Tenant Name': item.tenantName,
          'Field': diff.label,
          'Old Value': String(diff.oldValue ?? ''),
          'New Value': String(diff.newValue ?? ''),
          'Change Type': 'UPDATED',
          'Updated By': updatedBy,
          'Updated Date': dateStr
        });
      });
    } else if (item.changeType === 'NEW') {
      reportRows.push({
        'Tenant Code': item.tenantCode,
        'Tenant Name': item.tenantName,
        'Field': 'ALL (New Record)',
        'Old Value': '(None)',
        'New Value': 'Created',
        'Change Type': 'NEW',
        'Updated By': updatedBy,
        'Updated Date': dateStr
      });
    } else if (item.changeType === 'MISSING') {
      reportRows.push({
        'Tenant Code': item.tenantCode,
        'Tenant Name': item.tenantName,
        'Field': 'Presence',
        'Old Value': 'Active in Master',
        'New Value': item.missingAction === 'deactivate' ? 'Deactivated' : item.missingAction === 'remove' ? 'Removed' : 'Kept (No change)',
        'Change Type': 'MISSING',
        'Updated By': updatedBy,
        'Updated Date': dateStr
      });
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(reportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Change Report');
  downloadWorkbook(workbook, `Change_Report_${dateStr}.xlsx`);
}

export function exportValidationErrorsExcel(items: TenantComparisonItem[]) {
  const errorItems = items.filter((i) => i.changeType === 'ERROR' || i.changeType === 'DUPLICATE' || (i.issues && i.issues.length > 0));
  const rows = errorItems.map((item) => {
    return {
      'Row Number': item.rowNumber || 'N/A',
      'Tenant Code': item.tenantCode,
      'Tenant Name': item.tenantName,
      'Issue Type': item.changeType,
      'Validation Issues': item.issues?.join('; ') || 'Unknown Issue'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Validation Errors');
  downloadWorkbook(workbook, `Validation_Errors_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportHistoryItemsExcel(history: TenantHistoryItem[]) {
  const dateStr = new Date().toISOString().split('T')[0];
  const rows = history.map((h) => ({
    'Tenant Code': h.tenantCode,
    'Tenant Name': h.tenantName,
    'Field': h.field,
    'Old Value': h.oldValue,
    'New Value': h.newValue,
    'Change Type': h.changeType,
    'Updated By': h.updatedBy,
    'Date': h.updatedDate,
    'Session ID': h.sessionId
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'History Audit');
  downloadWorkbook(workbook, `Audit_History_${dateStr}.xlsx`);
}
