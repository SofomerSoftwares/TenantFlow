import * as XLSX from 'xlsx';
import { TenantRecord } from '@/src/types/tenant';

const BRANCHES = ['Grand Central Plaza', 'Metro Tech Center', 'Westside Galleria', 'Harbor Business Bay', 'Riverside Commerce'];
const CATEGORIES = ['Food & Beverage', 'Retail & Apparel', 'Corporate Office', 'Technology & Media', 'Health & Wellness', 'Financial Services'];

const SAMPLE_NAMES = [
  'Apex Global Logistics', 'Blue Horizon Wellness', 'Crestview Capital', 'Delta Design Studio',
  'Echo Audio Visual', 'Frontier Medical Group', 'Global Prime Partners', 'Harbor Coffee Roasters',
  'Ironwood Furniture Co', 'Jade Garden Bistro', 'Keystone Architectural', 'Lumina Lighting Lab',
  'Monarch Legal Practice', 'Nexus Cyber Solutions', 'Oasis Organic Market', 'Pinnacle Wealth Advisory',
  'Quantum Robotics', 'Radiant Skin Clinic', 'Summit Mountain Gear', 'Terra Verde Cafe',
  'Urban Edge Barber', 'Vanguard Consulting', 'Willow Branch Floral', 'Zenith Aviation Services',
  'Amber Craft Bakery', 'Beacon Street Books', 'Cobalt Fitness Hub', 'Discovery Toys & Games',
  'Enclave Coworking', 'Foundry Creative Agency', 'Granite Rock Gym', 'Halcyon Spa & Retreat',
  'Impulse Dance Studio', 'Juniper Table Bistro', 'Kinetic Sports Rehab', 'Legacy Title & Escrow',
  'Matrix Software Labs', 'Nectar Juice Bar', 'Optima Eye Care', 'Prism Print & Media',
  'Quest Escape Rooms', 'Rhythm Records', 'Silverline Dental', 'Triton Marine Supply',
  'Union Square Tailors', 'Velocity Motor Club', 'Waveform Sound Studios', 'Xcel Tutoring Academy',
  'Yellow Door Gelato', 'Zephyr Clean Energy'
];

export function generate100MasterTenants(): TenantRecord[] {
  const tenants: TenantRecord[] = [];

  for (let i = 1; i <= 100; i++) {
    const codeNum = String(i).padStart(3, '0');
    const tenantCode = `T${codeNum}`;
    const nameIndex = (i - 1) % SAMPLE_NAMES.length;
    const baseName = SAMPLE_NAMES[nameIndex];
    const suffix = i > SAMPLE_NAMES.length ? ` Branch ${Math.floor(i / SAMPLE_NAMES.length) + 1}` : '';
    const tenantName = `${baseName}${suffix}`;
    const branch = BRANCHES[i % BRANCHES.length];
    const floor = `Floor ${Math.floor((i % 10) + 1)}`;
    const unitLetter = String.fromCharCode(65 + (i % 6));
    const unitNumber = 100 + (i % 30);
    const unit = `${unitLetter}-${unitNumber}`;
    const category = CATEGORIES[i % CATEGORIES.length];
    const isInactive = i % 15 === 0;
    const status = isInactive ? 'Inactive' : 'Active';
    const rent = 2500 + (i * 120);
    const phone = `+1 (555) ${String(200 + (i * 7)).padStart(3, '0')}-${String(1000 + (i * 19)).slice(-4)}`;
    const email = `contact@${tenantName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

    const startYear = 2024 - (i % 3);
    const endYear = startYear + 3;
    const month = String((i % 12) + 1).padStart(2, '0');
    const contractStart = `${startYear}-${month}-01`;
    const contractEnd = `${endYear}-${month}-01`;

    tenants.push({
      tenantCode,
      tenantName,
      unit,
      branch,
      floor,
      phone,
      email,
      status,
      rent,
      contractStart,
      contractEnd,
      category,
      rawFields: {
        'Contract Number': `CTR-2026-${codeNum}`,
        'Security Deposit': rent * 2,
        'Square Footage': 850 + (i * 25)
      },
      createdAt: '2026-01-15T08:00:00Z',
      updatedAt: '2026-03-20T10:30:00Z'
    });
  }

  return tenants;
}

export function generateNewSystemTenants(masterTenants: TenantRecord[]): Record<string, any>[] {
  const rows: Record<string, any>[] = [];

  // 1. Take tenants 1 to 90 (Tenants 91 to 100 will be MISSING)
  const presentInNew = masterTenants.slice(0, 90);

  presentInNew.forEach((tenant, idx) => {
    const row: Record<string, any> = {
      'Tenant Code': tenant.tenantCode,
      'Tenant Name': tenant.tenantName,
      'Unit': tenant.unit,
      'Status': tenant.status,
      'Branch': tenant.branch,
      'Floor': tenant.floor,
      'Phone': tenant.phone,
      'Email': tenant.email,
      'Rent': tenant.rent,
      'Contract Start': tenant.contractStart,
      'Contract End': tenant.contractEnd,
      'Category': tenant.category,
      'Contract Number': tenant.rawFields?.['Contract Number'] || `CTR-${tenant.tenantCode}`,
      'Square Footage': tenant.rawFields?.['Square Footage'] || 1000
    };

    // Make some UPDATED tenants with realistic changes:
    if (idx === 0) {
      // T001: Name changed & Status changed
      row['Tenant Name'] = `${tenant.tenantName} Holdings Ltd`;
      row['Status'] = 'Active';
    } else if (idx === 4) {
      // T005: Unit relocation & rent adjustment
      row['Unit'] = 'C-305';
      row['Rent'] = Number(tenant.rent) + 800;
    } else if (idx === 9) {
      // T010: Status changed from Active to Inactive (closed/vacated)
      row['Status'] = 'Inactive';
    } else if (idx === 14) {
      // T015: Phone & Email updated
      row['Phone'] = '+1 (555) 999-8877';
      row['Email'] = 'corporate@frontiermedical.org';
    } else if (idx === 21) {
      // T022: Lease contract renewed
      row['Contract End'] = '2029-12-31';
      row['Rent'] = Number(tenant.rent) * 1.1;
    } else if (idx === 27) {
      // T028: Category & Name tweak
      row['Tenant Name'] = 'Discovery Play & Learning Toys';
      row['Category'] = 'Education & Entertainment';
    } else if (idx === 34) {
      // T035: Floor changed
      row['Floor'] = 'Floor 5';
      row['Unit'] = 'F-501';
    } else if (idx === 41) {
      // T042: Rent increased
      row['Rent'] = 5400;
    }

    rows.push(row);
  });

  // 2. Add NEW tenants (Codes T101 to T112)
  for (let n = 101; n <= 112; n++) {
    const code = `T${n}`;
    rows.push({
      'Tenant Code': code,
      'Tenant Name': `NextGen Retail Venture #${n - 100}`,
      'Unit': `E-${200 + (n - 100)}`,
      'Status': 'Active',
      'Branch': 'Grand Central Plaza',
      'Floor': 'Floor 2',
      'Phone': `+1 (555) 777-${n}`,
      'Email': `hello@nextgen${n}.io`,
      'Rent': 3800,
      'Contract Start': '2026-10-01',
      'Contract End': '2029-09-30',
      'Category': 'Retail & Apparel',
      'Contract Number': `CTR-2026-${n}`,
      'Square Footage': 1150
    });
  }

  // 3. Add DUPLICATE tenant codes to test safety/detection
  rows.push({
    'Tenant Code': 'T005', // Duplicate of T005 in row 5
    'Tenant Name': 'Apex Global Logistics Duplicate Row',
    'Unit': 'C-999',
    'Status': 'Active',
    'Branch': 'Metro Tech Center'
  });

  // 4. Add VALIDATION ERROR rows (Missing Tenant Code, invalid date, etc.)
  rows.push({
    'Tenant Code': '', // Missing code!
    'Tenant Name': 'Orphan Tenant LLC (No Code)',
    'Unit': 'B-101',
    'Status': 'Active'
  });

  rows.push({
    'Tenant Code': 'T999',
    'Tenant Name': 'Invalid Date Retailer',
    'Unit': 'D-404',
    'Status': 'Active',
    'Contract Start': 'invalid-date-format',
    'Contract End': 'not-a-real-date'
  });

  return rows;
}

export function downloadDemoMasterExcel() {
  const masterTenants = generate100MasterTenants();
  const rows = masterTenants.map((t) => ({
    'Tenant Code': t.tenantCode,
    'Tenant Name': t.tenantName,
    'Unit': t.unit,
    'Status': t.status,
    'Branch': t.branch,
    'Floor': t.floor,
    'Phone': t.phone,
    'Email': t.email,
    'Rent': t.rent,
    'Contract Start': t.contractStart,
    'Contract End': t.contractEnd,
    'Category': t.category,
    'Contract Number': t.rawFields?.['Contract Number'],
    'Square Footage': t.rawFields?.['Square Footage']
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Master Tenant List');
  XLSX.writeFile(wb, 'tenant_master_sample.xlsx');
}

export function downloadDemoNewSystemExcel() {
  const masterTenants = generate100MasterTenants();
  const rows = generateNewSystemTenants(masterTenants);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'External System Export');
  XLSX.writeFile(wb, 'tenant_new_system_sample.xlsx');
}
