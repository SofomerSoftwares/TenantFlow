import * as XLSX from 'xlsx';
import { Form01ReportDocument, TenantForm01Classification } from '@/src/types/report';

export function exportForm01Excel(document: Form01ReportDocument) {
  const wb = XLSX.utils.book_new();

  // Prepare raw worksheet data array representing the official 3-tier header
  const sheetData: (string | number)[][] = [
    // Row 0: Title Banner
    [document.titleAmharic],
    // Row 1: Subtitle
    [`የሪፖርት ወቅት: ${document.cutoffDateEth} | ቅጽ ቁጥር: ${document.formNumber} | Source: Update Tenant Table (${document.sourceTenantCount ?? document.rows.reduce((acc, r) => acc + r.inBranchOffice.total, 0)} records)`],
    // Row 2: Empty spacer
    [],
    // Row 3: Tier 1 Headers
    [
      'ተ.ቁ',
      'ቅርንጫፍ',
      'በቅርንጫፉ ጽ/ቤት የሚገኙ ቤቶች ብዛት እስከ...ሰኔ',
      '',
      '',
      'እስከ ሰኔ 30/2018 ዓ.ም በተለያየ መንገድ ከኮርፖሬሽኑ የወጡ ቤቶች ብዛት',
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      'ቀሪ በስራ ላይ ያሉ ቤቶች',
      '',
      '',
      'ምርመራ'
    ],
    // Row 4: Tier 2 Headers
    [
      '',
      '',
      '', '', '', // under inBranchOffice
      'በልማት የፈረሱ', '', '',
      'ለሌላ ተቋም በውሳኔ', '', '',
      'በሽያጭ', '', '',
      'የተቀላቀሉ', '', '',
      'ሌላ', '', '',
      'በፕራይቬታይዜሽን ውሳኔ', '', '',
      'በፍርድ ቤት ውሳኔ', '', '',
      'በጠቅላላው ከቅርንጫፉ / ከአጀንሲው', '', '',
      '', '', '', // under remainingActive
      '' // under remarks
    ],
    // Row 5: Tier 3 Headers (መኖሪያ, ድርጅት, ድምር)
    [
      '',
      '',
      'መኖሪያ', 'ድርጅት', 'ድምር',
      'መኖሪያ', 'ድርጅት', 'ድምር',
      'መኖሪያ', 'ድርጅት', 'ድምር',
      'መኖሪያ', 'ድርጅት', 'ድምር',
      'መኖሪያ', 'ድርጅት', 'ድምር',
      'መኖሪያ', 'ድርጅት', 'ድምር',
      'መኖሪያ', 'ድርጅት', 'ድምር',
      'መኖሪያ', 'ድርጅት', 'ድምር',
      'መኖሪያ', 'ድርጅት', 'ድምር',
      'መኖሪያ', 'ድርጅት', 'ድምር',
      ''
    ]
  ];

  // Populate data rows for each branch
  document.rows.forEach(r => {
    const rem = r.remainingActive || {
      residential: Math.max(0, r.inBranchOffice.residential - r.totalExited.residential),
      commercial: Math.max(0, r.inBranchOffice.commercial - r.totalExited.commercial),
      total: Math.max(0, r.inBranchOffice.total - r.totalExited.total)
    };

    sheetData.push([
      r.sn,
      r.branchName,
      r.inBranchOffice.residential,
      r.inBranchOffice.commercial,
      r.inBranchOffice.total,
      r.demolished.residential,
      r.demolished.commercial,
      r.demolished.total,
      r.transferredByDecision.residential,
      r.transferredByDecision.commercial,
      r.transferredByDecision.total,
      r.sold.residential,
      r.sold.commercial,
      r.sold.total,
      r.merged.residential,
      r.merged.commercial,
      r.merged.total,
      r.other.residential,
      r.other.commercial,
      r.other.total,
      r.privatized.residential,
      r.privatized.commercial,
      r.privatized.total,
      r.courtDecision.residential,
      r.courtDecision.commercial,
      r.courtDecision.total,
      r.totalExited.residential,
      r.totalExited.commercial,
      r.totalExited.total,
      rem.residential,
      rem.commercial,
      rem.total,
      r.remarks || ''
    ]);
  });

  // Calculate Grand Totals row
  const totals = {
    inBranch: { res: 0, com: 0, tot: 0 },
    demolished: { res: 0, com: 0, tot: 0 },
    transferred: { res: 0, com: 0, tot: 0 },
    sold: { res: 0, com: 0, tot: 0 },
    merged: { res: 0, com: 0, tot: 0 },
    other: { res: 0, com: 0, tot: 0 },
    privatized: { res: 0, com: 0, tot: 0 },
    court: { res: 0, com: 0, tot: 0 },
    totalExited: { res: 0, com: 0, tot: 0 },
    remaining: { res: 0, com: 0, tot: 0 }
  };

  document.rows.forEach(r => {
    totals.inBranch.res += r.inBranchOffice.residential;
    totals.inBranch.com += r.inBranchOffice.commercial;
    totals.inBranch.tot += r.inBranchOffice.total;

    totals.demolished.res += r.demolished.residential;
    totals.demolished.com += r.demolished.commercial;
    totals.demolished.tot += r.demolished.total;

    totals.transferred.res += r.transferredByDecision.residential;
    totals.transferred.com += r.transferredByDecision.commercial;
    totals.transferred.tot += r.transferredByDecision.total;

    totals.sold.res += r.sold.residential;
    totals.sold.com += r.sold.commercial;
    totals.sold.tot += r.sold.total;

    totals.merged.res += r.merged.residential;
    totals.merged.com += r.merged.commercial;
    totals.merged.tot += r.merged.total;

    totals.other.res += r.other.residential;
    totals.other.com += r.other.commercial;
    totals.other.tot += r.other.total;

    totals.privatized.res += r.privatized.residential;
    totals.privatized.com += r.privatized.commercial;
    totals.privatized.tot += r.privatized.total;

    totals.court.res += r.courtDecision.residential;
    totals.court.com += r.courtDecision.commercial;
    totals.court.tot += r.courtDecision.total;

    totals.totalExited.res += r.totalExited.residential;
    totals.totalExited.com += r.totalExited.commercial;
    totals.totalExited.tot += r.totalExited.total;

    const rem = r.remainingActive || {
      residential: Math.max(0, r.inBranchOffice.residential - r.totalExited.residential),
      commercial: Math.max(0, r.inBranchOffice.commercial - r.totalExited.commercial),
      total: Math.max(0, r.inBranchOffice.total - r.totalExited.total)
    };
    totals.remaining.res += rem.residential;
    totals.remaining.com += rem.commercial;
    totals.remaining.tot += rem.total;
  });

  sheetData.push([
    '',
    'ድምር (Grand Total)',
    totals.inBranch.res,
    totals.inBranch.com,
    totals.inBranch.tot,
    totals.demolished.res,
    totals.demolished.com,
    totals.demolished.tot,
    totals.transferred.res,
    totals.transferred.com,
    totals.transferred.tot,
    totals.sold.res,
    totals.sold.com,
    totals.sold.tot,
    totals.merged.res,
    totals.merged.com,
    totals.merged.tot,
    totals.other.res,
    totals.other.com,
    totals.other.tot,
    totals.privatized.res,
    totals.privatized.com,
    totals.privatized.tot,
    totals.court.res,
    totals.court.com,
    totals.court.tot,
    totals.totalExited.res,
    totals.totalExited.com,
    totals.totalExited.tot,
    totals.remaining.res,
    totals.remaining.com,
    totals.remaining.tot,
    ''
  ]);

  // Sign-off section
  sheetData.push([]);
  sheetData.push([
    `ያዘጋጀው: ${document.preparedBy || '______________________'}`,
    '', '', '', '',
    `ያረጋገጠው: ${document.verifiedBy || '______________________'}`,
    '', '', '', '',
    `ያጸደቀው: ${document.approvedBy || '______________________'}`
  ]);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set merges to recreate the exact layout
  ws['!merges'] = [
    // Title row 0 across 33 columns
    { s: { r: 0, c: 0 }, e: { r: 0, c: 32 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 32 } },
    // ተ.ቁ across rows 3, 4, 5
    { s: { r: 3, c: 0 }, e: { r: 5, c: 0 } },
    // ቅርንጫፍ across rows 3, 4, 5
    { s: { r: 3, c: 1 }, e: { r: 5, c: 1 } },
    // በቅርንጫፉ ጽ/ቤት የሚገኙ ቤቶች ብዛት across cols 2-4, rows 3-4
    { s: { r: 3, c: 2 }, e: { r: 4, c: 4 } },
    // እስከ ሰኔ 30/2018 ዓ.ም በተለያየ መንገድ ከኮርፖሬሽኑ የወጡ ቤቶች ብዛት across cols 5-28, row 3
    { s: { r: 3, c: 5 }, e: { r: 3, c: 28 } },

    // Tier 2 sub-groups (row 4):
    { s: { r: 4, c: 5 }, e: { r: 4, c: 7 } },   // በልማት የፈረሱ
    { s: { r: 4, c: 8 }, e: { r: 4, c: 10 } },  // ለሌላ ተቋም በውሳኔ
    { s: { r: 4, c: 11 }, e: { r: 4, c: 13 } }, // በሽያጭ
    { s: { r: 4, c: 14 }, e: { r: 4, c: 16 } }, // የተቀላቀሉ
    { s: { r: 4, c: 17 }, e: { r: 4, c: 19 } }, // ሌላ
    { s: { r: 4, c: 20 }, e: { r: 4, c: 22 } }, // በፕራይቬታይዜሽን ውሳኔ
    { s: { r: 4, c: 23 }, e: { r: 4, c: 25 } }, // በፍርድ ቤት ውሳኔ
    { s: { r: 4, c: 26 }, e: { r: 4, c: 28 } }, // በጠቅላላው ከቅርንጫፉ

    // ቀሪ በስራ ላይ ያሉ ቤቶች across cols 29-31, rows 3-4
    { s: { r: 3, c: 29 }, e: { r: 4, c: 31 } },
    // ምርመራ across rows 3, 4, 5
    { s: { r: 3, c: 32 }, e: { r: 5, c: 32 } }
  ];

  // Set column widths
  const colWidths: { wch: number }[] = [
    { wch: 6 },  // S/N
    { wch: 32 }, // Branch
    // 3 x In Branch
    { wch: 9 }, { wch: 9 }, { wch: 10 },
    // 24 x Exit reasons (8 groups x 3)
    { wch: 8 }, { wch: 8 }, { wch: 9 },
    { wch: 8 }, { wch: 8 }, { wch: 9 },
    { wch: 8 }, { wch: 8 }, { wch: 9 },
    { wch: 8 }, { wch: 8 }, { wch: 9 },
    { wch: 8 }, { wch: 8 }, { wch: 9 },
    { wch: 8 }, { wch: 8 }, { wch: 9 },
    { wch: 8 }, { wch: 8 }, { wch: 9 },
    { wch: 9 }, { wch: 9 }, { wch: 11 }, // Total exit
    // Remaining Active
    { wch: 9 }, { wch: 9 }, { wch: 11 },
    // Remarks
    { wch: 25 }
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'ቅጽ - 01 Form 01');

  const fileName = `FHC_Form01_Housing_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Exports the raw disaggregated supporting tenant records from the update tenant table
 */
export function exportForm01DisaggregatedExcel(records: TenantForm01Classification[]) {
  const wb = XLSX.utils.book_new();

  const rows = records.map((r, i) => ({
    'ተ.ቁ (S/N)': i + 1,
    'የተከራይ / ንብረት መለያ (Code)': r.tenantCode,
    'የተከራይ ስም (Tenant Name)': r.tenantName,
    'ቅርንጫፍ / ክ/ከተማ (Branch)': r.branchName,
    'ወረዳ (Woreda)': r.woreda,
    'ቤት ቁጥር (House No)': r.unit,
    'የቤት ምድብ (Category)': r.categoryLabelAm,
    'የቤት ምድብ እንግሊዝኛ (Category EN)': r.categoryLabelEn,
    'የይዞታ/ስራ ሁኔታ (Work Status)': r.workStatus,
    'ቅጽ 01 ምደባ (Form 01 Disposition)': r.dispositionLabelAm,
    'ወርሃዊ ኪራይ (Monthly Rent)': r.rent
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Supporting Tenant Records');

  const fileName = `FHC_Supporting_Tenant_Table_Records_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
