import {
  Form02BranchRow,
  Form02ReportDocument,
  Form02ResidentialCounts,
  Form02CommercialCounts,
  Form02GrandTotalCounts,
  Form02BuildingTypology,
  TenantForm02Classification
} from '@/src/types/form02Report';
import { TenantRecord } from '@/src/types/tenant';
import { tenantDb } from './tenantStore';
import { resolveBranchInfo } from './reportStore';

const FORM_02_STORAGE_KEY = 'tlu_form02_report_v1';

// Default clean empty state for Form 02
export const INITIAL_FORM_02_DATA: Form02ReportDocument = {
  id: 'fhc-form-02-master',
  formNumber: 'ቅጽ - 02',
  titleAmharic: 'በፌዴራል ቤቶች ኮርፖሬሽን የሚያስተዳድራቸው ቤቶች ብዛት በቅርንጫፍ የሚያሳይ ቅጽ - 02',
  titleEnglish: 'Federal Housing Corporation - Number of Houses Administered by Branch Showing Form - 02',
  sectionTitleAmharic: 'አሁን በቅርንጫፍ ያለ የኮርፖሬሽኑ ቤቶች ብዛት',
  sectionTitleEnglish: 'Current Number of Corporation Houses in Branch',
  updatedAt: new Date().toISOString(),
  sourceTenantCount: 0,
  syncMode: 'auto',
  lastSyncedAt: new Date().toISOString(),
  rows: [],
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

/**
 * Classifies an individual tenant record into Form 02 Residential vs Commercial and Typology
 */
export function classifyTenantForForm02(t: TenantRecord): TenantForm02Classification {
  const branchInfo = resolveBranchInfo(t.sub_city || t.branch || t.city);

  // 1. Determine main category: Residential (የመኖሪያ ቤት) vs Commercial (የድርጅት ቤት)
  const use = (t.historical_use || t.category || '').toLowerCase();
  const workStatusRaw = (t.work_status || t.status || '').toLowerCase();
  const grade = (t.building_grade || '').toLowerCase();
  const mainHouse = (t.main_house || '').toLowerCase();
  const remarks = (t.remarks || '').toLowerCase();
  const rawTypo = (t.typology || (t.rawFields && t.rawFields.typology) || '').toLowerCase();
  const combined = `${use} ${workStatusRaw} ${grade} ${mainHouse} ${remarks} ${rawTypo}`;

  let isRes = false;
  if (
    use.includes('resident') ||
    use.includes('መኖሪያ') ||
    use.includes('dwelling') ||
    use.includes('condo') ||
    use.includes('ኮንዶ') ||
    rawTypo === 'residential' ||
    (t.category && t.category.includes('መኖሪያ'))
  ) {
    isRes = true;
  } else if (
    use.includes('commercial') ||
    use.includes('ድርጅት') ||
    use.includes('shop') ||
    use.includes('office') ||
    use.includes('business') ||
    use.includes('trade') ||
    use.includes('shenshan') ||
    use.includes('ሸንሻን') ||
    use.includes('hall') ||
    use.includes('አዳራሽ') ||
    use.includes('garage') ||
    use.includes('ጋራዥ') ||
    use.includes('warehouse') ||
    use.includes('መጋዘን')
  ) {
    isRes = false;
  } else {
    // Default by bedroom count: > 0 bedrooms implies residential dwelling
    isRes = (Number(t.bedroom_count) || 0) > 0;
  }

  const mainCategory: 'residential' | 'commercial' = isRes ? 'residential' : 'commercial';

  // 2. Determine Typology
  let typology: Form02BuildingTypology = 'standardHouse';
  let typologyLabelAm = 'ተራ ቤት';
  let typologyLabelEn = 'Standard / Ordinary House';

  // Check explicit typology if provided
  if (
    rawTypo.includes('apart') ||
    rawTypo.includes('አፓርትማ') ||
    rawTypo.includes('condo') ||
    rawTypo.includes('ኮንዶ')
  ) {
    typology = 'apartment';
    typologyLabelAm = 'አፓርትማ';
    typologyLabelEn = 'Apartment';
  } else if (
    rawTypo.includes('tin') ||
    rawTypo.includes('ቆርቆሮ') ||
    rawTypo.includes('corrugated')
  ) {
    typology = 'tinRoof';
    typologyLabelAm = 'ቆርቆሮ';
    typologyLabelEn = 'Tin Roof / Corrugated Iron';
  } else if (
    rawTypo.includes('villa') ||
    rawTypo.includes('ቪላ')
  ) {
    typology = 'villa';
    typologyLabelAm = 'ቪላ';
    typologyLabelEn = 'Villa';
  } else if (
    rawTypo.includes('shenshan') ||
    rawTypo.includes('ሸንሻን') ||
    rawTypo.includes('stall') ||
    rawTypo.includes('shed')
  ) {
    typology = 'shenshan';
    typologyLabelAm = 'ሸንሻን';
    typologyLabelEn = 'Partition / Shenshan / Stall';
  } else if (
    rawTypo.includes('hall') ||
    rawTypo.includes('አዳራሽ') ||
    rawTypo.includes('auditorium')
  ) {
    typology = 'hall';
    typologyLabelAm = 'አዳራሽ';
    typologyLabelEn = 'Hall / Auditorium';
  } else if (
    rawTypo.includes('warehouse') ||
    rawTypo.includes('መጋዘን') ||
    rawTypo.includes('storage') ||
    rawTypo.includes('store')
  ) {
    typology = 'warehouse';
    typologyLabelAm = 'መጋዘን';
    typologyLabelEn = 'Warehouse / Storage';
  } else if (
    rawTypo.includes('garage') ||
    rawTypo.includes('ጋራዥ') ||
    rawTypo.includes('workshop')
  ) {
    typology = 'garage';
    typologyLabelAm = 'ጋራዥ';
    typologyLabelEn = 'Garage / Workshop';
  } else if (
    rawTypo.includes('hostel') ||
    rawTypo.includes('ሆስቴል') ||
    rawTypo.includes('dormitory')
  ) {
    typology = 'hostel';
    typologyLabelAm = 'ሆስቴል';
    typologyLabelEn = 'Hostel / Dormitory';
  } else {
    // Determine by contextual fields
    if (
      combined.includes('shenshan') ||
      combined.includes('ሸንሻን') ||
      combined.includes('stall') ||
      combined.includes('shed') ||
      combined.includes('kiosk') ||
      combined.includes('container') ||
      combined.includes('መደብር')
    ) {
      typology = 'shenshan';
      typologyLabelAm = 'ሸንሻን';
      typologyLabelEn = 'Partition / Shenshan / Stall';
    } else if (
      combined.includes('hall') ||
      combined.includes('አዳራሽ') ||
      combined.includes('auditorium') ||
      combined.includes('assembly') ||
      combined.includes('cinema')
    ) {
      typology = 'hall';
      typologyLabelAm = 'አዳራሽ';
      typologyLabelEn = 'Hall / Auditorium';
    } else if (
      combined.includes('warehouse') ||
      combined.includes('መጋዘን') ||
      combined.includes('depot') ||
      combined.includes('storage') ||
      combined.includes('store') ||
      combined.includes('ክምችት')
    ) {
      typology = 'warehouse';
      typologyLabelAm = 'መጋዘን';
      typologyLabelEn = 'Warehouse / Storage';
    } else if (
      combined.includes('garage') ||
      combined.includes('ጋራዥ') ||
      combined.includes('parking') ||
      combined.includes('workshop') ||
      combined.includes('auto') ||
      combined.includes('መኪና')
    ) {
      typology = 'garage';
      typologyLabelAm = 'ጋራዥ';
      typologyLabelEn = 'Garage / Workshop';
    } else if (
      combined.includes('hostel') ||
      combined.includes('ሆስቴል') ||
      combined.includes('dormitory') ||
      combined.includes('communal')
    ) {
      typology = 'hostel';
      typologyLabelAm = 'ሆስቴል';
      typologyLabelEn = 'Hostel / Dormitory';
    } else if (
      combined.includes('apart') ||
      combined.includes('አፓርትማ') ||
      combined.includes('condo') ||
      combined.includes('ኮንዶ') ||
      combined.includes('flat') ||
      combined.includes('suite')
    ) {
      typology = 'apartment';
      typologyLabelAm = 'አፓርትማ';
      typologyLabelEn = 'Apartment';
    } else if (
      combined.includes('villa') ||
      combined.includes('ቪላ') ||
      combined.includes('compound') ||
      combined.includes('mans')
    ) {
      typology = 'villa';
      typologyLabelAm = 'ቪላ';
      typologyLabelEn = 'Villa';
    } else if (
      combined.includes('tin') ||
      combined.includes('ቆርቆሮ') ||
      combined.includes('corrugated') ||
      combined.includes('sheet') ||
      combined.includes('cish') ||
      grade.includes('grade c') ||
      grade.includes('grade d')
    ) {
      typology = 'tinRoof';
      typologyLabelAm = 'ቆርቆሮ';
      typologyLabelEn = 'Tin Roof / Corrugated Iron';
    } else {
      typology = 'standardHouse';
      typologyLabelAm = 'ተራ ቤት';
      typologyLabelEn = 'Standard / Ordinary House';
    }
  }

  // Shenshan, Hall, Warehouse, Garage are strictly Commercial in Form 02
  if (
    mainCategory === 'residential' &&
    (typology === 'shenshan' || typology === 'hall' || typology === 'warehouse' || typology === 'garage')
  ) {
    typology = 'standardHouse';
    typologyLabelAm = 'ተራ ቤት';
    typologyLabelEn = 'Standard House';
  }

  const rentVal =
    typeof t.rent_amount === 'number'
      ? t.rent_amount
      : typeof t.rent === 'number'
      ? t.rent
      : Number(t.rent_amount || t.rent || 0);

  return {
    tenantCode: t.identifier_code || t.tenantCode || '',
    tenantName: t.tenant_name || t.tenantName || 'Unknown',
    branchCode: branchInfo.branchCode,
    branchName: branchInfo.branchName,
    mainCategory,
    typology,
    typologyLabelAm,
    typologyLabelEn,
    historicalUse: t.historical_use || t.category || '',
    buildingGrade: t.building_grade || '',
    houseNumber: t.house_number || t.unit || '',
    rent: rentVal
  };
}

export function computeRowGrandTotals(
  res: Form02ResidentialCounts,
  com: Form02CommercialCounts
): { residential: Form02ResidentialCounts; commercial: Form02CommercialCounts; grandTotal: Form02GrandTotalCounts } {
  const residential: Form02ResidentialCounts = {
    ...res,
    total: res.apartment + res.tinRoof + res.villa + res.standardHouse + res.hostel
  };

  const commercial: Form02CommercialCounts = {
    ...com,
    total:
      com.apartment +
      com.tinRoof +
      com.villa +
      com.standardHouse +
      com.shenshan +
      com.hall +
      com.warehouse +
      com.garage +
      com.hostel
  };

  const grandTotal: Form02GrandTotalCounts = {
    apartment: residential.apartment + commercial.apartment,
    tinRoof: residential.tinRoof + commercial.tinRoof,
    villa: residential.villa + commercial.villa,
    standardHouse: residential.standardHouse + commercial.standardHouse,
    shenshan: commercial.shenshan,
    hall: commercial.hall,
    warehouse: commercial.warehouse,
    garage: commercial.garage,
    hostel: residential.hostel + commercial.hostel,
    total: residential.total + commercial.total
  };

  return { residential, commercial, grandTotal };
}

export function computeSummaryGrandTotals(rows: Form02BranchRow[]): {
  residential: Form02ResidentialCounts;
  commercial: Form02CommercialCounts;
  grandTotal: Form02GrandTotalCounts;
} {
  const sumRes: Form02ResidentialCounts = {
    apartment: 0,
    tinRoof: 0,
    villa: 0,
    standardHouse: 0,
    hostel: 0,
    total: 0
  };

  const sumCom: Form02CommercialCounts = {
    apartment: 0,
    tinRoof: 0,
    villa: 0,
    standardHouse: 0,
    shenshan: 0,
    hall: 0,
    warehouse: 0,
    garage: 0,
    hostel: 0,
    total: 0
  };

  rows.forEach(r => {
    sumRes.apartment += r.residential.apartment;
    sumRes.tinRoof += r.residential.tinRoof;
    sumRes.villa += r.residential.villa;
    sumRes.standardHouse += r.residential.standardHouse;
    sumRes.hostel += r.residential.hostel;
    sumRes.total += r.residential.total;

    sumCom.apartment += r.commercial.apartment;
    sumCom.tinRoof += r.commercial.tinRoof;
    sumCom.villa += r.commercial.villa;
    sumCom.standardHouse += r.commercial.standardHouse;
    sumCom.shenshan += r.commercial.shenshan;
    sumCom.hall += r.commercial.hall;
    sumCom.warehouse += r.commercial.warehouse;
    sumCom.garage += r.commercial.garage;
    sumCom.hostel += r.commercial.hostel;
    sumCom.total += r.commercial.total;
  });

  const sumGrand: Form02GrandTotalCounts = {
    apartment: sumRes.apartment + sumCom.apartment,
    tinRoof: sumRes.tinRoof + sumCom.tinRoof,
    villa: sumRes.villa + sumCom.villa,
    standardHouse: sumRes.standardHouse + sumCom.standardHouse,
    shenshan: sumCom.shenshan,
    hall: sumCom.hall,
    warehouse: sumCom.warehouse,
    garage: sumCom.garage,
    hostel: sumRes.hostel + sumCom.hostel,
    total: sumRes.total + sumCom.total
  };

  return { residential: sumRes, commercial: sumCom, grandTotal: sumGrand };
}

export class Form02Database {
  private static instance: Form02Database;

  public static getInstance(): Form02Database {
    if (!Form02Database.instance) {
      Form02Database.instance = new Form02Database();
    }
    return Form02Database.instance;
  }

  public getReport(): Form02ReportDocument {
    if (typeof window === 'undefined') return INITIAL_FORM_02_DATA;
    try {
      const liveTenants = tenantDb.getTenants();
      if (liveTenants.length > 0) {
        return this.generateFromTenants(liveTenants);
      }
      return INITIAL_FORM_02_DATA;
    } catch {
      return INITIAL_FORM_02_DATA;
    }
  }

  public saveReport(report: Form02ReportDocument) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      FORM_02_STORAGE_KEY,
      JSON.stringify({
        ...report,
        updatedAt: new Date().toISOString()
      })
    );
  }

  public resetToBenchmark(): Form02ReportDocument {
    this.saveReport(INITIAL_FORM_02_DATA);
    return INITIAL_FORM_02_DATA;
  }

  /**
   * Generates Form 02 directly from the live Master Tenant records.
   * Every branch row and typology count is dynamically computed from tenant records.
   */
  public generateFromTenants(tenants: TenantRecord[]): Form02ReportDocument {
    const currentDoc = this.getReport();

    if (!tenants || tenants.length === 0) {
      return INITIAL_FORM_02_DATA;
    }

    // Group tenants by branch
    const branchMap = new Map<string, { branchCode: string; branchName: string; tenants: TenantRecord[] }>();

    tenants.forEach(t => {
      const info = resolveBranchInfo(t.sub_city || t.branch || t.city);
      const key = info.branchCode || '1';
      if (!branchMap.has(key)) {
        branchMap.set(key, {
          branchCode: info.branchCode,
          branchName: info.branchName,
          tenants: []
        });
      }
      branchMap.get(key)!.tenants.push(t);
    });

    // Sort branches by code
    const sortedBranches = Array.from(branchMap.values()).sort((a, b) => {
      const numA = parseInt(a.branchCode, 10) || 999;
      const numB = parseInt(b.branchCode, 10) || 999;
      return numA - numB;
    });

    const rows: Form02BranchRow[] = sortedBranches.map((b, index) => {
      const resCounts: Form02ResidentialCounts = {
        apartment: 0,
        tinRoof: 0,
        villa: 0,
        standardHouse: 0,
        hostel: 0,
        total: 0
      };

      const comCounts: Form02CommercialCounts = {
        apartment: 0,
        tinRoof: 0,
        villa: 0,
        standardHouse: 0,
        shenshan: 0,
        hall: 0,
        warehouse: 0,
        garage: 0,
        hostel: 0,
        total: 0
      };

      b.tenants.forEach(t => {
        const c = classifyTenantForForm02(t);
        if (c.mainCategory === 'residential') {
          if (c.typology === 'apartment') resCounts.apartment++;
          else if (c.typology === 'tinRoof') resCounts.tinRoof++;
          else if (c.typology === 'villa') resCounts.villa++;
          else if (c.typology === 'hostel') resCounts.hostel++;
          else resCounts.standardHouse++;
        } else {
          if (c.typology === 'apartment') comCounts.apartment++;
          else if (c.typology === 'tinRoof') comCounts.tinRoof++;
          else if (c.typology === 'villa') comCounts.villa++;
          else if (c.typology === 'shenshan') comCounts.shenshan++;
          else if (c.typology === 'hall') comCounts.hall++;
          else if (c.typology === 'warehouse') comCounts.warehouse++;
          else if (c.typology === 'garage') comCounts.garage++;
          else if (c.typology === 'hostel') comCounts.hostel++;
          else comCounts.standardHouse++;
        }
      });

      const { residential, commercial, grandTotal } = computeRowGrandTotals(resCounts, comCounts);

      return {
        id: `branch-row-${b.branchCode}`,
        sn: index + 1,
        branchCode: b.branchCode,
        branchName: b.branchCode,
        residential,
        commercial,
        grandTotal
      };
    });

    // If single branch or only 1 branch generated, ensure row is labeled as in official format
    if (rows.length === 1) {
      rows[0].branchName = '1';
    }

    const updatedDoc: Form02ReportDocument = {
      ...currentDoc,
      rows,
      sourceTenantCount: tenants.length,
      syncMode: 'auto',
      lastSyncedAt: new Date().toISOString()
    };

    this.saveReport(updatedDoc);
    return updatedDoc;
  }

  public updateCell(
    rowId: string,
    section: 'residential' | 'commercial',
    field: string,
    value: number
  ): Form02ReportDocument {
    const report = this.getReport();
    const rows = report.rows.map(r => {
      if (r.id !== rowId) return r;

      const newRes = { ...r.residential };
      const newCom = { ...r.commercial };

      if (section === 'residential') {
        (newRes as any)[field] = Math.max(0, value);
      } else {
        (newCom as any)[field] = Math.max(0, value);
      }

      const { residential, commercial, grandTotal } = computeRowGrandTotals(newRes, newCom);

      return {
        ...r,
        residential,
        commercial,
        grandTotal
      };
    });

    const updated: Form02ReportDocument = {
      ...report,
      syncMode: 'manual',
      rows
    };
    this.saveReport(updated);
    return updated;
  }

  public addBranchRow(branchName: string): Form02ReportDocument {
    const report = this.getReport();
    const nextSn = report.rows.length + 1;
    const newRow: Form02BranchRow = {
      id: `branch-row-${Date.now()}`,
      sn: nextSn,
      branchCode: String(nextSn),
      branchName: branchName || String(nextSn),
      residential: { apartment: 0, tinRoof: 0, villa: 0, standardHouse: 0, hostel: 0, total: 0 },
      commercial: {
        apartment: 0,
        tinRoof: 0,
        villa: 0,
        standardHouse: 0,
        shenshan: 0,
        hall: 0,
        warehouse: 0,
        garage: 0,
        hostel: 0,
        total: 0
      },
      grandTotal: {
        apartment: 0,
        tinRoof: 0,
        villa: 0,
        standardHouse: 0,
        shenshan: 0,
        hall: 0,
        warehouse: 0,
        garage: 0,
        hostel: 0,
        total: 0
      }
    };

    const updated: Form02ReportDocument = {
      ...report,
      syncMode: 'manual',
      rows: [...report.rows, newRow]
    };
    this.saveReport(updated);
    return updated;
  }

  public deleteBranchRow(rowId: string): Form02ReportDocument {
    const report = this.getReport();
    const rows = report.rows
      .filter(r => r.id !== rowId)
      .map((r, idx) => ({
        ...r,
        sn: idx + 1
      }));
    const updated: Form02ReportDocument = {
      ...report,
      syncMode: 'manual',
      rows
    };
    this.saveReport(updated);
    return updated;
  }

  public updateSignatures(signatures: Partial<Form02ReportDocument['signatures']>): Form02ReportDocument {
    const report = this.getReport();
    const updated: Form02ReportDocument = {
      ...report,
      signatures: {
        ...report.signatures,
        ...signatures
      }
    };
    this.saveReport(updated);
    return updated;
  }

  /**
   * Adds or updates a single tenant in the master registry and recalculates Form 02
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
      tenant_name: tenantData.tenant_name || tenantData.tenantName || 'New Tenant',
      tenantName: tenantData.tenant_name || tenantData.tenantName || 'New Tenant',
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
      status: 'Active',
      work_status: 'Active Lease',
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
   * Deletes a tenant from the master registry and recalculates Form 02
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

export const form02Db = Form02Database.getInstance();

// Auto-subscribe to tenant table updates so any tenant addition, edit, or upload recalculates Form 02 instantly
if (typeof window !== 'undefined') {
  tenantDb.subscribe((tenants) => {
    if (tenants.length > 0) {
      form02Db.generateFromTenants(tenants);
    } else {
      form02Db.resetToBenchmark();
    }
  });
}
