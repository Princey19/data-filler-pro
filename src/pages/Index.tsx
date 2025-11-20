import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ColumnMapper } from '@/components/ColumnMapper';
import { ComparisonPreview } from '@/components/ComparisonPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileData, ColumnMapping, ComparisonOptions, MatchResult } from '@/types/file-comparison';
import { parseFile, exportFile } from '@/utils/fileParser';
import { compareFiles, applyChanges } from '@/utils/matcher';
import { toast } from '@/hooks/use-toast';
import { Download, ArrowRight, RefreshCw, FileText } from 'lucide-react';

type Step = 'upload' | 'configure' | 'preview' | 'download';

const Index = () => {
  const [step, setStep] = useState<Step>('upload');
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [parsedFileA, setParsedFileA] = useState<FileData | null>(null);
  const [parsedFileB, setParsedFileB] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [mapping, setMapping] = useState<ColumnMapping>({
    keyColumnsA: [''],
    keyColumnsB: [''],
    sourceColumns: [''],
    targetColumns: [''],
  });

  const [options, setOptions] = useState<ComparisonOptions>({
    onlyFillEmpty: true,
    ignoreCase: true,
    normalizeWhitespace: true,
  });

  const [results, setResults] = useState<MatchResult[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [updatedFileB, setUpdatedFileB] = useState<FileData | null>(null);

  const handleFileASelect = async (file: File) => {
    setFileA(file);
    setLoading(true);
    try {
      const parsed = await parseFile(file);
      setParsedFileA(parsed);
      toast({ title: 'File A loaded successfully', description: `${parsed.rows.length} rows found` });
    } catch (error) {
      toast({ title: 'Error parsing File A', description: String(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileBSelect = async (file: File) => {
    setFileB(file);
    setLoading(true);
    try {
      const parsed = await parseFile(file);
      setParsedFileB(parsed);
      toast({ title: 'File B loaded successfully', description: `${parsed.rows.length} rows found` });
    } catch (error) {
      toast({ title: 'Error parsing File B', description: String(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const proceedToConfig = () => {
    if (!parsedFileA || !parsedFileB) return;
    
    // Auto-suggest first column as key
    setMapping({
      keyColumnsA: [parsedFileA.headers[0] || ''],
      keyColumnsB: [parsedFileB.headers[0] || ''],
      sourceColumns: [parsedFileA.headers[1] || parsedFileA.headers[0] || ''],
      targetColumns: [parsedFileB.headers[1] || parsedFileB.headers[0] || ''],
    });
    
    setStep('configure');
  };

  const runComparison = () => {
    if (!parsedFileA || !parsedFileB) return;
    
    setLoading(true);
    try {
      const comparisonResults = compareFiles(parsedFileA, parsedFileB, mapping, options);
      setResults(comparisonResults);
      
      // Auto-select all rows with changes
      const rowsWithChanges = new Set(
        comparisonResults
          .filter(r => r.changes.length > 0)
          .map(r => r.rowIndexB)
      );
      setSelectedRows(rowsWithChanges);
      
      setStep('preview');
      toast({ 
        title: 'Comparison complete', 
        description: `Found ${rowsWithChanges.size} rows with potential changes` 
      });
    } catch (error) {
      toast({ title: 'Comparison error', description: String(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const applySelectedChanges = () => {
    if (!parsedFileB || !results.length) return;
    
    const updated = applyChanges(parsedFileB, results, selectedRows);
    setUpdatedFileB(updated);
    setStep('download');
    
    toast({ 
      title: 'Changes applied', 
      description: `Updated ${selectedRows.size} rows in File B` 
    });
  };

  const downloadUpdatedFile = () => {
    if (!updatedFileB || !fileB) return;
    
    const blob = exportFile(updatedFileB, fileB.name);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileB.name.replace(/(\.[^.]+)$/, '_updated$1');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: 'Download started', description: 'Your updated file is downloading' });
  };

  const reset = () => {
    setStep('upload');
    setFileA(null);
    setFileB(null);
    setParsedFileA(null);
    setParsedFileB(null);
    setResults([]);
    setSelectedRows(new Set());
    setUpdatedFileB(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">File Comparison Tool</h1>
              <p className="text-muted-foreground mt-1">
                Compare spreadsheets and intelligently fill missing values
              </p>
            </div>
            {step !== 'upload' && (
              <Button onClick={reset} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Start Over
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {(['upload', 'configure', 'preview', 'download'] as Step[]).map((s, idx) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold ${
                  step === s
                    ? 'bg-primary text-primary-foreground border-primary'
                    : idx < ['upload', 'configure', 'preview', 'download'].indexOf(step)
                    ? 'bg-success text-success-foreground border-success'
                    : 'bg-muted text-muted-foreground border-muted'
                }`}
              >
                {idx + 1}
              </div>
              {idx < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  idx < ['upload', 'configure', 'preview', 'download'].indexOf(step)
                    ? 'bg-success'
                    : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 'upload' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Files</CardTitle>
                <CardDescription>
                  Upload your source file (complete data) and target file (data to be filled)
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <FileUpload
                  label="File A (Source)"
                  description="Complete dataset with all values"
                  file={fileA}
                  onFileSelect={handleFileASelect}
                  disabled={loading}
                />
                <FileUpload
                  label="File B (Target)"
                  description="Dataset with missing values to fill"
                  file={fileB}
                  onFileSelect={handleFileBSelect}
                  disabled={loading}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={proceedToConfig}
                disabled={!parsedFileA || !parsedFileB || loading}
                size="lg"
              >
                Continue to Configuration
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'configure' && parsedFileA && parsedFileB && (
          <div className="max-w-5xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Matching Options</CardTitle>
                <CardDescription>Configure how rows should be matched</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Only fill empty cells</Label>
                    <p className="text-sm text-muted-foreground">
                      Skip cells that already have values
                    </p>
                  </div>
                  <Switch
                    checked={options.onlyFillEmpty}
                    onCheckedChange={(checked) => setOptions({ ...options, onlyFillEmpty: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ignore case</Label>
                    <p className="text-sm text-muted-foreground">
                      Treat "Artist" and "artist" as the same
                    </p>
                  </div>
                  <Switch
                    checked={options.ignoreCase}
                    onCheckedChange={(checked) => setOptions({ ...options, ignoreCase: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Normalize whitespace</Label>
                    <p className="text-sm text-muted-foreground">
                      Ignore extra spaces and line breaks
                    </p>
                  </div>
                  <Switch
                    checked={options.normalizeWhitespace}
                    onCheckedChange={(checked) => setOptions({ ...options, normalizeWhitespace: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <ColumnMapper
              fileA={parsedFileA}
              fileB={parsedFileB}
              mapping={mapping}
              onMappingChange={setMapping}
            />

            <div className="flex justify-between">
              <Button onClick={() => setStep('upload')} variant="outline">
                Back to Upload
              </Button>
              <Button onClick={runComparison} disabled={loading} size="lg">
                {loading ? 'Comparing...' : 'Run Comparison'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <ComparisonPreview
              results={results}
              selectedRows={selectedRows}
              onSelectionChange={setSelectedRows}
            />

            <div className="flex justify-between">
              <Button onClick={() => setStep('configure')} variant="outline">
                Back to Configuration
              </Button>
              <Button
                onClick={applySelectedChanges}
                disabled={selectedRows.size === 0}
                size="lg"
              >
                Apply {selectedRows.size} Changes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'download' && updatedFileB && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-success" />
                </div>
                <CardTitle>Changes Applied Successfully</CardTitle>
                <CardDescription>
                  Your updated file is ready to download
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original file:</span>
                    <span className="font-medium">{fileB?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rows updated:</span>
                    <span className="font-medium text-success">{selectedRows.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total rows:</span>
                    <span className="font-medium">{updatedFileB.rows.length}</span>
                  </div>
                </div>

                <Button onClick={downloadUpdatedFile} className="w-full" size="lg">
                  <Download className="h-5 w-5 mr-2" />
                  Download Updated File
                </Button>

                <Button onClick={reset} variant="outline" className="w-full">
                  Start New Comparison
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
