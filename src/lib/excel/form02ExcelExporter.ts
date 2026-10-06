import * as XLSX from 'xlsx';
import { Form02ReportDocument } from '@/src/types/form02Report';
import { computeSummaryGrandTotals } from '@/src/lib/database/form02Store';
import { TenantRecord } from '@/src/types/tenant';
import { classifyTenantForForm02 } from '@/src/lib/database/form02Store';

export function exportForm02Excel(document: Form02ReportDocument, tenants?: TenantRecord[]) {
  const wb = XLSX.utils.book_new();

  const summaryTotals = computeSummaryGrandTotals(document.rows);

  // Helper to format 0 as '-' like in official Ethiopian government financial sheets
  const f = (val: number) => (val === 0 ? '-' : val);

  // Sheet 1: Matrix Sheet (ቅጽ - 02)
  const matrixData: (string | number)[][] = [
    // Row 0: Title Banner
    [document.titleAmharic],

    // Row 1: Section Header
    [
      '',
      'ቅርንጫፍ ጽ/ቤት',
      document.sectionTitleAmharic,
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
    ],

    // Row 2: Level 2 Categories (Residential, Commercial, Grand Total)
    [
      '',
      '',
      'የመኖሪያ ቤት', '', '', '', '', '',
      'የድርጅት ቤት', '', '', '', '', '', '', '', '', '',
      'ጠቅላላ ብዛት', '', '', '', '', '', '', '', '', ''
    ],

    // Row 3: Level 3 Typologies
    [
      'ተ/ቁ',
      'ቅርንጫፍ',
      // Residential (6 columns)
      'አፓርትማ', 'ቆርቆሮ', 'ቪላ', 'ተራ ቤት', 'ሆስቴል', 'ድምር',
      // Commercial (10 columns)
      'አፓርትማ', 'ቆርቆሮ', 'ቪላ', 'ተራ ቤት', 'ሸንሻን', 'አዳራሽ', 'መጋዘን', 'ጋራዥ', 'ሆስቴል', 'ድምር',
      // Grand Total (10 columns)
      'አፓርትማ', 'ቆርቆሮ', 'ቪላ', 'ተራ ቤት', 'ሸንሻን', 'አዳራሽ', 'መጋዘን', 'ጋራዥ', 'ሆስቴል', 'ድምር'
    ]
  ];

  // Data rows
  document.rows.forEach(r => {
    matrixData.push([
      r.sn,
      r.branchName || r.branchCode,
      // Residential
      f(r.residential.apartment),
      f(r.residential.tinRoof),
      f(r.residential.villa),
      f(r.residential.standardHouse),
      f(r.residential.hostel),
      f(r.residential.total),
      // Commercial
      f(r.commercial.apartment),
      f(r.commercial.tinRoof),
      f(r.commercial.villa),
      f(r.commercial.standardHouse),
      f(r.commercial.shenshan),
      f(r.commercial.hall),
      f(r.commercial.warehouse),
      f(r.commercial.garage),
      f(r.commercial.hostel),
      f(r.commercial.total),
      // Grand Total
      f(r.grandTotal.apartment),
      f(r.grandTotal.tinRoof),
      f(r.grandTotal.villa),
      f(r.grandTotal.standardHouse),
      f(r.grandTotal.shenshan),
      f(r.grandTotal.hall),
      f(r.grandTotal.warehouse),
      f(r.grandTotal.garage),
      f(r.grandTotal.hostel),
      f(r.grandTotal.total)
    ]);
  });

  // Totals Row
  matrixData.push([
    '',
    'ድምር',
    // Residential Totals
    f(summaryTotals.residential.apartment),
    f(summaryTotals.residential.tinRoof),
    f(summaryTotals.residential.villa),
    f(summaryTotals.residential.standardHouse),
    f(summaryTotals.residential.hostel),
    f(summaryTotals.residential.total),
    // Commercial Totals
    f(summaryTotals.commercial.apartment),
    f(summaryTotals.commercial.tinRoof),
    f(summaryTotals.commercial.villa),
    f(summaryTotals.commercial.standardHouse),
    f(summaryTotals.commercial.shenshan),
    f(summaryTotals.commercial.hall),
    f(summaryTotals.commercial.warehouse),
    f(summaryTotals.commercial.garage),
    f(summaryTotals.commercial.hostel),
    f(summaryTotals.commercial.total),
    // Grand Totals
    f(summaryTotals.grandTotal.apartment),
    f(summaryTotals.grandTotal.tinRoof),
    f(summaryTotals.grandTotal.villa),
    f(summaryTotals.grandTotal.standardHouse),
    f(summaryTotals.grandTotal.shenshan),
    f(summaryTotals.grandTotal.hall),
    f(summaryTotals.grandTotal.warehouse),
    f(summaryTotals.grandTotal.garage),
    f(summaryTotals.grandTotal.hostel),
    f(summaryTotals.grandTotal.total)
  ]);

  // Spacing
  matrixData.push([]);
  matrixData.push([]);

  // Signatures section matching the exact layout of the uploaded image
  const sig = document.signatures;
  matrixData.push([
    '',
    '',
    'ያዘጋጀው',
    '', '', '', '',
    'ያረጋገጠው',
    '', '', '', '', '', '',
    'የፀደቀው',
    '', '', '', '', '', ''
  ]);

  matrixData.push([
    '',
    '',
    `ስም   ${sig.preparedBy.name || 'አማዋደሽ መላኩ'}`,
    '', '', '', '',
    `ስም   ${sig.verifiedBy.name || 'ተስፋዬ ንጉሴ'}`,
    '', '', '', '', '', '',
    `ስም   ${sig.approvedBy.name || ''}`,
    '', '', '', '', '', ''
  ]);

  matrixData.push([
    '',
    '',
    `ፊርማ   ${sig.preparedBy.signature || '______________'}`,
    '', '', '', '',
    `ፊርማ   ${sig.verifiedBy.signature || '______________'}`,
    '', '', '', '', '', '',
    `ፊርማ   ${sig.approvedBy.signature || '______________'}`,
    '', '', '', '', '', ''
  ]);

  matrixData.push([
    '',
    '',
    `ቀን   ${sig.preparedBy.dateEth || '30/04/2018 ዓ.ም'}`,
    '', '', '', '',
    `ቀን   ${sig.verifiedBy.dateEth || '30/04/2018 ዓ.ም'}`,
    '', '', '', '', '', '',
    `ቀን   ${sig.approvedBy.dateEth || '30/04/2018 ዓ.ም'}`,
    '', '', '', '', '', ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet(matrixData);

  // Configure cell merges
  ws['!merges'] = [
    // Row 0: Title Banner across columns A to AB (0 to 27)
    { s: { r: 0, c: 0 }, e: { r: 0, c: 27 } },

    // Row 1: Section Title across columns C to AB (2 to 27)
    { s: { r: 1, c: 2 }, e: { r: 1, c: 27 } },

    // Row 2: Residential Header across columns C to H (2 to 7)
    { s: { r: 2, c: 2 }, e: { r: 2, c: 7 } },

    // Row 2: Commercial Header across columns I to R (8 to 17)
    { s: { r: 2, c: 8 }, e: { r: 2, c: 17 } },

    // Row 2: Grand Total Header across columns S to AB (18 to 27)
    { s: { r: 2, c: 18 }, e: { r: 2, c: 27 } }
  ];

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // ተ/ቁ
    { wch: 12 }, // ቅርንጫፍ
    // Residential (6)
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
    // Commercial (10)
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
    // Grand Total (10)
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'ቅጽ - 02 (Form 02)');

  // Sheet 2: Disaggregated records if available
  if (tenants && tenants.length > 0) {
    const detailHeaders = [
      'ተ.ቁ',
      'መለያ ኮድ (Identifier)',
      'የተከራይ ስም (Tenant Name)',
      'ቅርንጫፍ / ክ/ከተማ (Branch)',
      'ዋና ምድብ (Category)',
      'የቤቱ ዓይነት (Typology Amharic)',
      'Typology (English)',
      'ታሪካዊ አገልግሎት (Historical Use)',
      'ደረጃ (Grade)',
      'ቤት ቁጥር (House No)',
      'ወርሃዊ ኪራይ (Rent)'
    ];

    const detailRows = tenants.map((t, idx) => {
      const c = classifyTenantForForm02(t);
      return [
        idx + 1,
        c.tenantCode,
        c.tenantName,
        c.branchName,
        c.mainCategory === 'residential' ? 'የመኖሪያ ቤት' : 'የድርጅት ቤት',
        c.typologyLabelAm,
        c.typologyLabelEn,
        c.historicalUse,
        c.buildingGrade,
        c.houseNumber,
        c.rent
      ];
    });

    const wsDetail = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
    wsDetail['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 28 },
      { wch: 22 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 22 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, wsDetail, 'ዝርዝር መረጃ (Records)');
  }

  // Trigger download
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `FHC_Form_02_Housing_Inventory_${dateStr}.xlsx`);
}
