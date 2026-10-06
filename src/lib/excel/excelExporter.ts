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
  fileNamePrefix: string = 'Property_Registry_Export'
) {
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `${fileNamePrefix}_${dateStr}.xlsx`;

  // Determine headers preserving complete property registry order
  const dataRows: Record<string, any>[] = updatedTenants.map((t) => {
    const row: Record<string, any> = {
      'መለያ (Identifier)': t.identifier_code || t.tenantCode,
      'ከተማ (City)': t.city || 'Addis Ababa',
      'ክ/ከተማ (Sub-City)': t.sub_city || t.branch || '',
      'ወረዳ (Woreda)': t.woreda || '',
      'ቀበሌ (Kebele)': t.kebele || '',
      'ቤት ቁጥር (House No.)': t.house_number || t.unit || '',
      'የኮምፕሌክስ ወ./ቁጥር (Complex No.)': t.complex_no || '',
      'ማዕረግ (Title)': t.title || '',
      'የተከራይ ስም (Tenant Name)': t.tenant_name || t.tenantName,
      'የነዋሪ ስም (Resident Name)': t.resident_name || t.tenant_name || t.tenantName,
      'ጾታ (Gender)': t.gender || '',
      'የቤት ታሪካዊ አገልግሎት (Historical Use)': t.historical_use || t.category || '',
      'ዋና ቤት (Main House)': t.main_house || 'Main',
      'የመኝታ ክፍል (Bedrooms)': t.bedroom_count || 0,
      'የመታጠቢያ ክፍል (Bathrooms)': t.bathroom_count || 0,
      'የኪችን ክፍል (Kitchen)': t.kitchen_count || 0,
      'የሰርቪስ ቤት (Service Rooms)': t.service_room_count || 0,
      'ሌላ ክፍል (Other Rooms)': t.other_rooms_count || 0,
      'ጠቅላላ የክፍል ብዛት (Total Rooms)': t.total_rooms || 0,
      'የወለል ደረጃ (Floor Level)': t.floor_level || t.floor || '',
      'የቤቱ ደረጃ (Building Grade)': t.building_grade || '',
      'የቦታ ደረጃ (Site Grade)': t.site_grade || '',
      'ብሎክ ቁጥር (Block No.)': t.block_no || '',
      'ፓርሰል ቁጥር (Parcel No.)': t.parcel_no || '',
      'ስፋት (Area in m²)': t.area_sqm || '',
      'የኪራይ መጠን (Rent Amount)': t.rent_amount !== undefined ? t.rent_amount : (t.rent || ''),
      'የተገነባበት ዓ.ም (Year Built)': t.year_built || '',
      'የታደሰበት ዓ.ም (Year Renovated)': t.year_renovated || '',
      'የይዞታ ዓይነት/ሁኔታ (Tenure Type)': t.tenure_type || '',
      'የስራ ዓይነት/ሁኔታ (Work Status)': t.work_status || t.status || '',
      'X COORDINATE': t.x_coordinate || '',
      'Y COORDINATE': t.y_coordinate || '',
      'የቤቱ መገኛ (Location)': t.house_location || '',
      'Mobile (ስልክ)': t.mobile_phone || t.phone || '',
      'Remark (ማስታወሻ)': t.remarks || ''
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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Property Registry');

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

export function exportBlankRegistryTemplateExcel() {
  const headers = [
    'መለያ (Identifier)',
    'ከተማ (City)',
    'ክ/ከተማ (Sub-City)',
    'ወረዳ (Woreda)',
    'ቀበሌ (Kebele)',
    'ቤት ቁጥር (House No.)',
    'የኮምፕሌክስ ወ./ቁጥር (Complex No.)',
    'ማዕረግ (Title)',
    'የተከራይ ስም (Tenant Name)',
    'የነዋሪ ስም (Resident Name)',
    'ጾታ (Gender)',
    'የቤት ታሪካዊ አገልግሎት (Historical Use)',
    'ዋና ቤት (Main House)',
    'የመኝታ ክፍል (Bedrooms)',
    'የመታጠቢያ ክፍል (Bathrooms)',
    'የኪችን ክፍል (Kitchen)',
    'የሰርቪስ ቤት (Service Rooms)',
    'ሌላ ክፍል (Other Rooms)',
    'ጠቅላላ የክፍል ብዛት (Total Rooms)',
    'የወለል ደረጃ (Floor Level)',
    'የቤቱ ደረጃ (Building Grade)',
    'የቦታ ደረጃ (Site Grade)',
    'ብሎክ ቁጥር (Block No.)',
    'ፓርሰል ቁጥር (Parcel No.)',
    'ስፋት (Area in m²)',
    'የኪራይ መጠን (Rent Amount)',
    'የተገነባበት ዓ.ም (Year Built)',
    'የታደሰበት ዓ.ም (Year Renovated)',
    'የይዞታ ዓይነት/ሁኔታ (Tenure Type)',
    'የስራ ዓይነት/ሁኔታ (Work Status)',
    'X COORDINATE',
    'Y COORDINATE',
    'የቤቱ መገኛ (Location)',
    'ስልክ (Mobile Phone)',
    'ማስታወሻ (Remarks)'
  ];

  const emptyRow: Record<string, string> = {};
  headers.forEach((h) => {
    emptyRow[h] = '';
  });

  const worksheet = XLSX.utils.json_to_sheet([emptyRow]);
  // Clear the placeholder row data so sheet only contains headers
  worksheet['!ref'] = `A1:${XLSX.utils.encode_col(headers.length - 1)}1`;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Property Registry Template');
  downloadWorkbook(workbook, 'property_registry_template.xlsx');
}
