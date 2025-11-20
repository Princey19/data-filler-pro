import { useState } from 'react';
import { MatchResult } from '@/types/file-comparison';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparisonPreviewProps {
  results: MatchResult[];
  selectedRows: Set<number>;
  onSelectionChange: (selected: Set<number>) => void;
}

export const ComparisonPreview = ({ results, selectedRows, onSelectionChange }: ComparisonPreviewProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;
  
  const resultsWithChanges = results.filter(r => r.changes.length > 0);
  const totalPages = Math.ceil(resultsWithChanges.length / pageSize);
  const paginatedResults = resultsWithChanges.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const summary = {
    total: results.length,
    matched: results.filter(r => r.status === 'matched').length,
    noMatch: results.filter(r => r.status === 'no-match').length,
    duplicate: results.filter(r => r.status === 'duplicate').length,
    withChanges: resultsWithChanges.length,
    selected: selectedRows.size,
  };

  const toggleAll = () => {
    if (selectedRows.size === resultsWithChanges.length) {
      onSelectionChange(new Set());
    } else {
      const allRows = new Set(resultsWithChanges.map(r => r.rowIndexB));
      onSelectionChange(allRows);
    }
  };

  const toggleRow = (rowIndex: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowIndex)) {
      newSelection.delete(rowIndex);
    } else {
      newSelection.add(rowIndex);
    }
    onSelectionChange(newSelection);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return <Badge className="bg-success">{status}</Badge>;
      case 'no-match':
        return <Badge variant="secondary">{status}</Badge>;
      case 'duplicate':
        return <Badge className="bg-warning">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Overview of comparison results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">{summary.total}</div>
              <div className="text-sm text-muted-foreground">Total Rows</div>
            </div>
            <div className="text-center p-4 bg-success/10 rounded-lg">
              <div className="text-2xl font-bold text-success">{summary.matched}</div>
              <div className="text-sm text-muted-foreground">Matched</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">{summary.noMatch}</div>
              <div className="text-sm text-muted-foreground">No Match</div>
            </div>
            <div className="text-center p-4 bg-warning/10 rounded-lg">
              <div className="text-2xl font-bold text-warning">{summary.duplicate}</div>
              <div className="text-sm text-muted-foreground">Duplicates</div>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">{summary.withChanges}</div>
              <div className="text-sm text-muted-foreground">With Changes</div>
            </div>
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <div className="text-2xl font-bold text-accent">{summary.selected}</div>
              <div className="text-sm text-muted-foreground">Selected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {resultsWithChanges.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Changes Preview</CardTitle>
                <CardDescription>
                  Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, resultsWithChanges.length)} of {resultsWithChanges.length} rows with changes
                </CardDescription>
              </div>
              <Button onClick={toggleAll} variant="outline" size="sm">
                {selectedRows.size === resultsWithChanges.length ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Select All
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Row #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Column</TableHead>
                    <TableHead>Old Value</TableHead>
                    <TableHead>New Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedResults.map((result) =>
                    result.changes.map((change, changeIndex) => (
                      <TableRow
                        key={`${result.rowIndexB}-${changeIndex}`}
                        className={cn(
                          selectedRows.has(result.rowIndexB) && "bg-accent/5"
                        )}
                      >
                        {changeIndex === 0 && (
                          <>
                            <TableCell rowSpan={result.changes.length}>
                              <Checkbox
                                checked={selectedRows.has(result.rowIndexB)}
                                onCheckedChange={() => toggleRow(result.rowIndexB)}
                              />
                            </TableCell>
                            <TableCell rowSpan={result.changes.length} className="font-medium">
                              {result.rowIndexB + 1}
                            </TableCell>
                            <TableCell rowSpan={result.changes.length}>
                              {getStatusBadge(result.status)}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="font-medium">{change.column}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {change.isEmpty ? (
                            <span className="italic text-muted-foreground/60">(empty)</span>
                          ) : (
                            String(change.oldValue)
                          )}
                        </TableCell>
                        <TableCell className="text-success font-medium">
                          {String(change.newValue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No changes to preview</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
