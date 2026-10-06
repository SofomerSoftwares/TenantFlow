export type Form03TypologyKey =
  | 'apartment'
  | 'tinRoof'
  | 'villa'
  | 'standardHouse'
  | 'hostel'
  | 'hall'
  | 'shenshan'
  | 'garage';

export interface Form03Counts {
  houseCount: number;    // የቤት ብዛት
  tenantCount: number;   // የተከራይ ብዛት
}

export interface Form03TypologyRow {
  sn: number;                  // ተ/ቁ
  typologyKey: Form03TypologyKey;
  typologyLabelAm: string;     // አፓርትማ, ቆርቆሮ, ቪላ, etc.
  typologyLabelEn: string;
  residential: Form03Counts;   // መኖሪያ
  commercial: Form03Counts;    // ድርጅት
  grandTotal: Form03Counts;    // ጠቅላላ ድምር
  remarks?: string;            // ምርመራ
}

export interface Form03Signatures {
  preparedBy: {
    title: string;             // ያዘጋጀው
    name: string;              // አማዋደሽ መላኩ
    signature: string;
    dateEth: string;           // 30/04/2018 ዓ.ም
  };
  verifiedBy: {
    title: string;             // ያረጋገጠው
    name: string;              // ተስፋዬ ንጉሴ
    signature: string;
    dateEth: string;           // 30/04/2018 ዓ.ም
  };
  approvedBy: {
    title: string;             // የፀደቀው
    name: string;
    signature: string;
    dateEth: string;           // 30/04/2018 ዓ.ም
  };
}

export interface Form03ReportDocument {
  id: string;
  formNumber: string;          // "ቅጽ - 03"
  topHeaderAmharic: string;    // "የፌዴራል ቤቶች ኮርፖሬሽን"
  titleAmharic: string;        // "በቅርንጫፍ አንድ ያሉ ቤቶችና ተከራዮች ብዛት የሚያሳይ ቅጽ - 03"
  titleEnglish: string;        // "Federal Housing Corporation - Number of Houses and Tenants in Branch 1 (Form - 03)"
  branchName: string;          // "ቅርንጫፍ 1"
  branchCode: string;          // "1"
  rows: Form03TypologyRow[];
  totals: {
    residential: Form03Counts;
    commercial: Form03Counts;
    grandTotal: Form03Counts;
  };
  signatures: Form03Signatures;
  updatedAt: string;
  sourceTenantCount?: number;
  syncMode?: 'auto' | 'manual';
  lastSyncedAt?: string;
}
