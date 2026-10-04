import * as XLSX from 'xlsx';
import { ParsedExcelFile, TenantRecord } from '@/src/types/tenant';
import { detectColumnMapping } from './columnDetector';

export async function parseExcelFile(file: File): Promise<ParsedExcelFile> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded spreadsheet contains no sheets.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Parse rows as raw JSON array of objects
  const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd'
  });

  if (rawData.length === 0) {
    throw new Error('The spreadsheet sheet appears to be empty or has no data rows.');
  }

  // Extract all distinct headers from keys
  const headerSet = new Set<string>();
  rawData.forEach(row => {
    Object.keys(row).forEach(key => headerSet.add(key.trim()));
  });
  const headers = Array.from(headerSet);

  const { mapping, isTenantCodeDetected } = detectColumnMapping(headers);

  return {
    fileName: file.name,
    fileSize: file.size,
    fileSizeBytes: file.size,
    headers,
    rows: rawData,
    totalRows: rawData.length,
    detectedMapping: mapping,
    isTenantCodeDetected
  };
}

export function convertRowsToTenantRecords(
  rows: Record<string, any>[],
  mapping: { tenantCode: string; tenantName?: string; unit?: string; [k: string]: any }
): TenantRecord[] {
  const codeKey = mapping.tenantCode;
  const nameKey = mapping.tenantName;
  const unitKey = mapping.unit;
  const phoneKey = mapping.phone;
  const emailKey = mapping.email;
  const statusKey = mapping.status;
  const branchKey = mapping.branch;
  const floorKey = mapping.floor;
  const rentKey = mapping.rent;
  const startKey = mapping.contractStart;
  const endKey = mapping.contractEnd;
  const catKey = mapping.category;

  return rows.map((row) => {
    const rawCode = String(row[codeKey] ?? '').trim();
    const rawName = nameKey ? String(row[nameKey] ?? '').trim() : '';
    const rawUnit = unitKey ? String(row[unitKey] ?? '').trim() : '';
    const rawPhone = phoneKey ? String(row[phoneKey] ?? '').trim() : '';
    const rawEmail = emailKey ? String(row[emailKey] ?? '').trim() : '';
    const rawStatus = statusKey ? String(row[statusKey] ?? '').trim() : 'Active';
    const rawBranch = branchKey ? String(row[branchKey] ?? '').trim() : undefined;
    const rawFloor = floorKey ? String(row[floorKey] ?? '').trim() : undefined;
    const rawRent = rentKey ? row[rentKey] : undefined;
    const rawStart = startKey ? String(row[startKey] ?? '').trim() : undefined;
    const rawEnd = endKey ? String(row[endKey] ?? '').trim() : undefined;
    const rawCat = catKey ? String(row[catKey] ?? '').trim() : undefined;

    return {
      tenantCode: rawCode,
      tenantName: rawName || 'Unnamed Tenant',
      unit: rawUnit || 'N/A',
      branch: rawBranch,
      floor: rawFloor,
      phone: rawPhone,
      email: rawEmail,
      status: normalizeStatus(rawStatus),
      rent: rawRent,
      contractStart: rawStart,
      contractEnd: rawEnd,
      category: rawCat,
      rawFields: { ...row }
    };
  });
}

function normalizeStatus(statusStr: string): string {
  if (!statusStr) return 'Active';
  const s = statusStr.trim().toLowerCase();
  if (['active', 'act', 'occupied', 'current', 'valid'].includes(s)) return 'Active';
  if (['inactive', 'vacant', 'terminated', 'closed', 'expired'].includes(s)) return 'Inactive';
  if (['pending', 'onboarding', 'draft'].includes(s)) return 'Pending';
  return statusStr.trim();
}
