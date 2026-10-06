export interface Form02ResidentialCounts {
  apartment: number;       // አፓርትማ
  tinRoof: number;         // ቆርቆሮ
  villa: number;           // ቪላ
  standardHouse: number;   // ተራ ቤት
  hostel: number;          // ሆስቴል
  total: number;           // ድምር
}

export interface Form02CommercialCounts {
  apartment: number;       // አፓርትማ
  tinRoof: number;         // ቆርቆሮ
  villa: number;           // ቪላ
  standardHouse: number;   // ተራ ቤት
  shenshan: number;        // ሸንሻን
  hall: number;            // አዳራሽ
  warehouse: number;       // መጋዘን
  garage: number;          // ጋራዥ
  hostel: number;          // ሆስቴል
  total: number;           // ድምር
}

export interface Form02GrandTotalCounts {
  apartment: number;       // አፓርትማ
  tinRoof: number;         // ቆርቆሮ
  villa: number;           // ቪላ
  standardHouse: number;   // ተራ ቤት
  shenshan: number;        // ሸንሻን
  hall: number;            // አዳራሽ
  warehouse: number;       // መጋዘን
  garage: number;          // ጋራዥ
  hostel: number;          // ሆስቴል
  total: number;           // ድምር
}

export interface Form02BranchRow {
  id: string;
  sn: number;              // ተ/ቁ
  branchCode: string;      // 1, 2, 3...
  branchName: string;      // ቅርንጫፍ ጽ/ቤት (e.g., "1" or "ቅርንጫፍ 1")
  residential: Form02ResidentialCounts;
  commercial: Form02CommercialCounts;
  grandTotal: Form02GrandTotalCounts;
}

export interface Form02SignaturePerson {
  title: string;           // ያዘጋጀው / ያረጋገጠው / የፀደቀው
  name: string;            // ስም
  signature: string;       // ፊርማ (e.g., "Signed" or status)
  dateEth: string;         // ቀን (e.g., "30/04/2018 ዓ.ም")
}

export interface Form02Signatures {
  preparedBy: Form02SignaturePerson;
  verifiedBy: Form02SignaturePerson;
  approvedBy: Form02SignaturePerson;
}

export interface Form02ReportDocument {
  id: string;
  formNumber: string;      // "ቅጽ - 02"
  titleAmharic: string;    // "በፌዴራል ቤቶች ኮርፖሬሽን የሚያስተዳድራቸው ቤቶች ብዛት በቅርንጫፍ የሚያሳይ ቅጽ - 02"
  titleEnglish: string;    // "Federal Housing Corporation - Number of Houses Administered by Branch Showing Form - 02"
  sectionTitleAmharic: string; // "አሁን በቅርንጫፍ ያለ የኮርፖሬሽኑ ቤቶች ብዛት"
  sectionTitleEnglish: string; // "Current Number of Corporation Houses in Branch"
  rows: Form02BranchRow[];
  signatures: Form02Signatures;
  updatedAt: string;
  sourceTenantCount?: number;
  syncMode?: 'auto' | 'manual';
  lastSyncedAt?: string;
}

export type Form02BuildingTypology =
  | 'apartment'
  | 'tinRoof'
  | 'villa'
  | 'standardHouse'
  | 'shenshan'
  | 'hall'
  | 'warehouse'
  | 'garage'
  | 'hostel';

export interface TenantForm02Classification {
  tenantCode: string;
  tenantName: string;
  branchCode: string;
  branchName: string;
  mainCategory: 'residential' | 'commercial';
  typology: Form02BuildingTypology;
  typologyLabelAm: string;
  typologyLabelEn: string;
  historicalUse: string;
  buildingGrade: string;
  houseNumber: string;
  rent: number;
}
