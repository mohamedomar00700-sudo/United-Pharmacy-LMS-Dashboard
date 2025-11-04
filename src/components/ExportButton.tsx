import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';

interface ExportButtonProps {
    elementRef: React.RefObject<HTMLDivElement>;
    fileName: string;
}

export const ExportButton = ({ elementRef, fileName }: ExportButtonProps) => {
  const handleExport = () => {
    const input = elementRef.current;
    if (!input) return;
    const root = document.documentElement;
    const isDarkMode = root.classList.contains('dark');
    if (isDarkMode) root.classList.remove('dark');
    setTimeout(() => {
      html2canvas(input, { scale: 2, useCORS: true, backgroundColor: null }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${fileName.replace(/\s+/g, '_')}_export.pdf`);
      }).catch(err => console.error("Failed to export PDF", err))
        .finally(() => { if (isDarkMode) root.classList.add('dark'); });
    }, 150);
  };
  return <button onClick={handleExport} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-offset-gray-800" aria-label="Export section to PDF"><Download className="h-5 w-5" /></button>;
};
