import { FileData, ColumnMapping } from '@/types/file-comparison';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface ColumnMapperProps {
  fileA: FileData;
  fileB: FileData;
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
}

export const ColumnMapper = ({ fileA, fileB, mapping, onMappingChange }: ColumnMapperProps) => {
  const addKeyColumn = () => {
    onMappingChange({
      ...mapping,
      keyColumnsA: [...mapping.keyColumnsA, fileA.headers[0] || ''],
      keyColumnsB: [...mapping.keyColumnsB, fileB.headers[0] || ''],
    });
  };

  const removeKeyColumn = (index: number) => {
    onMappingChange({
      ...mapping,
      keyColumnsA: mapping.keyColumnsA.filter((_, i) => i !== index),
      keyColumnsB: mapping.keyColumnsB.filter((_, i) => i !== index),
    });
  };

  const updateKeyColumn = (index: number, file: 'A' | 'B', value: string) => {
    const key = file === 'A' ? 'keyColumnsA' : 'keyColumnsB';
    const updated = [...mapping[key]];
    updated[index] = value;
    onMappingChange({ ...mapping, [key]: updated });
  };

  const addValueColumn = () => {
    onMappingChange({
      ...mapping,
      sourceColumns: [...mapping.sourceColumns, fileA.headers[0] || ''],
      targetColumns: [...mapping.targetColumns, fileB.headers[0] || ''],
    });
  };

  const removeValueColumn = (index: number) => {
    onMappingChange({
      ...mapping,
      sourceColumns: mapping.sourceColumns.filter((_, i) => i !== index),
      targetColumns: mapping.targetColumns.filter((_, i) => i !== index),
    });
  };

  const updateValueColumn = (index: number, file: 'A' | 'B', value: string) => {
    const key = file === 'A' ? 'sourceColumns' : 'targetColumns';
    const updated = [...mapping[key]];
    updated[index] = value;
    onMappingChange({ ...mapping, [key]: updated });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Matching Keys</CardTitle>
          <CardDescription>
            Select columns to use for matching rows between files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mapping.keyColumnsA.map((_, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">
                  File A (Source) <Badge variant="secondary" className="ml-2">Key {index + 1}</Badge>
                </label>
                <Select
                  value={mapping.keyColumnsA[index]}
                  onValueChange={(value) => updateKeyColumn(index, 'A', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileA.headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">
                  File B (Target) <Badge variant="secondary" className="ml-2">Key {index + 1}</Badge>
                </label>
                <Select
                  value={mapping.keyColumnsB[index]}
                  onValueChange={(value) => updateKeyColumn(index, 'B', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileB.headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {mapping.keyColumnsA.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeKeyColumn(index)}
                  className="mt-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button onClick={addKeyColumn} variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Key Column
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Value Columns to Fill</CardTitle>
          <CardDescription>
            Select which columns to copy from File A to File B
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mapping.sourceColumns.map((_, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">
                  Source (File A) <Badge className="ml-2">Value {index + 1}</Badge>
                </label>
                <Select
                  value={mapping.sourceColumns[index]}
                  onValueChange={(value) => updateValueColumn(index, 'A', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source column" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileA.headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">
                  Target (File B) <Badge className="ml-2">Value {index + 1}</Badge>
                </label>
                <Select
                  value={mapping.targetColumns[index]}
                  onValueChange={(value) => updateValueColumn(index, 'B', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target column" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileB.headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {mapping.sourceColumns.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeValueColumn(index)}
                  className="mt-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button onClick={addValueColumn} variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Value Column
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
