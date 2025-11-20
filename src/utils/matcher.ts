import { FileData, ColumnMapping, MatchResult, ComparisonOptions } from '@/types/file-comparison';

const normalizeValue = (value: any, options: ComparisonOptions): string => {
  let str = String(value || '').trim();
  
  if (options.normalizeWhitespace) {
    str = str.replace(/\s+/g, ' ');
  }
  
  if (options.ignoreCase) {
    str = str.toLowerCase();
  }
  
  return str;
};

const createKey = (row: Record<string, any>, columns: string[], options: ComparisonOptions): string => {
  return columns
    .map(col => normalizeValue(row[col], options))
    .join('||');
};

export const compareFiles = (
  fileA: FileData,
  fileB: FileData,
  mapping: ColumnMapping,
  options: ComparisonOptions
): MatchResult[] => {
  // Build index from File A
  const indexA = new Map<string, number[]>();
  
  fileA.rows.forEach((row, index) => {
    const key = createKey(row, mapping.keyColumnsA, options);
    if (!indexA.has(key)) {
      indexA.set(key, []);
    }
    indexA.get(key)!.push(index);
  });

  // Compare File B rows
  const results: MatchResult[] = [];

  fileB.rows.forEach((rowB, indexB) => {
    const keyB = createKey(rowB, mapping.keyColumnsB, options);
    const matchingIndices = indexA.get(keyB) || [];

    if (matchingIndices.length === 0) {
      // No match found
      results.push({
        rowIndexB: indexB,
        matchedRowA: null,
        keyValue: keyB,
        changes: [],
        confidence: 0,
        status: 'no-match',
      });
    } else if (matchingIndices.length > 1) {
      // Duplicate matches in File A
      results.push({
        rowIndexB: indexB,
        matchedRowA: matchingIndices[0],
        keyValue: keyB,
        changes: [],
        confidence: 1,
        status: 'duplicate',
      });
    } else {
      // Single match found
      const matchedIndex = matchingIndices[0];
      const rowA = fileA.rows[matchedIndex];
      const changes = [];
      let hasSourceValue = false;

      for (let i = 0; i < mapping.sourceColumns.length; i++) {
        const sourceCol = mapping.sourceColumns[i];
        const targetCol = mapping.targetColumns[i];
        const oldValue = rowB[targetCol];
        const newValue = rowA[sourceCol];

        const isEmpty = !oldValue || String(oldValue).trim() === '';
        
        // Check if we should make this change
        const shouldChange = isEmpty || !options.onlyFillEmpty;
        const hasValue = newValue && String(newValue).trim() !== '';

        if (shouldChange && hasValue && oldValue !== newValue) {
          changes.push({
            column: targetCol,
            oldValue,
            newValue,
            isEmpty,
          });
          hasSourceValue = true;
        }
      }

      results.push({
        rowIndexB: indexB,
        matchedRowA: matchedIndex,
        keyValue: keyB,
        changes,
        confidence: 1,
        status: hasSourceValue || changes.length > 0 ? 'matched' : 'no-source-value',
      });
    }
  });

  return results;
};

export const applyChanges = (
  fileB: FileData,
  results: MatchResult[],
  selectedRows: Set<number>
): FileData => {
  const updatedRows = fileB.rows.map((row, index) => {
    if (!selectedRows.has(index)) {
      return { ...row };
    }

    const result = results.find(r => r.rowIndexB === index);
    if (!result || result.changes.length === 0) {
      return { ...row };
    }

    const updatedRow = { ...row };
    result.changes.forEach(change => {
      updatedRow[change.column] = change.newValue;
    });

    return updatedRow;
  });

  return {
    ...fileB,
    rows: updatedRows,
  };
};
