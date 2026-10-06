import * as XLSX from 'xlsx';
import { Form03ReportDocument } from '@/src/types/form03Report';
import { TenantRecord } from '@/src/types/tenant';
import { classifyTenantForForm02 } from '@/src/lib/database/form02Store';

export function exportForm03Excel(document: Form03ReportDocument, tenants?: TenantRecord[]) {
  const wb = XLSX.utils.book_new();

  // Helper
  const f = (val: number) => val;

  // Sheet 1: Matrix Sheet (ቅጽ - 03)
  const matrixData: (string | number)[][] = [
    // Row 0: Top Header Banner
    [document.topHeaderAmharic],

    // Row 1: Document Title
    [document.titleAmharic],

    // Row 2: Level 1 Headers
    [
      'ተ/ቁ',
      'የቤቶች ዓይነት',
      'መኖሪያ', '',
      'ድርጅት', '',
      'ጠቅላላ ድምር', '',
      'ምርመራ'
    ],

    // Row 3: Level 2 Sub-headers
    [
      '',
      '',
      'የቤት ብዛት', 'የተከራይ ብዛት',
      'የቤት ብዛት', 'የተከራይ ብዛት',
      'የቤት ብዛት', 'የተከራይ ብዛት',
      ''
    ]
  ];

  // Data rows
  document.rows.forEach(r => {
    matrixData.push([
      r.sn,
      r.typologyLabelAm,
      f(r.residential.houseCount),
      f(r.residential.tenantCount),
      f(r.commercial.houseCount),
      f(r.commercial.tenantCount),
      f(r.grandTotal.houseCount),
      f(r.grandTotal.tenantCount),
      r.remarks || ''
    ]);
  });

  // Summary Row
  matrixData.push([
    '',
    'ጠቅላላ ድምር',
    f(document.totals.residential.houseCount),
    f(document.totals.residential.tenantCount),
    f(document.totals.commercial.houseCount),
    f(document.totals.commercial.tenantCount),
    f(document.totals.grandTotal.houseCount),
    f(document.totals.grandTotal.tenantCount),
    ''
  ]);

  // Spacing
  matrixData.push([]);
  matrixData.push([]);

  // Signatures section matching the uploaded image exactly
  const sig = document.signatures;
  matrixData.push([
    'ያዘጋጀው',
    '',
    'ያረጋገጠው',
    '',
    '',
    'የፀደቀው',
    '',
    '',
    ''
  ]);

  matrixData.push([
    `ስም    ${sig.preparedBy.name || 'አማዋደሽ መላኩ'}`,
    '',
    `ስም    ${sig.verifiedBy.name || 'ተስፋዬ ንጉሴ'}`,
    '',
    '',
    `ስም    ${sig.approvedBy.name || ''}`,
    '',
    '',
    ''
  ]);

  matrixData.push([
    `ፊርማ   ${sig.preparedBy.signature || '______________'}`,
    '',
    `ፊርማ   ${sig.verifiedBy.signature || '______________'}`,
    '',
    '',
    `ፊርማ   ${sig.approvedBy.signature || '______________'}`,
    '',
    '',
    ''
  ]);

  matrixData.push([
    `ቀን   ${sig.preparedBy.dateEth || '30/04/2018 ዓ.ም'}`,
    '',
    `ቀን   ${sig.verifiedBy.dateEth || '30/04/2018 ዓ.ም'}`,
    '',
    '',
    `ቀን   ${sig.approvedBy.dateEth || '30/04/2018 ዓ.ም'}`,
    '',
    '',
    ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet(matrixData);

  // Configure cell merges
  ws['!merges'] = [
    // Row 0: Top Header Banner across columns A to I (0 to 8)
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },

    // Row 1: Document Title across columns A to I (0 to 8)
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },

    // Row 2 & 3: S.N (Col A)
    { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },

    // Row 2 & 3: Typology (Col B)
    { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },

    // Row 2: Residential Header across columns C to D (2 to 3)
    { s: { r: 2, c: 2 }, e: { r: 2, c: 3 } },

    // Row 2: Commercial Header across columns E to F (4 to 5)
    { s: { r: 2, c: 4 }, e: { r: 2, c: 5 } },

    // Row 2: Grand Total Header across columns G to H (6 to 7)
    { s: { r: 2, c: 6 }, e: { r: 2, c: 7 } },

    // Row 2 & 3: Remarks (Col I)
    { s: { r: 2, c: 8 }, e: { r: 3, c: 8 } }
  ];

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // ተ/ቁ
    { wch: 18 }, // የቤቶች ዓይነት
    { wch: 14 }, // መኖሪያ - የቤት ብዛት
    { wch: 14 }, // መኖሪያ - የተከራይ ብዛት
    { wch: 14 }, // ድርጅት - የቤት ብዛት
    { wch: 14 }, // ድርጅት - የተከራይ ብዛት
    { wch: 14 }, // ጠቅላላ - የቤት ብዛት
    { wch: 14 }, // ጠቅላላ - የተከራይ ብዛት
    { wch: 18 }  // ምርመራ
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'ቅጽ - 03 (Form 03)');

  // Sheet 2: Disaggregated records if available
  if (tenants && tenants.length > 0) {
    const detailHeaders = [
      'ተ.ቁ',
      'መለያ ኮድ (Identifier)',
      'የተከራይ ስም (Tenant Name)',
      'ሁኔታ (Occupancy Status)',
      'ቅርንጫፍ (Branch)',
      'ዋና ምድብ (Category)',
      'የቤቱ ዓይነት (Typology Amharic)',
      'ቤት ቁጥር (House No)',
      'ወርሃዊ ኪራይ (Rent)'
    ];

    const detailRows = tenants.map((t, idx) => {
      const c = classifyTenantForForm02(t);
      const isOccupied =
        t.status !== 'Vacant' &&
        t.status !== 'Inactive' &&
        Boolean(t.tenant_name || t.tenantName);

      return [
        idx + 1,
        t.identifier_code || t.tenantCode,
        t.tenant_name || t.tenantName || '— (ክፍት ቤት / Vacant)',
        isOccupied ? 'የተከራየ (Occupied)' : 'ያልተከራየ (Vacant)',
        t.branch || t.sub_city || '1',
        c.mainCategory === 'residential' ? 'የመኖሪያ ቤት' : 'የድርጅት ቤት',
        c.typologyLabelAm,
        t.house_number || t.unit || '',
        t.rent_amount || t.rent || 0
      ];
    });

    const wsDetail = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
    wsDetail['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 28 },
      { wch: 18 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, wsDetail, 'ዝርዝር ቤቶችና ተከራዮች (Records)');
  }

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `FHC_Form_03_Houses_and_Tenants_${dateStr}.xlsx`);
}
