import { ColumnMapping } from '@/src/types/tenant';

// Alias patterns for intelligent column detection
const TENANT_CODE_ALIASES = [
  'tenant code',
  'tenant_code',
  'tenantcode',
  'tenant id',
  'tenant_id',
  'tenantid',
  'tenant no',
  'tenant_no',
  'tenantno',
  'tenant number',
  'tenant_number',
  'code',
  'cust code',
  'customer code',
  'client id'
];

const TENANT_NAME_ALIASES = [
  'tenant name',
  'tenant_name',
  'tenantname',
  'name',
  'company name',
  'company_name',
  'shop name',
  'shop_name',
  'business name',
  'client name',
  'tenant'
];

const UNIT_ALIASES = [
  'unit',
  'shop number',
  'shop no',
  'shop_no',
  'unit number',
  'unit no',
  'unit_no',
  'room',
  'lot',
  'space',
  'suite'
];

const PHONE_ALIASES = [
  'phone',
  'telephone',
  'mobile',
  'phone number',
  'contact number',
  'tel'
];

const EMAIL_ALIASES = [
  'email',
  'email address',
  'e-mail',
  'contact email'
];

const STATUS_ALIASES = [
  'status',
  'tenant status',
  'lease status',
  'state'
];

const BRANCH_ALIASES = [
  'branch',
  'location',
  'property',
  'building',
  'mall',
  'center'
];

const FLOOR_ALIASES = [
  'floor',
  'level',
  'storey'
];

const RENT_ALIASES = [
  'rent',
  'monthly rent',
  'base rent',
  'rate',
  'amount'
];

const CONTRACT_START_ALIASES = [
  'contract start',
  'start date',
  'lease start',
  'commencement date'
];

const CONTRACT_END_ALIASES = [
  'contract end',
  'end date',
  'lease end',
  'expiration date',
  'expiry date'
];

const CATEGORY_ALIASES = [
  'category',
  'business type',
  'industry',
  'trade type',
  'sector'
];

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[-_.\s]+/g, ' ');
}

function findBestMatch(headers: string[], aliases: string[]): string | undefined {
  // Pass 1: Exact match with normalized alias
  for (const header of headers) {
    const norm = normalizeHeader(header);
    if (aliases.includes(norm)) {
      return header;
    }
  }

  // Pass 2: Header contains alias or alias contains header
  for (const header of headers) {
    const norm = normalizeHeader(header);
    for (const alias of aliases) {
      if (norm === alias || norm.includes(alias)) {
        return header;
      }
    }
  }

  return undefined;
}

export function detectColumnMapping(headers: string[]): {
  mapping: ColumnMapping;
  isTenantCodeDetected: boolean;
} {
  const codeCol = findBestMatch(headers, TENANT_CODE_ALIASES);
  const nameCol = findBestMatch(headers, TENANT_NAME_ALIASES);
  const unitCol = findBestMatch(headers, UNIT_ALIASES);
  const phoneCol = findBestMatch(headers, PHONE_ALIASES);
  const emailCol = findBestMatch(headers, EMAIL_ALIASES);
  const statusCol = findBestMatch(headers, STATUS_ALIASES);
  const branchCol = findBestMatch(headers, BRANCH_ALIASES);
  const floorCol = findBestMatch(headers, FLOOR_ALIASES);
  const rentCol = findBestMatch(headers, RENT_ALIASES);
  const startCol = findBestMatch(headers, CONTRACT_START_ALIASES);
  const endCol = findBestMatch(headers, CONTRACT_END_ALIASES);
  const catCol = findBestMatch(headers, CATEGORY_ALIASES);

  return {
    mapping: {
      tenantCode: codeCol || '',
      tenantName: nameCol,
      unit: unitCol,
      phone: phoneCol,
      email: emailCol,
      status: statusCol,
      branch: branchCol,
      floor: floorCol,
      rent: rentCol,
      contractStart: startCol,
      contractEnd: endCol,
      category: catCol,
    },
    isTenantCodeDetected: Boolean(codeCol)
  };
}
