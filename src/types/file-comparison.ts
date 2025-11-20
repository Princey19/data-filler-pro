export interface FileData {
  name: string;
  headers: string[];
  rows: Record<string, any>[];
  format: 'csv' | 'xlsx';
}

export interface ColumnMapping {
  keyColumnsA: string[];
  keyColumnsB: string[];
  sourceColumns: string[];
  targetColumns: string[];
}

export interface MatchResult {
  rowIndexB: number;
  matchedRowA: number | null;
  keyValue: string;
  changes: ColumnChange[];
  confidence: number;
  status: 'matched' | 'no-match' | 'duplicate' | 'no-source-value';
}

export interface ColumnChange {
  column: string;
  oldValue: any;
  newValue: any;
  isEmpty: boolean;
}

export interface ComparisonOptions {
  onlyFillEmpty: boolean;
  ignoreCase: boolean;
  normalizeWhitespace: boolean;
}
