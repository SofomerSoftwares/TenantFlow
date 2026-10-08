import * as XLSX from 'xlsx';
import { VlookupExecutionResult } from '@/src/types/vlookup';

/**
 * Exports enriched VLOOKUP result table into a formatted Excel workbook (.xlsx)
 */
export function exportVlookupResultExcel(
  result: VlookupExecutionResult,
  options: { includeFormulas?: boolean; onlyUnmatched?: boolean; onlyDiscrepancies?: boolean } = {}
) {
  const wb = XLSX.utils.book_new();

  let rowsToExport = result.rows;
  if (options.onlyUnmatched) {
    rowsToExport = result.rows.filter(r => !r.isMatched);
  } else if (options.onlyDiscrepancies) {
    rowsToExport = result.rows.filter(r => r.hasDiscrepancies);
  }

  // Build Sheet 1 Data Array
  const sheetData: any[][] = [];

  // Header row
  sheetData.push(result.outputHeaders);

  // Data rows
  rowsToExport.forEach(r => {
    const rowValues: any[] = [];
    // Source columns
    result.sourceHeaders.forEach(h => {
      rowValues.push(r.originalRow[h] ?? '');
    });
    // Pulled VLOOKUP columns
    result.config.returnColumns.forEach(col => {
      const alias = result.config.returnColumnAliases?.[col] || col;
      if (options.includeFormulas && r.formulas[alias]) {
        // Export Excel formula object
        rowValues.push({ f: r.formulas[alias].replace(/^=/, '') });
      } else {
        rowValues.push(r.pulledValues[alias] ?? '');
      }
    });
    sheetData.push(rowValues);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Auto-fit column widths
  const colWidths = result.outputHeaders.map(h => ({
    wch: Math.max(h.length + 4, 14)
  }));
  ws['!cols'] = colWidths;

  const sheetName = options.onlyUnmatched
    ? 'Unmatched_Exceptions'
    : options.onlyDiscrepancies
    ? 'Discrepancies_Report'
    : 'VLOOKUP_Merged';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Embed Reference Table Sheet (Crucial so Excel formulas and references evaluate properly in Excel!)
  if (result.referenceRows && result.referenceRows.length > 0) {
    const refSheetName = result.config.referenceSheetName || 'Master_Registry';
    const refHeaders = result.referenceHeaders;
    const refSheetData: any[][] = [refHeaders];

    result.referenceRows.forEach(r => {
      const rowVals: any[] = [];
      refHeaders.forEach(h => {
        rowVals.push(r[h] ?? '');
      });
      refSheetData.push(rowVals);
    });

    const wsRef = XLSX.utils.aoa_to_sheet(refSheetData);
    const refColWidths = refHeaders.map(h => ({
      wch: Math.max(h.length + 4, 14)
    }));
    wsRef['!cols'] = refColWidths;
    XLSX.utils.book_append_sheet(wb, wsRef, refSheetName);
  }

  // Sheet 3: Audit & Summary Sheet
  const summaryData: any[][] = [
    ['VLOOKUP AUTOMATOR AUDIT REPORT · የቪሉካፕ ሪፖርት'],
    ['Generated Date', new Date().toLocaleString()],
    ['Source Table', result.config.sourceFileName],
    ['Reference Table', result.config.referenceFileName],
    ['Lookup Key Column', result.config.sourceKeyColumn],
    ['Reference Key Column', result.config.referenceKeyColumn],
    ['Match Mode', result.config.matchMode.toUpperCase()],
    ['Formula Style', result.config.formulaType],
    ['Sample Excel Formula', result.sampleFormula],
    ['Formulas Embedded', options.includeFormulas ? 'YES' : 'NO (Values Static)'],
    [],
    ['METRICS', 'VALUE'],
    ['Total Records Processed', result.summary.totalRows],
    ['Successfully Matched', result.summary.matchedCount],
    ['Unmatched (#N/A)', result.summary.unmatchedCount],
    ['Match Rate', `${result.summary.matchRatePercent}%`],
    ['Duplicates in Reference', result.summary.duplicateKeysInReference],
    ['Discrepancies Detected', result.summary.discrepanciesCount],
    ['Execution Duration', `${result.summary.executionTimeMs} ms`],
    [],
    ['PULLED RETURN COLUMNS', 'STATUS']
  ];

  result.config.returnColumns.forEach(col => {
    const alias = result.config.returnColumnAliases?.[col] || col;
    summaryData.push([alias, 'Included in Export']);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Audit_Summary');

  // Trigger download
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = options.onlyUnmatched
    ? `VLOOKUP_Unmatched_Exceptions_${dateStr}.xlsx`
    : options.onlyDiscrepancies
    ? `VLOOKUP_Discrepancies_${dateStr}.xlsx`
    : options.includeFormulas
    ? `VLOOKUP_Enriched_With_Formulas_${dateStr}.xlsx`
    : `VLOOKUP_Merged_Catalog_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
