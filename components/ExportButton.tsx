import React from 'react';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportButtonProps {
  elementRef: React.RefObject<HTMLDivElement>;
  fileName: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ elementRef, fileName }) => {
  
  const handleExport = () => {
    const input = elementRef.current;
    if (!input) return;

    const root = document.documentElement;
    const isDarkMode = root.classList.contains('dark');

    // If in dark mode, temporarily switch to light mode for the export.
    // This ensures all element styles (text, backgrounds, charts) render correctly.
    if (isDarkMode) {
      root.classList.remove('dark');
    }

    // Use a short timeout to allow the browser to repaint with light-mode styles.
    setTimeout(() => {
      html2canvas(input, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        backgroundColor: null, // Let the browser's light-mode styles handle background
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${fileName.replace(/\s+/g, '_')}_export.pdf`);
      }).catch(err => {
        console.error("Failed to export PDF", err);
      }).finally(() => {
        // ALWAYS restore dark mode if it was originally enabled to avoid leaving the UI in a bad state.
        if (isDarkMode) {
          root.classList.add('dark');
        }
      });
    }, 150); // A small delay is needed for the DOM to update styles.
  };

  return (
    <button
      onClick={handleExport}
      className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-offset-gray-800"
      aria-label="Export section to PDF"
    >
      <Download className="h-5 w-5" />
    </button>
  );
};