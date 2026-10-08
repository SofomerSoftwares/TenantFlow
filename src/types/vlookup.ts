export type VlookupMatchMode = 'exact' | 'normalized' | 'fuzzy';
export type VlookupNaHandling = '#N/A' | 'Not Found' | 'አልተገኘም' | 'empty' | '0' | 'custom';
export type VlookupFormulaType = 'VLOOKUP' | 'XLOOKUP' | 'INDEX_MATCH';

export interface VlookupConfig {
  sourceFileName: string;
  referenceFileName: string;
  sourceKeyColumn: string;
  referenceKeyColumn: string;
  returnColumns: string[];
  returnColumnAliases?: Record<string, string>;
  matchMode: VlookupMatchMode;
  fuzzyThreshold?: number; // 0.0 to 1.0 (default 0.8)
  naHandling: VlookupNaHandling;
  customNaValue?: string;
  formulaType: VlookupFormulaType;
  referenceSheetName?: string;
}

export interface VlookupRowResult {
  rowIndex: number;
  excelRowNumber: number;
  originalRow: Record<string, any>;
  lookupKey: string;
  isMatched: boolean;
  matchScore?: number;
  matchedReferenceRow?: Record<string, any> | null;
  pulledValues: Record<string, any>;
  formulas: Record<string, string>;
  hasDiscrepancies?: boolean;
  discrepancies?: {
    column: string;
    sourceVal: any;
    lookedUpVal: any;
  }[];
}

export interface VlookupSummaryStats {
  totalRows: number;
  matchedCount: number;
  unmatchedCount: number;
  matchRatePercent: number;
  duplicateKeysInReference: number;
  duplicateKeysInSource: number;
  executionTimeMs: number;
  discrepanciesCount: number;
}

export interface VlookupExecutionResult {
  config: VlookupConfig;
  sourceHeaders: string[];
  referenceHeaders: string[];
  outputHeaders: string[];
  rows: VlookupRowResult[];
  summary: VlookupSummaryStats;
  sampleFormula: string;
}
