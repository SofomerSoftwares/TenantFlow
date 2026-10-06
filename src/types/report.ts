export interface Form01CategoryCounts {
  residential: number; // መኖሪያ
  commercial: number;  // ድርጅት
  total: number;       // ድምር
}

export interface Form01BranchRow {
  id: string;
  sn: number;           // ተ.ቁ
  branchCode: string;   // 1, 2, 3 or code
  branchName: string;   // ቅርንጫፍ (e.g. ቅርንጫፍ 1, ቦሌ, ቂርቆስ)
  
  // በቅርንጫፉ ጽ/ቤት የሚገኙ ቤቶች ብዛት እስከ...ሰኔ
  inBranchOffice: Form01CategoryCounts;

  // እስከ ሰኔ 30/2018 ዓ.ም በተለያየ መንገድ ከኮርፖሬሽኑ የወጡ ቤቶች ብዛት
  demolished: Form01CategoryCounts;            // በልማት የፈረሱ
  transferredByDecision: Form01CategoryCounts; // ለሌላ ተቋም በውሳኔ
  sold: Form01CategoryCounts;                  // በሽያጭ
  merged: Form01CategoryCounts;                // የተቀላቀሉ
  other: Form01CategoryCounts;                 // ሌላ
  privatized: Form01CategoryCounts;            // በፕራይቬታይዜሽን ውሳኔ
  courtDecision: Form01CategoryCounts;         // በፍርድ ቤት ውሳኔ
  totalExited: Form01CategoryCounts;           // በጠቅላላው ከቅርንጫፉ / ከአጀንሲው

  // Remaining active houses:
  remainingActive?: Form01CategoryCounts;

  remarks?: string;
}

export interface Form01ReportDocument {
  id: string;
  formNumber: string; // "ቅጽ - 01"
  titleAmharic: string; // "በፌዴራል ቤቶች ኮርፖሬሽን የሚያስተዳድራቸው ቤቶች ብዛት በየቅርንጫፍ የሚሳይ ቅጽ - 01"
  titleEnglish: string; // "Federal Housing Corporation Housing Inventory Administered by Branch - Form 01"
  cutoffDateEth: string; // "እስከ ሰኔ 30/2018 ዓ.ም"
  baselineDateEth: string; // "እስከ ሰኔ 30/2017 ዓ.ም"
  preparedBy: string;
  verifiedBy: string;
  approvedBy: string;
  updatedAt: string;
  sourceTenantCount?: number;
  syncMode?: 'auto' | 'manual';
  lastSyncedAt?: string;
  rows: Form01BranchRow[];
}

export type Form01DispositionType =
  | 'active'
  | 'demolished'
  | 'transferred'
  | 'sold'
  | 'merged'
  | 'other'
  | 'privatized'
  | 'court';

export interface TenantForm01Classification {
  tenantCode: string;
  tenantName: string;
  branchKey: string;
  branchName: string;
  category: 'residential' | 'commercial';
  categoryLabelAm: string;
  categoryLabelEn: string;
  disposition: Form01DispositionType;
  dispositionLabelAm: string;
  dispositionLabelEn: string;
  workStatus: string;
  historicalUse: string;
  rent: number;
  unit: string;
  woreda: string;
}
