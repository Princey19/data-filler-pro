import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { FileData } from '@/types/file-comparison';

export const parseFile = async (file: File): Promise<FileData> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv') {
    return parseCSV(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file);
  }
  
  throw new Error('Unsupported file format. Please upload CSV or XLSX files.');
};

const parseCSV = (file: File): Promise<FileData> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        resolve({
          name: file.name,
          headers,
          rows: results.data as Record<string, any>[],
          format: 'csv',
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
};

const parseExcel = async (file: File): Promise<FileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        const headers = jsonData.length > 0 ? Object.keys(jsonData[0] as object) : [];
        
        resolve({
          name: file.name,
          headers,
          rows: jsonData as Record<string, any>[],
          format: 'xlsx',
        });
      } catch (error) {
        reject(new Error(`Excel parsing error: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export const exportFile = (data: FileData, originalFileName: string): Blob => {
  if (data.format === 'csv') {
    return exportCSV(data);
  } else {
    return exportExcel(data, originalFileName);
  }
};

const exportCSV = (data: FileData): Blob => {
  const csv = Papa.unparse({
    fields: data.headers,
    data: data.rows,
  });
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
};

const exportExcel = (data: FileData, originalFileName: string): Blob => {
  const worksheet = XLSX.utils.json_to_sheet(data.rows, { header: data.headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
