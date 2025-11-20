import { useCallback } from 'react';
import { Upload, File as FileIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  label: string;
  description: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const FileUpload = ({ label, description, file, onFileSelect, disabled }: FileUploadProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        onFileSelect(droppedFile);
      }
    },
    [onFileSelect, disabled]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <Card
      className={cn(
        "relative border-2 border-dashed transition-all hover:border-primary",
        disabled && "opacity-50 cursor-not-allowed hover:border-border",
        file && "border-success bg-success/5"
      )}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <label className={cn("block p-8 cursor-pointer", disabled && "cursor-not-allowed")}>
        <input
          type="file"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
          disabled={disabled}
        />
        <div className="flex flex-col items-center text-center space-y-4">
          {file ? (
            <>
              <div className="rounded-full bg-success p-3">
                <FileIcon className="h-8 w-8 text-success-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-full bg-muted p-3">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Drag & drop or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported: CSV, XLSX
                </p>
              </div>
            </>
          )}
        </div>
      </label>
    </Card>
  );
};
