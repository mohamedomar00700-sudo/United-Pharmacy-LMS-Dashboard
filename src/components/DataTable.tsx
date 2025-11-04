import React from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowDown, ArrowUp } from 'lucide-react';
import { useDataTable } from '../hooks/useDataTable';

interface Column<T> {
    key: keyof T;
    label: string;
    render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    hook: ReturnType<typeof useDataTable<T>>;
    rowClassName?: (item: T) => string;
}

export const DataTable = <T extends Record<string, any>>({ columns, hook, rowClassName }: DataTableProps<T>) => {
  const { paginatedItems, requestSort, handleSearchChange, sortConfig, searchTerm, currentPage, pageCount, nextPage, prevPage, totalItems } = hook;
  
  const getSortIcon = (key: keyof T) => {
    if (sortConfig.key !== key) return <span className="opacity-20 group-hover:opacity-100 transition-opacity"><ArrowDown className="inline-block ml-1 h-4 w-4" /></span>;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="inline-block ml-1 h-4 w-4" /> : <ArrowDown className="inline-block ml-1 h-4 w-4" />;
  };

  return (
    <div className="w-full">
        <div className="mb-4">
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Search className="h-5 w-5 text-gray-400" /></span>
                <input type="text" placeholder="Search table..." value={searchTerm} onChange={handleSearchChange} className="w-full max-w-xs p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
            </div>
        </div>
        <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                <thead className="text-xs text-gray-800 dark:text-gray-200 uppercase bg-gray-100 dark:bg-gray-700">
                    <tr>
                        {columns.map(col => (
                            <th key={String(col.key)} scope="col" className="px-4 py-3 group">
                                <button className="flex items-center w-full" onClick={() => requestSort(col.key)}>
                                    {col.label}{getSortIcon(col.key)}
                                </button>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {paginatedItems.length > 0 ? paginatedItems.map((item, index) => (
                        <tr key={index} className={`bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/50 ${rowClassName ? rowClassName(item) : ''}`}>
                            {columns.map(col => (
                                <td key={String(col.key)} className="px-4 py-3 align-top">
                                    {col.render ? col.render(item) : String(item[col.key])}
                                </td>
                            ))}
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={columns.length} className="text-center p-4 text-gray-500 dark:text-gray-400">
                                {searchTerm ? 'No results found.' : 'No data available.'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        {pageCount > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Showing {Math.min(1 + (currentPage - 1) * 10, totalItems)}-{Math.min(currentPage * 10, totalItems)} of {totalItems}</span>
                {pageCount > 1 && (
                    <div className="inline-flex items-center -space-x-px">
                        <button onClick={prevPage} disabled={currentPage === 1} className="px-3 py-2 leading-tight text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-l-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-t border-b border-gray-300 dark:border-gray-600">
                            {currentPage} / {pageCount}
                        </span>
                        <button onClick={nextPage} disabled={currentPage === pageCount} className="px-3 py-2 leading-tight text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-r-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};
