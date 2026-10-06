import {
  Form01BranchRow,
  Form01ReportDocument,
  Form01CategoryCounts,
  TenantForm01Classification,
  Form01DispositionType
} from '@/src/types/report';
import { TenantRecord } from '@/src/types/tenant';
import { tenantDb } from './tenantStore';

const REPORT_STORAGE_KEY = 'tlu_form01_report_v1';

export const INITIAL_FORM_01_DATA: Form01ReportDocument = {
  id: 'fhc-form-01-master',
  formNumber: 'ቅጽ - 01',
  titleAmharic: 'በፌዴራል ቤቶች ኮርፖሬሽን የሚያስተዳድራቸው ቤቶች ብዛት በየቅርንጫፍ የሚሳይ ቅጽ - 01',
  titleEnglish: 'Federal Housing Corporation Housing Inventory Administered by Branch - Form 01',
  cutoffDateEth: 'እስከ ሰኔ 30/2018 ዓ.ም',
  baselineDateEth: 'እስከ ሰኔ 30/2017 ዓ.ም',
  preparedBy: 'አሰፋ ደበበ (የቅርንጫፍ ኦፊሰር)',
  verifiedBy: 'ወ/ሮ ትዕግስት ኃይሌ (የንብረት አስተዳደር ኃላፊ)',
  approvedBy: 'አቶ ዳዊት ወልዴ (የኮርፖሬሽን ም/ዋና ዳይሬክተር)',
  updatedAt: new Date().toISOString(),
  sourceTenantCount: 0,
  syncMode: 'auto',
  lastSyncedAt: new Date().toISOString(),
  rows: []
};

// Known Ethiopian Federal Housing Corporation Sub-Cities & Branch Hierarchy
export const SUB_CITY_BRANCH_MAPPINGS: {
  matchKeywords: string[];
  branchCode: string;
  branchName: string;
  order: number;
}[] = [
  { matchKeywords: ['bole', 'ቦሌ', 'b1', 'branch 1', 'ቅርንጫፍ 1', 'ቅርንጫፍ አንድ', '1'], branchCode: '1', branchName: 'ቅርንጫፍ 1 (ቦሌ - Bole)', order: 1 },
  { matchKeywords: ['kirkos', 'ቂርቆስ', 'cherkos', 'b2', 'branch 2', 'ቅርንጫፍ 2', 'ቅርንጫፍ ሁለት', '2'], branchCode: '2', branchName: 'ቅርንጫፍ 2 (ቂርቆስ - Kirkos)', order: 2 },
  { matchKeywords: ['arada', 'አራዳ', 'b3', 'branch 3', 'ቅርንጫፍ 3', 'ቅርንጫፍ ሦስት', '3'], branchCode: '3', branchName: 'ቅርንጫፍ 3 (አራዳ - Arada)', order: 3 },
  { matchKeywords: ['lideta', 'ልደታ', 'b4', 'branch 4', 'ቅርንጫፍ 4', 'ቅርንጫፍ አራት', '4'], branchCode: '4', branchName: 'ቅርንጫፍ 4 (ልደታ - Lideta)', order: 4 },
  { matchKeywords: ['addis ketema', 'አዲስ ከተማ', 'b5', 'branch 5', 'ቅርንጫፍ 5', 'ቅርንጫፍ አምስት', '5'], branchCode: '5', branchName: 'ቅርንጫፍ 5 (አዲስ ከተማ - Addis Ketema)', order: 5 },
  { matchKeywords: ['yeka', 'የካ', 'b6', 'branch 6', 'ቅርንጫፍ 6', 'ቅርንጫፍ ስድስት', '6'], branchCode: '6', branchName: 'ቅርንጫፍ 6 (የካ - Yeka)', order: 6 },
  { matchKeywords: ['gullele', 'ጉለሌ', 'b7', 'branch 7', 'ቅርንጫፍ 7', 'ቅርንጫፍ ሰባት', '7'], branchCode: '7', branchName: 'ቅርንጫፍ 7 (ጉለሌ - Gullele)', order: 7 },
  { matchKeywords: ['kolfe', 'ኮልፌ', 'keranio', 'ቀራኒዮ', 'b8', 'branch 8', 'ቅርንጫፍ 8', 'ቅርንጫፍ ስምንት', '8'], branchCode: '8', branchName: 'ቅርንጫፍ 8 (ኮልፌ ቀራኒዮ - Kolfe Keranio)', order: 8 },
  { matchKeywords: ['nifas', 'ንፋስ', 'lafto', 'ላፍቶ', 'b9', 'branch 9', 'ቅርንጫፍ 9', 'ቅርንጫፍ ዘጠኝ', '9'], branchCode: '9', branchName: 'ቅርንጫፍ 9 (ንፋስ ስልክ ላፍቶ - Nifas Silk)', order: 9 },
  { matchKeywords: ['akaky', 'akaki', 'አቃቂ', 'kaliti', 'ቃሊቲ', 'b10', 'branch 10', 'ቅርንጫፍ 10', 'ቅርንጫፍ አስር', '10'], branchCode: '10', branchName: 'ቅርንጫፍ 10 (አቃቂ ቃሊቲ - Akaki Kality)', order: 10 },
  { matchKeywords: ['lemi', 'ለሚ', 'kura', 'ኩራ', 'b11', 'branch 11', 'ቅርንጫፍ 11', 'ቅርንጫፍ አስራ አንድ', '11'], branchCode: '11', branchName: 'ቅርንጫፍ 11 (ለሚ ኩራ - Lemi Kura)', order: 11 }
];

export function resolveBranchInfo(rawBranchOrSubcity?: string): { branchCode: string; branchName: string; order: number } {
  if (!rawBranchOrSubcity || !rawBranchOrSubcity.trim()) {
    return { branchCode: '1', branchName: 'ቅርንጫፍ 1 (ቦሌ - Bole)', order: 1 };
  }

  const str = rawBranchOrSubcity.trim().toLowerCase();
  
  // Exact numeric match (e.g. "1", "2", "10")
  const numVal = parseInt(str, 10);
  if (!isNaN(numVal) && String(numVal) === str) {
    const match = SUB_CITY_BRANCH_MAPPINGS.find(m => m.branchCode === String(numVal));
    if (match) return { branchCode: match.branchCode, branchName: match.branchName, order: match.order };
  }

  // Predefined keyword match
  for (const m of SUB_CITY_BRANCH_MAPPINGS) {
    if (m.matchKeywords.some(k => str.includes(k.toLowerCase()) || str === k.toLowerCase())) {
      return { branchCode: m.branchCode, branchName: m.branchName, order: m.order };
    }
  }

  // Formatted like "Branch 2" or "ቅርንጫፍ 2"
  const branchNumMatch = str.match(/(?:branch|ቅርንጫፍ|b)\s*(\d+)/i);
  if (branchNumMatch) {
    const code = branchNumMatch[1];
    const match = SUB_CITY_BRANCH_MAPPINGS.find(m => m.branchCode === code);
    if (match) return { branchCode: match.branchCode, branchName: match.branchName, order: match.order };
    return {
      branchCode: code,
      branchName: `ቅርንጫፍ ${code} (${rawBranchOrSubcity.trim()})`,
      order: parseInt(code, 10) || 50
    };
  }

  return {
    branchCode: 'Other',
    branchName: rawBranchOrSubcity.trim(),
    order: 100
  };
}

export function classifyTenantForForm01(t: TenantRecord): TenantForm01Classification {
  const branchCandidate = (
    t.sub_city ||
    t.branch ||
    t.rawFields?.['ቅርንጫፍ'] ||
    t.rawFields?.['Branch'] ||
    t.rawFields?.['ክ/ከተማ'] ||
    t.rawFields?.['Sub City'] ||
    t.city ||
    ''
  );
  const branchInfo = resolveBranchInfo(branchCandidate);

  // Determine Residential (መኖሪያ) vs Commercial (ድርጅት)
  const use = (t.historical_use || t.category || '').toLowerCase();
  const occupant = (t.tenant_name || t.tenantName || '').toLowerCase();
  const workStatusRaw = (t.work_status || t.status || '').toLowerCase();
  const tenure = (t.tenure_type || '').toLowerCase();

  const isCom = (
    use.includes('commercial') ||
    use.includes('ድርጅት') ||
    use.includes('ንግድ') ||
    use.includes('business') ||
    use.includes('shop') ||
    use.includes('office') ||
    use.includes('ሱቅ') ||
    use.includes('ቢሮ') ||
    use.includes('መጋዘን') ||
    use.includes('ፋብሪካ') ||
    use.includes('አዳራሽ') ||
    use.includes('ጋራዥ') ||
    use.includes('ሆቴል') ||
    use.includes('ካፌ') ||
    use.includes('ባንክ') ||
    workStatusRaw.includes('commercial') ||
    workStatusRaw.includes('ድርጅት') ||
    tenure.includes('ድርጅት')
  );

  const isRes = !isCom;
  const category: 'residential' | 'commercial' = isRes ? 'residential' : 'commercial';
  const categoryLabelAm = isRes ? 'መኖሪያ' : 'ድርጅት';
  const categoryLabelEn = isRes ? 'Residential' : 'Commercial';

  // Determine Exit Disposition vs Active
  const statusBlob = `${t.work_status || ''} ${t.status || ''} ${t.remarks || ''} ${t.tenure_type || ''} ${JSON.stringify(t.rawFields || {})}`.toLowerCase();
  
  let disposition: Form01DispositionType = 'active';
  let dispositionLabelAm = 'በስራ ላይ ያለ (Active)';
  let dispositionLabelEn = 'Active Lease';

  if (
    statusBlob.includes('demolish') ||
    statusBlob.includes('ፈረሰ') ||
    statusBlob.includes('መፍረስ') ||
    statusBlob.includes('የፈረሰ') ||
    statusBlob.includes('በልማት') ||
    statusBlob.includes('redevelopment') ||
    statusBlob.includes('clearance') ||
    statusBlob.includes('ማፍረስ')
  ) {
    disposition = 'demolished';
    dispositionLabelAm = 'በልማት የፈረሰ';
    dispositionLabelEn = 'Demolished for Development';
  } else if (
    statusBlob.includes('transferred by') ||
    statusBlob.includes('transferred to') ||
    statusBlob.includes('ለሌላ ተቋም') ||
    statusBlob.includes('በውሳኔ የተሰጠ') ||
    statusBlob.includes('ውሳኔ የተላለፈ') ||
    statusBlob.includes('ተቋም') ||
    statusBlob.includes('ተላለፈ') ||
    statusBlob.includes('transfer')
  ) {
    disposition = 'transferred';
    dispositionLabelAm = 'ለሌላ ተቋም በውሳኔ የተሰጠ';
    dispositionLabelEn = 'Transferred by Decision';
  } else if (
    statusBlob.includes('sold') ||
    statusBlob.includes('ሽያጭ') ||
    statusBlob.includes('የተሸጠ') ||
    statusBlob.includes('መሸጥ') ||
    statusBlob.includes('በሽያጭ') ||
    statusBlob.includes('sale') ||
    statusBlob.includes('purchased') ||
    statusBlob.includes('auction')
  ) {
    disposition = 'sold';
    dispositionLabelAm = 'በሽያጭ የተላለፈ';
    dispositionLabelEn = 'Transferred by Sale';
  } else if (
    statusBlob.includes('merge') ||
    statusBlob.includes('የተቀላቀለ') ||
    statusBlob.includes('ተቀላቀለ') ||
    statusBlob.includes('መቀላቀል') ||
    statusBlob.includes('consolidated') ||
    statusBlob.includes('የተጣመረ')
  ) {
    disposition = 'merged';
    dispositionLabelAm = 'የተቀላቀለ';
    dispositionLabelEn = 'Merged Unit';
  } else if (
    statusBlob.includes('privat') ||
    statusBlob.includes('ፕራይቬታይዝ') ||
    statusBlob.includes('ፕራይቬታይዜሽን') ||
    statusBlob.includes('የግል')
  ) {
    disposition = 'privatized';
    dispositionLabelAm = 'በፕራይቬታይዜሽን ውሳኔ';
    dispositionLabelEn = 'Privatized by Decision';
  } else if (
    statusBlob.includes('court') ||
    statusBlob.includes('ፍርድ') ||
    statusBlob.includes('ፍ/ቤት') ||
    statusBlob.includes('restituted') ||
    statusBlob.includes('judgment') ||
    statusBlob.includes('litigation') ||
    statusBlob.includes('ክስ')
  ) {
    disposition = 'court';
    dispositionLabelAm = 'በፍርድ ቤት ውሳኔ';
    dispositionLabelEn = 'Court Decision';
  } else if (
    statusBlob.includes('inactive') ||
    statusBlob.includes('terminated') ||
    statusBlob.includes('deactivated') ||
    statusBlob.includes('removed') ||
    statusBlob.includes('vacated') ||
    statusBlob.includes('closed') ||
    statusBlob.includes('የተዘጋ') ||
    statusBlob.includes('የተቋረጠ') ||
    statusBlob.includes('ተቋርጧል') ||
    statusBlob.includes('የወጣ') ||
    statusBlob.includes('ለቆ የወጣ') ||
    statusBlob.includes('exit') ||
    statusBlob.includes('other exit') ||
    statusBlob.includes('evicted') ||
    t.status === 'Inactive' ||
    t.status === 'Terminated'
  ) {
    disposition = 'other';
    dispositionLabelAm = 'ሌላ ከኮርፖሬሽኑ የወጣ';
    dispositionLabelEn = 'Other Exited / Vacated';
  }

  const rentVal = typeof t.rent_amount === 'number' ? t.rent_amount : (typeof t.rent === 'number' ? t.rent : Number(t.rent_amount || t.rent || 0));

  return {
    tenantCode: t.identifier_code || t.tenantCode || '',
    tenantName: t.tenant_name || t.tenantName || occupant || 'Unknown',
    branchKey: branchInfo.branchName,
    branchName: branchInfo.branchName,
    category,
    categoryLabelAm,
    categoryLabelEn,
    disposition,
    dispositionLabelAm,
    dispositionLabelEn,
    workStatus: t.work_status || t.status || 'Active',
    historicalUse: t.historical_use || t.category || '',
    rent: rentVal,
    unit: t.house_number || t.unit || '',
    woreda: t.woreda || ''
  };
}

export class ReportDatabase {
  private static instance: ReportDatabase;

  public static getInstance(): ReportDatabase {
    if (!ReportDatabase.instance) {
      ReportDatabase.instance = new ReportDatabase();
    }
    return ReportDatabase.instance;
  }

  public getReport(): Form01ReportDocument {
    if (typeof window === 'undefined') return INITIAL_FORM_01_DATA;
    try {
      const data = localStorage.getItem(REPORT_STORAGE_KEY);
      if (data) {
        const parsed: Form01ReportDocument = JSON.parse(data);
        // If current report has no rows but tenant table has records, auto-populate from tenant table
        const liveTenants = tenantDb.getTenants();
        if ((!parsed.rows || parsed.rows.length === 0) && liveTenants.length > 0) {
          return this.generateFromTenants(liveTenants);
        }
        return parsed;
      }

      // No saved report in storage: Check live tenant table
      const liveTenants = tenantDb.getTenants();
      if (liveTenants.length > 0) {
        return this.generateFromTenants(liveTenants);
      }

      this.saveReport(INITIAL_FORM_01_DATA);
      return INITIAL_FORM_01_DATA;
    } catch {
      return INITIAL_FORM_01_DATA;
    }
  }

  public saveReport(report: Form01ReportDocument) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify({
      ...report,
      updatedAt: new Date().toISOString()
    }));
  }

  public resetToBaseline(): Form01ReportDocument {
    const liveTenants = tenantDb.getTenants();
    if (liveTenants.length > 0) {
      return this.generateFromTenants(liveTenants);
    }
    this.saveReport(INITIAL_FORM_01_DATA);
    return INITIAL_FORM_01_DATA;
  }

  public updateBranchRow(updatedRow: Form01BranchRow): Form01ReportDocument {
    const report = this.getReport();
    const rows = report.rows.map(r => r.id === updatedRow.id ? updatedRow : r);
    const updated: Form01ReportDocument = {
      ...report,
      syncMode: 'manual',
      rows
    };
    this.saveReport(updated);
    return updated;
  }

  public addBranchRow(branchName: string, branchCode?: string): Form01ReportDocument {
    const report = this.getReport();
    const nextSn = report.rows.length + 1;
    const newRow: Form01BranchRow = {
      id: `branch-row-${Date.now()}`,
      sn: nextSn,
      branchCode: branchCode || String(nextSn),
      branchName: branchName || `ቅርንጫፍ ${nextSn}`,
      inBranchOffice: { residential: 0, commercial: 0, total: 0 },
      demolished: { residential: 0, commercial: 0, total: 0 },
      transferredByDecision: { residential: 0, commercial: 0, total: 0 },
      sold: { residential: 0, commercial: 0, total: 0 },
      merged: { residential: 0, commercial: 0, total: 0 },
      other: { residential: 0, commercial: 0, total: 0 },
      privatized: { residential: 0, commercial: 0, total: 0 },
      courtDecision: { residential: 0, commercial: 0, total: 0 },
      totalExited: { residential: 0, commercial: 0, total: 0 },
      remainingActive: { residential: 0, commercial: 0, total: 0 }
    };
    const updated = { ...report, syncMode: 'manual' as const, rows: [...report.rows, newRow] };
    this.saveReport(updated);
    return updated;
  }

  public deleteBranchRow(rowId: string): Form01ReportDocument {
    const report = this.getReport();
    const rows = report.rows.filter(r => r.id !== rowId).map((r, idx) => ({
      ...r,
      sn: idx + 1
    }));
    const updated = { ...report, syncMode: 'manual' as const, rows };
    this.saveReport(updated);
    return updated;
  }

  /**
   * Generates and populates Form 01 report strictly from the updated master tenant table records.
   * By default includes all standard Ethiopian FHC branches (1 to 10/11) so the full official corporation
   * matrix is presented with exact counts from the tenant database.
   */
  public generateFromTenants(tenants: TenantRecord[], showAllOfficialBranches: boolean = true): Form01ReportDocument {
    const currentDoc = this.getReport();

    // Branch aggregation tracker
    interface BranchAggregation {
      code: string;
      name: string;
      order: number;
      records: TenantForm01Classification[];
    }

    const branchMap = new Map<string, BranchAggregation>();

    // Seed standard official Ethiopian Federal Housing Corporation branches
    if (showAllOfficialBranches) {
      SUB_CITY_BRANCH_MAPPINGS.forEach(b => {
        branchMap.set(b.branchName, {
          code: b.branchCode,
          name: b.branchName,
          order: b.order,
          records: []
        });
      });
    }

    // Classify all records from tenant database and group by branch
    (tenants || []).forEach(t => {
      const c = classifyTenantForForm01(t);
      const key = c.branchName;
      if (!branchMap.has(key)) {
        const info = resolveBranchInfo(c.branchName);
        branchMap.set(key, {
          code: info.branchCode,
          name: info.branchName,
          order: info.order,
          records: []
        });
      }
      branchMap.get(key)!.records.push(c);
    });

    // If user prefers only active branches with records, filter out empty ones
    let branchEntries = Array.from(branchMap.values());
    if (!showAllOfficialBranches && tenants && tenants.length > 0) {
      branchEntries = branchEntries.filter(b => b.records.length > 0);
    }

    // Sort branches in natural administrative sequence
    const sortedBranches = branchEntries.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

    const newRows: Form01BranchRow[] = sortedBranches.map((br, index) => {
      let inRes = 0;
      let inCom = 0;

      let demRes = 0, demCom = 0;
      let transRes = 0, transCom = 0;
      let soldRes = 0, soldCom = 0;
      let mergedRes = 0, mergedCom = 0;
      let otherRes = 0, otherCom = 0;
      let privRes = 0, privCom = 0;
      let courtRes = 0, courtCom = 0;

      br.records.forEach(r => {
        const isR = r.category === 'residential';
        if (isR) inRes++; else inCom++;

        switch (r.disposition) {
          case 'demolished':
            if (isR) demRes++; else demCom++;
            break;
          case 'transferred':
            if (isR) transRes++; else transCom++;
            break;
          case 'sold':
            if (isR) soldRes++; else soldCom++;
            break;
          case 'merged':
            if (isR) mergedRes++; else mergedCom++;
            break;
          case 'privatized':
            if (isR) privRes++; else privCom++;
            break;
          case 'court':
            if (isR) courtRes++; else courtCom++;
            break;
          case 'other':
            if (isR) otherRes++; else otherCom++;
            break;
          case 'active':
          default:
            break;
        }
      });

      const totalExitRes = demRes + transRes + soldRes + mergedRes + otherRes + privRes + courtRes;
      const totalExitCom = demCom + transCom + soldCom + mergedCom + otherCom + privCom + courtCom;
      const totalExitAll = totalExitRes + totalExitCom;

      const remRes = Math.max(0, inRes - totalExitRes);
      const remCom = Math.max(0, inCom - totalExitCom);
      const remTot = Math.max(0, (inRes + inCom) - totalExitAll);

      return {
        id: `branch-row-${br.code || index + 1}`,
        sn: index + 1,
        branchCode: br.code || String(index + 1),
        branchName: br.name,
        inBranchOffice: {
          residential: inRes,
          commercial: inCom,
          total: inRes + inCom
        },
        demolished: {
          residential: demRes,
          commercial: demCom,
          total: demRes + demCom
        },
        transferredByDecision: {
          residential: transRes,
          commercial: transCom,
          total: transRes + transCom
        },
        sold: {
          residential: soldRes,
          commercial: soldCom,
          total: soldRes + soldCom
        },
        merged: {
          residential: mergedRes,
          commercial: mergedCom,
          total: mergedRes + mergedCom
        },
        other: {
          residential: otherRes,
          commercial: otherCom,
          total: otherRes + otherCom
        },
        privatized: {
          residential: privRes,
          commercial: privCom,
          total: privRes + privCom
        },
        courtDecision: {
          residential: courtRes,
          commercial: courtCom,
          total: courtRes + courtCom
        },
        totalExited: {
          residential: totalExitRes,
          commercial: totalExitCom,
          total: totalExitAll
        },
        remainingActive: {
          residential: remRes,
          commercial: remCom,
          total: remTot
        },
        remarks: br.records.length > 0 ? `${br.records.length} updated property entries recorded in master database` : ''
      };
    });

    const updatedDoc: Form01ReportDocument = {
      ...currentDoc,
      sourceTenantCount: (tenants || []).length,
      syncMode: 'auto',
      lastSyncedAt: new Date().toISOString(),
      rows: newRows
    };

    this.saveReport(updatedDoc);
    return updatedDoc;
  }

  public getTenantBreakdown(tenants: TenantRecord[]): TenantForm01Classification[] {
    return (tenants || []).map(t => classifyTenantForForm01(t));
  }

  /**
   * Adds or updates a single property/tenant and recalculates Form 01
   */
  public addOrUpdateTenant(tenantData: Partial<TenantRecord>): TenantRecord {
    const list = tenantDb.getTenants();
    const code = (tenantData.identifier_code || tenantData.tenantCode || `ETH-AA-B1-${Date.now()}`).trim();

    const existingIdx = list.findIndex(
      t => t.tenantCode.toLowerCase() === code.toLowerCase() || t.identifier_code.toLowerCase() === code.toLowerCase()
    );

    const now = new Date().toISOString();
    const isCommercial = tenantData.category?.includes('ድርጅት') || tenantData.historical_use?.includes('ድርጅት') || false;

    const baseRecord: TenantRecord = {
      identifier_code: code,
      tenantCode: code,
      tenant_name: tenantData.tenant_name || tenantData.tenantName || 'Tenant',
      tenantName: tenantData.tenant_name || tenantData.tenantName || 'Tenant',
      city: tenantData.city || 'Addis Ababa',
      sub_city: tenantData.sub_city || tenantData.branch || 'Bole',
      branch: tenantData.branch || tenantData.sub_city || '1',
      woreda: tenantData.woreda || 'Woreda 01',
      house_number: tenantData.house_number || tenantData.unit || 'HN-101',
      unit: tenantData.house_number || tenantData.unit || 'HN-101',
      historical_use: tenantData.historical_use || tenantData.category || (isCommercial ? 'የድርጅት ቤት' : 'የመኖሪያ ቤት'),
      category: tenantData.category || tenantData.historical_use || (isCommercial ? 'የድርጅት ቤት' : 'የመኖሪያ ቤት'),
      building_grade: tenantData.building_grade || 'Grade B',
      status: tenantData.status || 'Active',
      work_status: tenantData.work_status || 'Active Lease',
      rent_amount: Number(tenantData.rent_amount || tenantData.rent || 5000),
      rent: Number(tenantData.rent_amount || tenantData.rent || 5000),
      rawFields: tenantData.rawFields || {},
      remarks: tenantData.remarks || '',
      createdAt: now,
      updatedAt: now
    };

    let updatedList: TenantRecord[];
    if (existingIdx >= 0) {
      updatedList = list.map((item, idx) => (idx === existingIdx ? { ...item, ...tenantData, updatedAt: now } : item));
    } else {
      updatedList = [baseRecord, ...list];
    }

    tenantDb.saveTenants(updatedList);
    this.generateFromTenants(updatedList);
    return baseRecord;
  }

  /**
   * Deletes a tenant from the master registry and recalculates Form 01
   */
  public deleteTenant(tenantCode: string): void {
    const list = tenantDb.getTenants();
    const updatedList = list.filter(
      t => t.tenantCode.toLowerCase() !== tenantCode.toLowerCase() && t.identifier_code.toLowerCase() !== tenantCode.toLowerCase()
    );
    tenantDb.saveTenants(updatedList);
    this.generateFromTenants(updatedList);
  }
}

export const reportDb = ReportDatabase.getInstance();

// Auto-subscribe to tenant table updates so any reconciliation or edit instantly repopulates Form 01
if (typeof window !== 'undefined') {
  tenantDb.subscribe((tenants) => {
    reportDb.generateFromTenants(tenants);
  });
}

/**
 * Helper to generate 100 realistic Ethiopian Federal Housing Corporation branch records
 * covering all sub-cities and exit dispositions to test the live Form 01 reporting structure.
 */
export function generateSampleBranchTenants(): TenantRecord[] {
  const SUB_CITIES_LIST = [
    'Bole', 'Kirkos', 'Arada', 'Lideta', 'Addis Ketema',
    'Yeka', 'Gullele', 'Kolfe Keranio', 'Nifas Silk', 'Akaki Kality', 'Lemi Kura'
  ];

  const ETHIO_NAMES = [
    'Abebe Kebede', 'Tigist Haile', 'Dawit Wolde', 'Selamawit Tadesse', 'Yohannes Bekele',
    'Mulugeta Assefa', 'Almaz Belay', 'Biruk Solomon', 'Hirut Desta', 'Kassahun Tesfaye',
    'Rahel Mengistu', 'Daniel Tilahun', 'Bethelhem Zewde', 'Ephrem Girma', 'Frehiwot Alemayehu',
    'Girma Tekle', 'Hiwot Negash', 'Kalkidan Fikru', 'Mesfin Worku', 'Netsanet Araya'
  ];

  const RES_USES = ['Residential Dwelling (መኖሪያ)', 'Residential Apartment (አፓርታማ)', 'Residential Condo (ኮንዶሚኒየም)', 'Residential Villa (ቪላ)'];
  const COM_USES = ['Commercial / Office (ቢሮ)', 'Retail / Shop (ሱቅ)', 'Cafeteria / Restaurant (ሬስቶራንት)', 'Medical Clinic (ክሊኒክ)', 'Service Workshop (ዎርክሾፕ)'];

  const DISPOSITION_CYCLE = [
    'Active Lease',
    'Active Lease',
    'Active Lease',
    'Active Lease',
    'Active Lease',
    'Demolished for Infrastructure (በልማት የፈረሰ)',
    'Transferred by Decision to Agency (ለሌላ ተቋም በውሳኔ የተሰጠ)',
    'Sold by Corporation (በሽያጭ የተላለፈ)',
    'Merged Unit (የተቀላቀለ)',
    'Privatized by Board Decision (በፕራይቬታይዜሽን ውሳኔ)',
    'Court Decision Restitution (በፍርድ ቤት ውሳኔ)',
    'Inactive / Vacated (ሌላ የወጣ)'
  ];

  const tenants: TenantRecord[] = [];

  for (let i = 1; i <= 100; i++) {
    const subCity = SUB_CITIES_LIST[(i - 1) % SUB_CITIES_LIST.length];
    const subCode = subCity.slice(0, 3).toUpperCase();
    const codeNum = String(i).padStart(3, '0');
    const identifier_code = `ETH-AA-${subCode}-${codeNum}`;
    const name = ETHIO_NAMES[(i - 1) % ETHIO_NAMES.length];
    const isCommercial = i % 2 === 0;
    const historical_use = isCommercial
      ? COM_USES[(i - 1) % COM_USES.length]
      : RES_USES[(i - 1) % RES_USES.length];
    
    const disp = DISPOSITION_CYCLE[(i - 1) % DISPOSITION_CYCLE.length];
    const isActive = disp.startsWith('Active');
    const status = isActive ? 'Active' : 'Inactive';
    const work_status = disp;
    const woreda = `Woreda ${((i % 12) + 1).toString().padStart(2, '0')}`;
    const house_number = `HN-${200 + i}`;
    const rent_amount = isCommercial ? 18000 + (i * 450) : 4500 + (i * 220);

    tenants.push({
      identifier_code,
      tenantCode: identifier_code,
      city: 'Addis Ababa',
      sub_city: subCity,
      branch: subCity,
      woreda,
      kebele: `Kebele ${((i % 8) + 1).toString().padStart(2, '0')}`,
      house_number,
      unit: house_number,
      complex_no: isCommercial ? `CMP-${String(Math.floor(i / 10) + 1).padStart(2, '0')}` : undefined,
      title: i % 2 === 0 ? 'W/ro' : 'Ato',
      tenant_name: name,
      tenantName: name,
      resident_name: name,
      gender: i % 2 === 0 ? 'F' : 'M',
      historical_use,
      category: historical_use,
      main_house: 'Main',
      bedroom_count: isCommercial ? 0 : (i % 3) + 1,
      total_rooms: isCommercial ? 3 : (i % 4) + 2,
      rent_amount,
      rent: rent_amount,
      work_status,
      status,
      remarks: `Form 01 Registry Entry - ${work_status}`,
      rawFields: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return tenants;
}
