import {
  VlookupConfig,
  VlookupExecutionResult,
  VlookupRowResult,
  VlookupSummaryStats
} from '@/src/types/vlookup';

/**
 * Converts 1-based column index to Excel column letter (1 -> 'A', 26 -> 'Z', 27 -> 'AA', etc.)
 */
export function colIndexToLetter(colIndex: number): string {
  let temp: number;
  let letter = '';
  while (colIndex > 0) {
    temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colIndex = (colIndex - temp - 1) / 26;
  }
  return letter || 'A';
}

/**
 * Normalizes string keys for robust matching across spreadsheets
 */
export function normalizeKey(val: any): string {
  if (val === undefined || val === null) return '';
  const str = String(val).trim().toLowerCase();
  // Remove non-alphanumeric separators (spaces, hyphens, slashes, underscores)
  return str.replace(/[\s\-_\\/]+/g, '');
}

/**
 * Strips leading zeros for numeric identifier matching ('0042' -> '42')
 */
export function stripLeadingZeros(str: string): string {
  return str.replace(/^0+/, '') || '0';
}

/**
 * Bigram similarity score between two strings (0.0 to 1.0)
 */
export function calculateStringSimilarity(s1: string, s2: string): number {
  const str1 = s1.trim().toLowerCase();
  const str2 = s2.trim().toLowerCase();
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  if (str1.length < 2 || str2.length < 2) return str1 === str2 ? 1.0 : 0.0;

  const getBigrams = (str: string) => {
    const bigrams = new Map<string, number>();
    for (let i = 0; i < str.length - 1; i++) {
      const b = str.substring(i, i + 2);
      bigrams.set(b, (bigrams.get(b) || 0) + 1);
    }
    return bigrams;
  };

  const b1 = getBigrams(str1);
  const b2 = getBigrams(str2);
  let intersection = 0;

  for (const [k, count1] of b1.entries()) {
    if (b2.has(k)) {
      intersection += Math.min(count1, b2.get(k)!);
    }
  }

  const total = (str1.length - 1) + (str2.length - 1);
  return (2.0 * intersection) / total;
}

/**
 * Main VLOOKUP execution engine
 */
export function executeVlookup(
  sourceRows: Record<string, any>[],
  referenceRows: Record<string, any>[],
  config: VlookupConfig
): VlookupExecutionResult {
  const startTime = performance.now();

  const sourceHeaders = sourceRows.length > 0 ? Object.keys(sourceRows[0]) : [];
  const referenceHeaders = referenceRows.length > 0 ? Object.keys(referenceRows[0]) : [];

  const refSheet = config.referenceSheetName || 'Master';
  const sourceKeyCol = config.sourceKeyColumn;
  const refKeyCol = config.referenceKeyColumn;
  const returnCols = config.returnColumns;

  // Determine Excel column coordinates
  const sourceKeyColIdx = Math.max(1, sourceHeaders.indexOf(sourceKeyCol) + 1);
  const sourceKeyColLetter = colIndexToLetter(sourceKeyColIdx);

  const refKeyColIdx = Math.max(1, referenceHeaders.indexOf(refKeyCol) + 1);
  const refKeyColLetter = colIndexToLetter(refKeyColIdx);

  const refMaxColIdx = Math.max(refKeyColIdx, ...returnCols.map(c => referenceHeaders.indexOf(c) + 1), referenceHeaders.length);
  const refMaxColLetter = colIndexToLetter(refMaxColIdx);
  const refTotalRows = referenceRows.length + 1; // including header

  // Build Reference Index Maps
  // 1. Exact map: raw string
  const exactMap = new Map<string, Record<string, any>[]>();
  // 2. Normalized map: stripped & lowercase
  const normalizedMap = new Map<string, Record<string, any>[]>();
  // 3. Numeric zero-stripped map
  const zeroStrippedMap = new Map<string, Record<string, any>[]>();

  let duplicateKeysInReference = 0;

  referenceRows.forEach(row => {
    const rawVal = row[refKeyCol];
    if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') return;

    const exactKey = String(rawVal).trim();
    const normKey = normalizeKey(exactKey);
    const zeroKey = stripLeadingZeros(normKey);

    // Exact map
    const exList = exactMap.get(exactKey) || [];
    exList.push(row);
    exactMap.set(exactKey, exList);
    if (exList.length === 2) duplicateKeysInReference++;

    // Normalized map
    const normList = normalizedMap.get(normKey) || [];
    normList.push(row);
    normalizedMap.set(normKey, normList);

    // Zero stripped map
    const zeroList = zeroStrippedMap.get(zeroKey) || [];
    zeroList.push(row);
    zeroStrippedMap.set(zeroKey, zeroList);
  });

  // Track duplicate keys in source
  const sourceKeyCount = new Map<string, number>();
  sourceRows.forEach(r => {
    const k = String(r[sourceKeyCol] ?? '').trim();
    if (k) sourceKeyCount.set(k, (sourceKeyCount.get(k) || 0) + 1);
  });
  let duplicateKeysInSource = 0;
  for (const count of sourceKeyCount.values()) {
    if (count > 1) duplicateKeysInSource++;
  }

  // Value for unmatched NA
  const getNaValue = () => {
    if (config.naHandling === 'custom') return config.customNaValue ?? '#N/A';
    if (config.naHandling === 'empty') return '';
    if (config.naHandling === '0') return 0;
    return config.naHandling;
  };

  const naPlaceholder = getNaValue();

  let matchedCount = 0;
  let discrepanciesCount = 0;

  // Process rows
  const rowResults: VlookupRowResult[] = sourceRows.map((sourceRow, idx) => {
    const excelRow = idx + 2; // Excel row number (1-based header)
    const rawLookupVal = sourceRow[sourceKeyCol];
    const lookupKey = rawLookupVal !== undefined && rawLookupVal !== null ? String(rawLookupVal).trim() : '';

    let matchedRefRow: Record<string, any> | null = null;
    let matchScore = 0;

    if (lookupKey) {
      if (config.matchMode === 'exact') {
        const matches = exactMap.get(lookupKey);
        if (matches && matches.length > 0) {
          matchedRefRow = matches[0];
          matchScore = 1.0;
        }
      } else if (config.matchMode === 'normalized') {
        // Try exact first
        const ex = exactMap.get(lookupKey);
        if (ex && ex.length > 0) {
          matchedRefRow = ex[0];
          matchScore = 1.0;
        } else {
          // Try normalized
          const normKey = normalizeKey(lookupKey);
          const normMatch = normalizedMap.get(normKey);
          if (normMatch && normMatch.length > 0) {
            matchedRefRow = normMatch[0];
            matchScore = 0.95;
          } else {
            // Try zero-stripped
            const zeroKey = stripLeadingZeros(normKey);
            const zeroMatch = zeroStrippedMap.get(zeroKey);
            if (zeroMatch && zeroMatch.length > 0) {
              matchedRefRow = zeroMatch[0];
              matchScore = 0.90;
            }
          }
        }
      } else if (config.matchMode === 'fuzzy') {
        // Try normalized first
        const normKey = normalizeKey(lookupKey);
        const normMatch = normalizedMap.get(normKey);
        if (normMatch && normMatch.length > 0) {
          matchedRefRow = normMatch[0];
          matchScore = 1.0;
        } else {
          // Search reference entries with highest similarity
          let bestScore = 0;
          let bestRow: Record<string, any> | null = null;
          const threshold = config.fuzzyThreshold ?? 0.8;

          for (const refRow of referenceRows) {
            const refVal = String(refRow[refKeyCol] ?? '').trim();
            if (!refVal) continue;
            const sim = calculateStringSimilarity(lookupKey, refVal);
            if (sim > bestScore) {
              bestScore = sim;
              bestRow = refRow;
            }
            if (bestScore === 1.0) break;
          }

          if (bestScore >= threshold && bestRow) {
            matchedRefRow = bestRow;
            matchScore = bestScore;
          }
        }
      }
    }

    const isMatched = matchedRefRow !== null;
    if (isMatched) matchedCount++;

    const pulledValues: Record<string, any> = {};
    const formulas: Record<string, string> = {};
    const discrepancies: { column: string; sourceVal: any; lookedUpVal: any }[] = [];

    returnCols.forEach(col => {
      const alias = config.returnColumnAliases?.[col] || col;
      const val = isMatched ? (matchedRefRow![col] ?? '') : naPlaceholder;
      pulledValues[alias] = val;

      // Construct authentic Excel Formula
      const refColIdx = Math.max(1, referenceHeaders.indexOf(col) + 1);
      const targetColLetter = colIndexToLetter(refColIdx);

      let formula = '';
      if (config.formulaType === 'XLOOKUP') {
        const naArg = typeof naPlaceholder === 'string' ? `"${naPlaceholder}"` : String(naPlaceholder);
        formula = `=XLOOKUP(${sourceKeyColLetter}${excelRow}, '${refSheet}'!$${refKeyColLetter}$2:$${refKeyColLetter}$${refTotalRows}, '${refSheet}'!$${targetColLetter}$2:$${targetColLetter}$${refTotalRows}, ${naArg})`;
      } else if (config.formulaType === 'INDEX_MATCH') {
        formula = `=INDEX('${refSheet}'!$${targetColLetter}$2:$${targetColLetter}$${refTotalRows}, MATCH(${sourceKeyColLetter}${excelRow}, '${refSheet}'!$${refKeyColLetter}$2:$${refKeyColLetter}$${refTotalRows}, 0))`;
      } else {
        // Classic VLOOKUP: requires index relative to start of table array
        const startColIdx = Math.min(refKeyColIdx, refColIdx);
        const endColIdx = Math.max(refKeyColIdx, refColIdx);
        const relColIdx = Math.abs(refColIdx - refKeyColIdx) + 1;
        const startLetter = colIndexToLetter(startColIdx);
        const endLetter = colIndexToLetter(endColIdx);

        if (naPlaceholder !== '#N/A') {
          const naArg = typeof naPlaceholder === 'string' ? `"${naPlaceholder}"` : String(naPlaceholder);
          formula = `=IFNA(VLOOKUP(${sourceKeyColLetter}${excelRow}, '${refSheet}'!$${startLetter}$2:$${endLetter}$${refTotalRows}, ${relColIdx}, FALSE), ${naArg})`;
        } else {
          formula = `=VLOOKUP(${sourceKeyColLetter}${excelRow}, '${refSheet}'!$${startLetter}$2:$${endLetter}$${refTotalRows}, ${relColIdx}, FALSE)`;
        }
      }
      formulas[alias] = formula;

      // Check discrepancy if source row also has this column
      if (sourceRow[col] !== undefined && isMatched) {
        const sVal = String(sourceRow[col] ?? '').trim().toLowerCase();
        const rVal = String(val ?? '').trim().toLowerCase();
        if (sVal && rVal && sVal !== rVal) {
          discrepancies.push({
            column: col,
            sourceVal: sourceRow[col],
            lookedUpVal: val
          });
        }
      }
    });

    if (discrepancies.length > 0) {
      discrepanciesCount++;
    }

    return {
      rowIndex: idx,
      excelRowNumber: excelRow,
      originalRow: sourceRow,
      lookupKey,
      isMatched,
      matchScore: isMatched ? matchScore : 0,
      matchedReferenceRow: matchedRefRow,
      pulledValues,
      formulas,
      hasDiscrepancies: discrepancies.length > 0,
      discrepancies
    };
  });

  const totalRows = sourceRows.length;
  const unmatchedCount = totalRows - matchedCount;
  const matchRatePercent = totalRows > 0 ? Math.round((matchedCount / totalRows) * 1000) / 10 : 0;
  const executionTimeMs = Math.round((performance.now() - startTime) * 10) / 10;

  const outputHeaders = [
    ...sourceHeaders,
    ...returnCols.map(col => config.returnColumnAliases?.[col] || col)
  ];

  // Sample Formula for first return column
  const firstReturnCol = returnCols[0] || '';
  const firstReturnAlias = config.returnColumnAliases?.[firstReturnCol] || firstReturnCol;
  const sampleFormula = rowResults[0]?.formulas[firstReturnAlias] || `=VLOOKUP(A2, '${refSheet}'!$A$2:$H$5000, 2, FALSE)`;

  const summary: VlookupSummaryStats = {
    totalRows,
    matchedCount,
    unmatchedCount,
    matchRatePercent,
    duplicateKeysInReference,
    duplicateKeysInSource,
    executionTimeMs,
    discrepanciesCount
  };

  return {
    config,
    sourceHeaders,
    referenceHeaders,
    outputHeaders,
    rows: rowResults,
    summary,
    sampleFormula
  };
}
