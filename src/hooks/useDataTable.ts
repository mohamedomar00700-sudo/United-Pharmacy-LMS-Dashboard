import { useState, useMemo, useEffect } from 'react';
// FIX: Import React to resolve namespace error for React.ChangeEvent
import React from 'react';

type SortDirection = 'ascending' | 'descending';

interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export const useDataTable = <T extends Record<string, any>>(items: T[], initialSortKey: keyof T | null = null, rowsPerPage: number = 10) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: initialSortKey,
    direction: 'descending',
  });
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return items.filter(item => {
      const rowString = Object.values(item).join(' ').toLowerCase();
      return rowString.includes(lowercasedSearchTerm);
    });
  }, [items, searchTerm]);

  const sortedItems = useMemo(() => {
    let sortableItems = [...filteredItems];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredItems, sortConfig]);
  
  const pageCount = Math.ceil(sortedItems.length / rowsPerPage) || 1;
  const actualCurrentPage = Math.min(currentPage, pageCount);

  useEffect(() => {
    if (currentPage !== actualCurrentPage) setCurrentPage(actualCurrentPage);
  }, [currentPage, actualCurrentPage]);
  
  const paginatedItems = useMemo(() => {
      const startIndex = (actualCurrentPage - 1) * rowsPerPage;
      return sortedItems.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedItems, actualCurrentPage, rowsPerPage]);

  const requestSort = (key: keyof T) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
      setCurrentPage(1);
  };
  
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, pageCount));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const setPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, pageCount)));

  return { paginatedItems, requestSort, handleSearchChange, sortConfig, searchTerm, currentPage: actualCurrentPage, pageCount, nextPage, prevPage, setPage, totalItems: filteredItems.length, sortedItems };
};