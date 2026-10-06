import {
  Form03ReportDocument,
  Form03TypologyRow,
  Form03TypologyKey,
  Form03Counts
} from '@/src/types/form03Report';
import { TenantRecord } from '@/src/types/tenant';
import { tenantDb } from './tenantStore';
import { classifyTenantForForm02 } from './form02Store';
import { resolveBranchInfo } from './reportStore';

const FORM_03_STORAGE_KEY = 'tlu_form03_report_v1';

export const INITIAL_FORM_03_DATA: Form03ReportDocument = {
  id: 'fhc-form-03-master',
  formNumber: 'ቅጽ - 03',
  topHeaderAmharic: 'የፌዴራል ቤቶች ኮርፖሬሽን',
  titleAmharic: 'በቅርንጫፍ አንድ ያሉ ቤቶችና ተከራዮች ብዛት የሚያሳይ ቅጽ - 03',
  titleEnglish: 'Federal Housing Corporation - Number of Houses and Tenants in Branch 1 (Form - 03)',
  branchName: 'ቅርንጫፍ አንድ (Branch 1)',
  branchCode: '1',
  updatedAt: new Date().toISOString(),
  sourceTenantCount: 0,
  syncMode: 'auto',
  lastSyncedAt: new Date().toISOString(),
  rows: [
    {
      sn: 1,
      typologyKey: 'apartment',
      typologyLabelAm: 'አፓርትማ',
      typologyLabelEn: 'Apartment',
      residential: { houseCount: 0, tenantCount: 0 },
      commercial: { houseCount: 0, tenantCount: 0 },
      grandTotal: { houseCount: 0, tenantCount: 0 }
    },
    {
      sn: 2,
      typologyKey: 'tinRoof',
      typologyLabelAm: 'ቆርቆሮ',
      typologyLabelEn: 'Tin Roof',
      residential: { houseCount: 0, tenantCount: 0 },
      commercial: { houseCount: 0, tenantCount: 0 },
      grandTotal: { houseCount: 0, tenantCount: 0 }
    },
    {
      sn: 3,
      typologyKey: 'villa',
      typologyLabelAm: 'ቪላ',
      typologyLabelEn: 'Villa',
      residential: { houseCount: 0, tenantCount: 0 },
      commercial: { houseCount: 0, tenantCount: 0 },
      grandTotal: { houseCount: 0, tenantCount: 0 }
    },
    {
      sn: 4,
      typologyKey: 'standardHouse',
      typologyLabelAm: 'ተራ ቤት',
      typologyLabelEn: 'Standard House',
      residential: { houseCount: 0, tenantCount: 0 },
      commercial: { houseCount: 0, tenantCount: 0 },
      grandTotal: { houseCount: 0, tenantCount: 0 }
    },
    {
      sn: 5,
      typologyKey: 'hostel',
      typologyLabelAm: 'ሆስቴል',
      typologyLabelEn: 'Hostel',
      residential: { houseCount: 0, tenantCount: 0 },
      commercial: { houseCount: 0, tenantCount: 0 },
      grandTotal: { houseCount: 0, tenantCount: 0 }
    },
    {
      sn: 6,
      typologyKey: 'hall',
      typologyLabelAm: 'አዳራሽ',
      typologyLabelEn: 'Hall / Auditorium',
      residential: { houseCount: 0, tenantCount: 0 },
      commercial: { houseCount: 0, tenantCount: 0 },
      grandTotal: { houseCount: 0, tenantCount: 0 }
    },
    {
      sn: 7,
      typologyKey: 'shenshan',
      typologyLabelAm: 'ሸንሻን',
      typologyLabelEn: 'Shenshan / Stall',
      residential: { houseCount: 0, tenantCount: 0 },
      commercial: { houseCount: 0, tenantCount: 0 },
      grandTotal: { houseCount: 0, tenantCount: 0 }
    },
    {
      sn: 8,
      typologyKey: 'garage',
      typologyLabelAm: 'ጋራዥ',
      typologyLabelEn: 'Garage',
      residential: { houseCount: 0, tenantCount: 0 },
      commercial: { houseCount: 0, tenantCount: 0 },
      grandTotal: { houseCount: 0, tenantCount: 0 }
    }
  ],
  totals: {
    residential: { houseCount: 0, tenantCount: 0 },
    commercial: { houseCount: 0, tenantCount: 0 },
    grandTotal: { houseCount: 0, tenantCount: 0 }
  },
  signatures: {
    preparedBy: {
      title: 'ያዘጋጀው',
      name: 'አማዋደሽ መላኩ',
      signature: 'አማዋደሽ',
      dateEth: '30/04/2018 ዓ.ም'
    },
    verifiedBy: {
      title: 'ያረጋገጠው',
      name: 'ተስፋዬ ንጉሴ',
      signature: 'ተስፋዬ',
      dateEth: '30/04/2018 ዓ.ም'
    },
    approvedBy: {
      title: 'የፀደቀው',
      name: 'አቶ ዳዊት ወልዴ',
      signature: '',
      dateEth: '30/04/2018 ዓ.ም'
    }
  }
};

const ORDERED_TYPOLOGIES: { key: Form03TypologyKey; labelAm: string; labelEn: string }[] = [
  { key: 'apartment', labelAm: 'አፓርትማ', labelEn: 'Apartment' },
  { key: 'tinRoof', labelAm: 'ቆርቆሮ', labelEn: 'Tin Roof' },
  { key: 'villa', labelAm: 'ቪላ', labelEn: 'Villa' },
  { key: 'standardHouse', labelAm: 'ተራ ቤት', labelEn: 'Standard House' },
  { key: 'hostel', labelAm: 'ሆስቴል', labelEn: 'Hostel' },
  { key: 'hall', labelAm: 'አዳራሽ', labelEn: 'Hall / Auditorium' },
  { key: 'shenshan', labelAm: 'ሸንሻን', labelEn: 'Shenshan / Stall' },
  { key: 'garage', labelAm: 'ጋራዥ', labelEn: 'Garage' }
];

export function computeForm03Totals(rows: Form03TypologyRow[]) {
  const residential = { houseCount: 0, tenantCount: 0 };
  const commercial = { houseCount: 0, tenantCount: 0 };
  const grandTotal = { houseCount: 0, tenantCount: 0 };

  rows.forEach(r => {
    residential.houseCount += r.residential.houseCount;
    residential.tenantCount += r.residential.tenantCount;

    commercial.houseCount += r.commercial.houseCount;
    commercial.tenantCount += r.commercial.tenantCount;

    grandTotal.houseCount += r.grandTotal.houseCount;
    grandTotal.tenantCount += r.grandTotal.tenantCount;
  });

  return { residential, commercial, grandTotal };
}

export function getAvailableBranches(tenants: TenantRecord[]): { code: string; name: string; count: number }[] {
  const branchMap = new Map<string, { code: string; name: string; count: number }>();

  tenants.forEach(t => {
    const info = resolveBranchInfo(t.sub_city || t.branch || t.city);
    const code = info.branchCode || '1';
    if (!branchMap.has(code)) {
      branchMap.set(code, { code, name: info.branchName, count: 0 });
    }
    branchMap.get(code)!.count++;
  });

  return Array.from(branchMap.values()).sort((a, b) => {
    const numA = parseInt(a.code, 10) || 999;
    const numB = parseInt(b.code, 10) || 999;
    return numA - numB;
  });
}

export class Form03Database {
  private static instance: Form03Database;

  public static getInstance(): Form03Database {
    if (!Form03Database.instance) {
      Form03Database.instance = new Form03Database();
    }
    return Form03Database.instance;
  }

  public getReport(): Form03ReportDocument {
    if (typeof window === 'undefined') return INITIAL_FORM_03_DATA;
    try {
      const liveTenants = tenantDb.getTenants();
      if (liveTenants.length > 0) {
        return this.generateFromTenants(liveTenants);
      }
      return INITIAL_FORM_03_DATA;
    } catch {
      return INITIAL_FORM_03_DATA;
    }
  }

  public saveReport(report: Form03ReportDocument) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      FORM_03_STORAGE_KEY,
      JSON.stringify({
        ...report,
        updatedAt: new Date().toISOString()
      })
    );
  }

  public resetToBenchmark(): Form03ReportDocument {
    this.saveReport(INITIAL_FORM_03_DATA);
    return INITIAL_FORM_03_DATA;
  }

  /**
   * Generates Form 03 dynamically based on tenant records.
   * Compares total houses vs active occupied tenants.
   */
  public generateFromTenants(tenants: TenantRecord[], branchFilter?: string): Form03ReportDocument {
    const currentDoc = this.getReport();

    if (!tenants || tenants.length === 0) {
      return INITIAL_FORM_03_DATA;
    }

    // Determine target branch
    const branchTarget = branchFilter !== undefined ? branchFilter : (currentDoc.branchCode || 'ALL');

    let activeList: TenantRecord[] = tenants;
    let branchDisplayName = 'ሁሉም ቅርንጫፎች (All Branches)';
    let branchCode = 'ALL';

    if (branchTarget !== 'ALL') {
      activeList = tenants.filter(t => {
        const bInfo = resolveBranchInfo(t.sub_city || t.branch || t.city);
        return bInfo.branchCode === branchTarget || bInfo.branchName.toLowerCase().includes(branchTarget.toLowerCase());
      });
      branchCode = branchTarget;
      const matched = tenants.find(t => {
        const b = resolveBranchInfo(t.sub_city || t.branch || t.city);
        return b.branchCode === branchTarget;
      });
      if (matched) {
        branchDisplayName = resolveBranchInfo(matched.sub_city || matched.branch || matched.city).branchName;
      } else {
        branchDisplayName = `ቅርንጫፍ ${branchTarget}`;
      }
    }

    // Track houses and active tenants per typology
    const map = new Map<Form03TypologyKey, { resHouse: number; resTenant: number; comHouse: number; comTenant: number }>();

    ORDERED_TYPOLOGIES.forEach(o => {
      map.set(o.key, { resHouse: 0, resTenant: 0, comHouse: 0, comTenant: 0 });
    });

    activeList.forEach(t => {
      const c = classifyTenantForForm02(t);
      const key = (c.typology as Form03TypologyKey) || 'standardHouse';
      const entry = map.get(key) || map.get('standardHouse')!;

      // Determine if unit has an active tenant:
      const hasActiveTenant =
        t.status !== 'Vacant' &&
        t.status !== 'Inactive' &&
        t.status !== 'Terminated' &&
        Boolean(t.tenant_name || t.tenantName) &&
        !t.remarks?.includes('ክፍት ቤት');

      if (c.mainCategory === 'residential') {
        entry.resHouse++;
        if (hasActiveTenant) entry.resTenant++;
      } else {
        entry.comHouse++;
        if (hasActiveTenant) entry.comTenant++;
      }
    });

    const rows: Form03TypologyRow[] = ORDERED_TYPOLOGIES.map((o, idx) => {
      const d = map.get(o.key)!;
      const res: Form03Counts = { houseCount: d.resHouse, tenantCount: d.resTenant };
      const com: Form03Counts = { houseCount: d.comHouse, tenantCount: d.comTenant };
      const tot: Form03Counts = {
        houseCount: res.houseCount + com.houseCount,
        tenantCount: res.tenantCount + com.tenantCount
      };

      return {
        sn: idx + 1,
        typologyKey: o.key,
        typologyLabelAm: o.labelAm,
        typologyLabelEn: o.labelEn,
        residential: res,
        commercial: com,
        grandTotal: tot
      };
    });

    const totals = computeForm03Totals(rows);

    const titleAmharic =
      branchCode === 'ALL'
        ? 'በሁሉም ቅርንጫፎች ያሉ ቤቶችና ተከራዮች ብዛት የሚያሳይ ቅጽ - 03'
        : `በ${branchDisplayName} ያሉ ቤቶችና ተከራዮች ብዛት የሚያሳይ ቅጽ - 03`;

    const titleEnglish =
      branchCode === 'ALL'
        ? 'Federal Housing Corporation - Number of Houses and Tenants Across All Branches (Form - 03)'
        : `Federal Housing Corporation - Number of Houses and Tenants in ${branchDisplayName} (Form - 03)`;

    const updatedDoc: Form03ReportDocument = {
      ...currentDoc,
      branchName: branchDisplayName,
      branchCode,
      titleAmharic,
      titleEnglish,
      rows,
      totals,
      sourceTenantCount: activeList.length,
      syncMode: 'auto',
      lastSyncedAt: new Date().toISOString()
    };

    this.saveReport(updatedDoc);
    return updatedDoc;
  }

  /**
   * Adds or updates a single tenant/unit and recalculates Form 03
   */
  public addOrUpdateTenant(tenantData: Partial<TenantRecord>): TenantRecord {
    const list = tenantDb.getTenants();
    const code = (tenantData.identifier_code || tenantData.tenantCode || `ETH-FHC-B1-${Date.now()}`).trim();

    const existingIdx = list.findIndex(
      t => t.tenantCode.toLowerCase() === code.toLowerCase() || t.identifier_code.toLowerCase() === code.toLowerCase()
    );

    const now = new Date().toISOString();
    const isCommercial = tenantData.category?.includes('ድርጅት') || tenantData.historical_use?.includes('ድርጅት') || false;

    const baseRecord: TenantRecord = {
      identifier_code: code,
      tenantCode: code,
      tenant_name: tenantData.tenant_name || tenantData.tenantName || 'New Unit / Tenant',
      tenantName: tenantData.tenant_name || tenantData.tenantName || 'New Unit / Tenant',
      city: tenantData.city || 'Addis Ababa',
      sub_city: tenantData.sub_city || tenantData.branch || 'Bole',
      branch: tenantData.branch || tenantData.sub_city || '1',
      woreda: tenantData.woreda || 'Woreda 01',
      house_number: tenantData.house_number || tenantData.unit || 'HN-101',
      unit: tenantData.house_number || tenantData.unit || 'HN-101',
      historical_use: tenantData.historical_use || tenantData.category || (isCommercial ? 'የድርጅት ቤት' : 'የመኖሪያ ቤት'),
      category: tenantData.category || tenantData.historical_use || (isCommercial ? 'የድርጅት ቤት' : 'የመኖሪያ ቤት'),
      typology: tenantData.typology || 'standardHouse',
      building_grade: tenantData.building_grade || 'Grade B',
      status: tenantData.status || (tenantData.tenant_name ? 'Active' : 'Vacant'),
      work_status: tenantData.work_status || (tenantData.tenant_name ? 'Active Lease' : 'Vacant Unit'),
      rent_amount: Number(tenantData.rent_amount || tenantData.rent || 5000),
      rent: Number(tenantData.rent_amount || tenantData.rent || 5000),
      rawFields: tenantData.rawFields || {},
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
   * Deletes a tenant from the master registry and recalculates Form 03
   */
  public deleteTenant(tenantCode: string): void {
    const list = tenantDb.getTenants();
    const updatedList = list.filter(
      t => t.tenantCode.toLowerCase() !== tenantCode.toLowerCase() && t.identifier_code.toLowerCase() !== tenantCode.toLowerCase()
    );
    tenantDb.saveTenants(updatedList);
    this.generateFromTenants(updatedList);
  }

  public updateCell(
    sn: number,
    section: 'residential' | 'commercial',
    field: 'houseCount' | 'tenantCount',
    val: number
  ): Form03ReportDocument {
    const report = this.getReport();
    const rows = report.rows.map(r => {
      if (r.sn !== sn) return r;

      const newRes = { ...r.residential };
      const newCom = { ...r.commercial };

      if (section === 'residential') {
        newRes[field] = Math.max(0, val);
      } else {
        newCom[field] = Math.max(0, val);
      }

      const tot: Form03Counts = {
        houseCount: newRes.houseCount + newCom.houseCount,
        tenantCount: newRes.tenantCount + newCom.tenantCount
      };

      return {
        ...r,
        residential: newRes,
        commercial: newCom,
        grandTotal: tot
      };
    });

    const totals = computeForm03Totals(rows);

    const updated: Form03ReportDocument = {
      ...report,
      syncMode: 'manual',
      rows,
      totals
    };

    this.saveReport(updated);
    return updated;
  }

  public updateRemarks(sn: number, remarks: string): Form03ReportDocument {
    const report = this.getReport();
    const rows = report.rows.map(r => (r.sn === sn ? { ...r, remarks } : r));
    const updated = { ...report, syncMode: 'manual' as const, rows };
    this.saveReport(updated);
    return updated;
  }

  public updateSignatures(signatures: Partial<Form03ReportDocument['signatures']>): Form03ReportDocument {
    const report = this.getReport();
    const updated: Form03ReportDocument = {
      ...report,
      signatures: {
        ...report.signatures,
        ...signatures
      }
    };
    this.saveReport(updated);
    return updated;
  }
}

export const form03Db = Form03Database.getInstance();

// Auto-subscribe to tenant table updates
if (typeof window !== 'undefined') {
  tenantDb.subscribe((tenants) => {
    if (tenants.length > 0) {
      form03Db.generateFromTenants(tenants);
    } else {
      form03Db.resetToBenchmark();
    }
  });
}
