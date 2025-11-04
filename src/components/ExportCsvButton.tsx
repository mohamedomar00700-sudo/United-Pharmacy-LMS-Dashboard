import React from 'react';
import { exportToCsv } from '../services/exportService';
import { FileSpreadsheet } from 'lucide-react';

interface ExportCsvButtonProps {
    data: any[];
    fileName: string;
}

export const ExportCsvButton = ({ data, fileName }: ExportCsvButtonProps) => {
  const handleExport = () => {
    if (data.length === 0) { 
        alert("No data available to export."); 
        return; 
    }
    exportToCsv(fileName, data);
  };
  return <button onClick={handleExport} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-offset-gray-800" aria-label="Export data to CSV" title="Export data to CSV"><FileSpreadsheet className="h-5 w-5" /></button>;
};
