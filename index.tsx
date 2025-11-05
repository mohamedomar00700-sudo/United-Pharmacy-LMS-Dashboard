// ========= EXTERNAL IMPORTS =========
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend, ScatterChart, Scatter, ZAxis, ReferenceLine, Label, Brush } from 'recharts';
import { BookOpen, BarChart2, TrendingUp, Users, Target, GitCompareArrows, Trophy, ShieldAlert, Download, FileSpreadsheet, Sun, Moon, Search, ChevronLeft, ChevronRight, ArrowDown, ArrowUp, X, RotateCcw, SlidersHorizontal, ChevronUp, ChevronDown, CheckCircle, UserX, Star, ChevronsRight, User as UserIcon, FileText as FileTextIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ========= FROM types.ts =========
enum CourseType {
  Mandatory = 'Mandatory',
  Optional = 'Optional',
}

interface TrainingRecord {
  id: number;
  traineeName: string;
  email: string;
  branch: string;
  districtHead: string;
  supervisor: string;
  courseTitle: string;
  completionRate: number;
  preAssessmentScore: number;
  postAssessmentScore: number;
  averageQuizScore: number;
  courseType: CourseType;
  completionDate: Date;
  trainingHours: number;
}


// ========= FROM hooks/useTheme.ts =========
const useTheme = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(storedTheme || preferredTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, toggleTheme };
};

// ========= FROM services/googleSheetService.ts =========
const parseCSV = (text) => {
  const lines = text.trim().replace(/\r/g, '').split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, header, i) => {
      obj[header] = (values[i] || '').trim();
      return obj;
    }, {});
  });
};

const mapRowToTrainingRecord = (row, index) => {
    const safeParseFloat = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    };
    
    const record = {
        id: index + 1,
        traineeName: row['Trainee Name'] || '',
        email: row['Email'] || '',
        branch: row['Branch'] || '',
        districtHead: row['District Head'] || '',
        supervisor: row['Supervisor'] || '',
        courseTitle: row['Course Title'] || '',
        completionRate: safeParseFloat(row['Completion Rate (%)']),
        preAssessmentScore: safeParseFloat(row['Pre-Assessment Score']),
        postAssessmentScore: safeParseFloat(row['Post-Assessment Score']),
        averageQuizScore: safeParseFloat(row['Average Quiz Score']),
        courseType: row['Course Type'] === 'Mandatory' ? CourseType.Mandatory : CourseType.Optional,
        completionDate: new Date(row['Completion Date']),
        trainingHours: safeParseFloat(row['Training Hours']),
    };

    if (isNaN(record.completionDate.getTime())) {
        console.warn('Invalid date found for row:', row);
        record.completionDate = new Date(); // Fallback to current date
    }
    
    return record;
};

const fetchTrainingData = async (sheetUrl) => {
    const response = await fetch(sheetUrl);
    if (!response.ok) {
        throw new Error(`Network response was not ok. Status: ${response.status}`);
    }
    const csvText = await response.text();
    const parsedData = parseCSV(csvText);
    return parsedData.map(mapRowToTrainingRecord);
};

// ========= FROM services/exportService.ts =========
const exportToCsv = (filename, rows) => {
    if (!rows || !rows.length) {
        return;
    }
    const separator = ',';
    const headers = Object.keys(rows[0]);
    
    const csvContent = [
        headers.join(separator),
        ...rows.map(row => {
            return headers.map(k => {
                let cell = row[k] === null || row[k] === undefined ? '' : row[k];
                
                if (cell instanceof Date) {
                    return cell.toLocaleDateString();
                }

                let cellString = String(cell);

                if (cellString.search(/("|,|\n)/g) >= 0) {
                    cellString = `"${cellString.replace(/"/g, '""')}"`;
                }
                return cellString;
            }).join(separator);
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// ========= FROM hooks/useDataTable.ts =========
const useDataTable = (items, initialSortKey = null, rowsPerPage = 10) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
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
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
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

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };
  
  const handleSearchChange = (event) => {
      setSearchTerm(event.target.value);
      setCurrentPage(1);
  };
  
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, pageCount));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const setPage = (page) => setCurrentPage(Math.max(1, Math.min(page, pageCount)));

  return { paginatedItems, requestSort, handleSearchChange, sortConfig, searchTerm, currentPage: actualCurrentPage, pageCount, nextPage, prevPage, setPage, totalItems: filteredItems.length, sortedItems };
};


// ========= COMPONENT DEFINITIONS =========

const CustomSparklineTooltip = ({ active = false, payload = [] }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const date = data.date ? new Date(data.date).toLocaleDateString('en-CA') : 'N/A';
        let metricName = payload[0].name || "Value";
        
        if (metricName === 'Total Learners') {
            metricName = 'Total Learners (to date)';
        } else if (metricName === 'Average Completion Rate') {
            metricName = 'Avg Completion (to date)';
        } else if (metricName === '% Improvement') {
            metricName = '% Improvement (to date)';
        }

        const isPercentage = metricName.toLowerCase().includes('rate') || metricName.toLowerCase().includes('improvement') || metricName.toLowerCase().includes('completion');
        const formattedValue = isPercentage 
            ? `${Number(data.value).toFixed(1)}%`
            : Math.round(data.value);

        return (
            <div className="bg-white dark:bg-gray-900 p-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg text-xs" style={{ pointerEvents: 'none' }}>
                <p className="font-bold text-gray-800 dark:text-gray-200">{date}</p>
                <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-semibold" style={{ color: payload[0].stroke }}>{metricName}: </span>
                    <strong>{formattedValue}</strong>
                </p>
            </div>
        );
    }
    return null;
};

const DashboardCard = ({ title, children = null, className = "", actions = null }) => {
    return (
        <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-all hover:shadow-lg dark:border dark:border-gray-700 ${className}`}>
            <div className="flex justify-between items-center mb-4 border-b dark:border-gray-600 pb-2">
                <h3 className="text-lg font-bold text-brand-dark dark:text-white">{title}</h3>
                {actions && <div className="flex items-center space-x-2">{actions}</div>}
            </div>
            <div className="h-full">{children}</div>
        </div>
    );
};

const KpiCard = ({ title, value, icon, change, changeColor, tooltip, sparklineData, onClick = null }) => {
    const cardContent = (
         <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md flex items-center space-x-4 transition-all hover:shadow-lg hover:scale-105 dark:border dark:border-gray-700 w-full h-full" title={tooltip}>
            <div className="flex-shrink-0 bg-brand-light dark:bg-gray-700 p-3 rounded-full">{icon}</div>
            <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-brand-dark dark:text-white">{value}</p>
                 {change && (<p className={`text-sm font-semibold ${changeColor}`}>{change}</p>)}
            </div>
             {sparklineData && sparklineData.length > 1 && (
                <div className="w-24 h-12">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                            <Tooltip 
                                content={<CustomSparklineTooltip />} 
                                cursor={{ stroke: 'gray', strokeDasharray: '3 3' }}
                                position={{ y: -40 }}
                                offset={10}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                name={title}
                                stroke={changeColor === 'text-success' ? '#00A99D' : changeColor === 'text-danger' ? '#dc3545' : '#8884d8'} 
                                strokeWidth={2} 
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
    if (onClick) return <button onClick={onClick} className="w-full text-left">{cardContent}</button>;
    return cardContent;
};

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-offset-gray-800" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
};

const ExportButton = ({ elementRef, fileName }) => {
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

const ExportCsvButton = ({ data, fileName }) => {
  const handleExport = () => {
    if (data.length === 0) { alert("No data available to export."); return; }
    exportToCsv(fileName, data);
  };
  return <button onClick={handleExport} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-offset-gray-800" aria-label="Export data to CSV" title="Export data to CSV"><FileSpreadsheet className="h-5 w-5" /></button>;
};

const MultiSelectFilter = ({ label, options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);
    const searchInputRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    useEffect(() => {
        if (isOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
        else setSearchTerm('');
    }, [isOpen]);
    const handleSelect = (option) => onChange(selected.includes(option) ? selected.filter(item => item !== option) : [...selected, option]);
    const filteredOptions = useMemo(() => options.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase())), [options, searchTerm]);
    const handleSelectAll = () => onChange(selected.length === options.length ? [] : options);
    const getButtonLabel = () => {
        if (selected.length === 0 || selected.length === options.length) return `All ${label}s`;
        if (selected.length === 1) return selected[0];
        return `${selected.length} ${label}s Selected`;
    };
    return (
        <div className="flex flex-col relative" ref={wrapperRef}>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{label}</label>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-sm bg-white dark:bg-gray-700 text-left flex justify-between items-center text-gray-800 dark:text-gray-200">
                <span className="truncate">{getButtonLabel()}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-20 flex flex-col">
                     <div className="p-2 border-b dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input ref={searchInputRef} type="text" placeholder={`Search ${label}s...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700" />
                        </div>
                    </div>
                    <ul className="text-gray-800 dark:text-gray-200 overflow-y-auto max-h-52">
                        <li className="p-2 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"><label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={selected.length === options.length} onChange={handleSelectAll} className="rounded text-brand-primary focus:ring-brand-primary" /><span className="font-semibold">Select All</span></label></li>
                        {filteredOptions.length > 0 ? filteredOptions.map(option => (
                            <li key={option} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700"><label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={selected.includes(option)} onChange={() => handleSelect(option)} className="rounded text-brand-primary focus:ring-brand-primary" /><span>{option}</span></label></li>
                        )) : <li className="p-2 text-center text-sm text-gray-500">No options found.</li>}
                    </ul>
                </div>
            )}
        </div>
    );
};

const DataTable = ({ columns, rowClassName = null, hook }) => {
  const { paginatedItems, requestSort, handleSearchChange, sortConfig, searchTerm, currentPage, pageCount, nextPage, prevPage, totalItems } = hook;
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <span className="opacity-20 group-hover:opacity-100 transition-opacity"><ArrowDown className="inline-block ml-1 h-4 w-4" /></span>;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="inline-block ml-1 h-4 w-4" /> : <ArrowDown className="inline-block ml-1 h-4 w-4" />;
  };
  return (
    <div className="w-full">
        <div className="mb-4"><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><Search className="h-5 w-5 text-gray-400" /></span><input type="text" placeholder="Search table..." value={searchTerm} onChange={handleSearchChange} className="w-full max-w-xs p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" /></div></div>
        <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                <thead className="text-xs text-gray-800 dark:text-gray-200 uppercase bg-gray-100 dark:bg-gray-700"><tr>{columns.map(col => <th key={String(col.key)} scope="col" className="px-4 py-3 group"><button className="flex items-center w-full" onClick={() => requestSort(col.key)}>{col.label}{getSortIcon(col.key)}</button></th>)}</tr></thead>
                <tbody>
                    {paginatedItems.length > 0 ? paginatedItems.map((item, index) => (
                        <tr key={index} className={`bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/50 ${rowClassName ? rowClassName(item) : ''}`}>{columns.map(col => <td key={String(col.key)} className="px-4 py-3 align-top">{col.render ? col.render(item) : String(item[col.key])}</td>)}</tr>
                    )) : <tr><td colSpan={columns.length} className="text-center p-4 text-gray-500 dark:text-gray-400">{searchTerm ? 'No results found.' : 'No data available.'}</td></tr>}
                </tbody>
            </table>
        </div>
        {pageCount > 0 && <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-400"><span>Showing {Math.min(1 + (currentPage - 1) * 10, totalItems)}-{Math.min(currentPage * 10, totalItems)} of {totalItems}</span>{pageCount > 1 && <div className="inline-flex items-center -space-x-px"><button onClick={prevPage} disabled={currentPage === 1} className="px-3 py-2 leading-tight text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-l-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button><span className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-t border-b border-gray-300 dark:border-gray-600">{currentPage} / {pageCount}</span><button onClick={nextPage} disabled={currentPage === pageCount} className="px-3 py-2 leading-tight text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-r-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button></div>}</div>}
    </div>
  );
};

const Overview = ({ data, allData, onNavigate }) => {
    const companyAvgs = useMemo(() => {
        if (allData.length === 0) return { avgCompletion: 0 };
        const avgCompletion = allData.reduce((acc, curr) => acc + curr.completionRate, 0) / allData.length;
        return { avgCompletion };
    }, [allData]);

    const stats = useMemo(() => {
        if (data.length === 0) return { totalLearners: 0, avgCompletion: 0, activeLearners: 0, inactiveLearners: 0, improvement: 0, avgCompletionChange: { text: 'N/A', color: 'text-gray-500 dark:text-gray-400' }, sparklines: { learners: [], completion: [], improvement: [] } };
        
        const totalLearners = new Set(data.map(d => d.traineeName)).size;
        const avgCompletion = data.reduce((acc, curr) => acc + curr.completionRate, 0) / data.length;
        const activeLearners = new Set(data.filter(d => d.completionRate > 0).map(d => d.traineeName)).size;
        const inactiveLearners = totalLearners - activeLearners;
        const completedTrainings = data.filter(d => d.postAssessmentScore > 0);
        const preScores = completedTrainings.reduce((acc, curr) => acc + curr.preAssessmentScore, 0);
        const postScores = completedTrainings.reduce((acc, curr) => acc + curr.postAssessmentScore, 0);
        const improvement = preScores > 0 ? ((postScores - preScores) / preScores) * 100 : 0;
        const diff = avgCompletion - companyAvgs.avgCompletion;
        const changeText = diff.toFixed(1) === '0.0' ? 'Matches company avg' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}% vs company avg`;
        const changeColor = diff > 0.1 ? 'text-success' : diff < -0.1 ? 'text-danger' : 'text-gray-500 dark:text-gray-400';

        const calculateSparklineData = (records, metric) => {
            if (records.length < 2) return [];
            const sortedRecords = [...records].sort((a, b) => a.completionDate.getTime() - b.completionDate.getTime());

            if (metric === 'learners') {
                const dailyUniqueLearners = new Map();
                const seenLearners = new Set();
                sortedRecords.forEach(rec => {
                    seenLearners.add(rec.traineeName);
                    const dateKey = rec.completionDate.toISOString().split('T')[0];
                    dailyUniqueLearners.set(dateKey, { date: new Date(dateKey), value: seenLearners.size });
                });
                return Array.from(dailyUniqueLearners.values());
            }

            if (metric === 'completion' || metric === 'improvement') {
                const dailyAggregates = new Map();
                sortedRecords.forEach(rec => {
                    const dateKey = rec.completionDate.toISOString().split('T')[0];
                    if (!dailyAggregates.has(dateKey)) {
                        dailyAggregates.set(dateKey, { completionSum: 0, improvementSum: 0, recordCount: 0 });
                    }
                    const dayData = dailyAggregates.get(dateKey);
                    dayData.recordCount++;
                    dayData.completionSum += rec.completionRate;
                    dayData.improvementSum += rec.preAssessmentScore > 0 ? ((rec.postAssessmentScore - rec.preAssessmentScore) / rec.preAssessmentScore) * 100 : 0;
                });

                const sortedDays = Array.from(dailyAggregates.entries())
                    .map(([dateKey, dayData]) => ({ date: new Date(dateKey), ...dayData }))
                    .sort((a, b) => a.date.getTime() - b.date.getTime());

                let cumulativeSum = 0;
                let cumulativeCount = 0;

                return sortedDays.map(day => {
                    if (metric === 'completion') {
                        cumulativeSum += day.completionSum;
                    } else { // improvement
                        cumulativeSum += day.improvementSum;
                    }
                    cumulativeCount += day.recordCount;
                    
                    return { date: day.date, value: cumulativeSum / cumulativeCount };
                });
            }
            return [];
        };

        const sparklines = {
            learners: calculateSparklineData(data, 'learners'),
            completion: calculateSparklineData(data, 'completion'),
            improvement: calculateSparklineData(data, 'improvement')
        };
        
        return { totalLearners, avgCompletion: Math.round(avgCompletion), activeLearners, inactiveLearners, improvement: Math.round(improvement), avgCompletionChange: { text: changeText, color: changeColor }, sparklines };
    }, [data, companyAvgs]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard title="Total Learners" value={stats.totalLearners} icon={<Users className="text-brand-primary" />} tooltip="Total unique trainees. Click to view leaderboards." onClick={() => onNavigate('leaderboard')} sparklineData={stats.sparklines.learners} change={null} changeColor="" />
            <KpiCard title="Average Completion Rate" value={`${stats.avgCompletion}%`} icon={<CheckCircle className="text-success" />} change={stats.avgCompletionChange.text} changeColor={stats.avgCompletionChange.color} tooltip="The average completion rate for all training records." sparklineData={stats.sparklines.completion} onClick={null}/>
            <KpiCard title="Active vs Inactive Learners" value={`${stats.activeLearners} / ${stats.inactiveLearners}`} icon={<UserX className="text-warning" />} tooltip="Active learners have a completion rate > 0%. Click to view at-risk trainees." onClick={() => onNavigate('actionable-insights')} change={null} changeColor="" sparklineData={null} />
            <KpiCard title="% Improvement" value={`${stats.improvement}%`} icon={<TrendingUp className="text-brand-secondary" />} change={`Pre vs Post Assessment`} changeColor='text-success' tooltip="The average percentage improvement between pre and post-assessment scores." sparklineData={stats.sparklines.improvement} onClick={null}/>
        </div>
    );
};

const BranchComparison = ({ data, allData, filters, setFilters }) => {
    const { theme } = useTheme();
    const [viewType, setViewType] = useState('all');
    const [sortBy, setSortBy] = useState('completionRate');
    const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
    const gridColor = theme === 'dark' ? '#374151' : '#E5E7EB';
    const CustomTooltip = ({ active = false, payload = [], label = '', companyAvgs }) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-white dark:bg-gray-800 p-3 border dark:border-gray-600 rounded-lg shadow-xl text-sm transition-all">
            <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">{label}</p><p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{data.recordCount} training records</p>
            <p className="text-brand-primary font-semibold">{`Completion Rate: ${Number(data.completionRate).toFixed(1)}%`}</p><p className="text-brand-secondary font-semibold">{`Avg. Quiz Score: ${Number(data.quizScore).toFixed(1)}%`}</p>
            <div className="border-t dark:border-gray-700 mt-2 pt-2 text-xs"><p className="text-gray-600 dark:text-gray-300">Company Avg Completion: {Number(companyAvgs.completion).toFixed(1)}%</p><p className="text-gray-600 dark:text-gray-300">Company Avg Score: {Number(companyAvgs.score).toFixed(1)}%</p></div>
          </div>
        );
      } return null;
    };
    const companyAvgs = useMemo(() => {
        if (allData.length === 0) return { completion: 0, score: 0 };
        const completion = allData.reduce((acc, curr) => acc + curr.completionRate, 0) / allData.length;
        const score = allData.reduce((acc, curr) => acc + curr.averageQuizScore, 0) / allData.length;
        return { completion, score };
    }, [allData]);
    const branchData = useMemo(() => {
        const branchMap = new Map();
        data.forEach(item => {
            if (!item.branch) return;
            if (!branchMap.has(item.branch)) branchMap.set(item.branch, { completionTotal: 0, scoreTotal: 0, recordCount: 0 });
            const stats = branchMap.get(item.branch);
            stats.completionTotal += item.completionRate;
            stats.scoreTotal += item.averageQuizScore;
            stats.recordCount++;
        });
        const aggregatedData = Array.from(branchMap.entries()).map(([branch, stats]) => ({ name: branch, displayName: branch.replace(/ Pharmacy| Pharma| Health| Meds| Drugs/g, ''), completionRate: stats.recordCount > 0 ? stats.completionTotal / stats.recordCount : 0, quizScore: stats.recordCount > 0 ? stats.scoreTotal / stats.recordCount : 0, recordCount: stats.recordCount }));
        const sortedData = aggregatedData.sort((a, b) => b[sortBy] - a[sortBy]);
        if(viewType === 'top5') return sortedData.slice(0, 5);
        if(viewType === 'bottom5') return sortedData.slice(-5);
        return sortedData;
    }, [data, viewType, sortBy]);
    const chartKey = useMemo(() => `${viewType}-${sortBy}-${JSON.stringify(filters)}-${branchData.map(d => `${d.name}:${d.completionRate.toFixed(0)}`).join(',')}`, [branchData, viewType, sortBy, filters]);
    const handleBarClick = (payload) => {
        if (!payload || !payload.name) return;
        const clickedBranch = payload.name;
        const isAlreadyFiltered = filters.branchFilter.length === 1 && filters.branchFilter[0] === clickedBranch;
        setFilters(prev => ({ ...prev, branchFilter: isAlreadyFiltered ? [] : [clickedBranch] }));
    };
    if (data.length === 0) return <DashboardCard title="Branch-wise Performance Comparison"><div className="flex items-center justify-center h-full min-h-[400px] text-gray-500 dark:text-gray-400">No data available for the selected filters.</div></DashboardCard>;
    const viewOptions = [{id: 'all', label: 'All'}, {id: 'top5', label: 'Top 5'}, {id: 'bottom5', label: 'Bottom 5'}];
    const sortOptions = [{id: 'completionRate', label: 'Completion'}, {id: 'quizScore', label: 'Score'}];
    return (
        <DashboardCard title="Branch-wise Performance Comparison" actions={
            <div className="flex flex-wrap justify-end items-center gap-x-4 gap-y-2">
                 <div className="flex items-center space-x-2"><span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sort by:</span>{sortOptions.map(opt => <button key={opt.id} onClick={() => setSortBy(opt.id)} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${sortBy === opt.id ? 'bg-brand-primary text-white shadow' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>{opt.label}</button>)}</div>
                 <div className="flex items-center space-x-2"><span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Show:</span>{viewOptions.map(opt => <button key={opt.id} onClick={() => setViewType(opt.id)} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${viewType === opt.id ? 'bg-brand-primary text-white shadow' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>{opt.label}</button>)}</div>
            </div>}>
            <div style={{ width: '100%', height: 500 }}>
                <ResponsiveContainer key={chartKey} width="100%" height="100%">
                    <BarChart data={branchData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor}/>
                        <XAxis dataKey="displayName" angle={-45} textAnchor="end" height={60} interval={0} tick={{ fill: tickColor, fontSize: 12 }} />
                        <YAxis domain={[0, 100]} label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', fill: tickColor, dy: 40 }} tick={{ fill: tickColor }} unit="%" />
                        <Tooltip content={<CustomTooltip companyAvgs={companyAvgs} />} cursor={{ fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(204, 204, 204, 0.2)' }} />
                        <Legend wrapperStyle={{paddingTop: '20px'}}/>
                        <Bar dataKey="completionRate" name="Completion Rate" fill="#0072BC" onClick={handleBarClick} maxBarSize={30}>{branchData.map((entry, index) => <Cell key={`cell-cr-${index}`} cursor="pointer" opacity={!filters.branchFilter.length || filters.branchFilter.includes(entry.name) ? 1 : 0.3} />)}</Bar>
                         <Bar dataKey="quizScore" name="Avg. Quiz Score" fill="#F58220" onClick={handleBarClick} maxBarSize={30}>{branchData.map((entry, index) => <Cell key={`cell-qs-${index}`} cursor="pointer" opacity={!filters.branchFilter.length || filters.branchFilter.includes(entry.name) ? 1 : 0.3} />)}</Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </DashboardCard>
    );
};

const CourseAnalysis = ({ data, filters, setFilters }) => {
    const { theme } = useTheme();
    const [lowPerfSortBy, setLowPerfSortBy] = useState('completion');
    const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
    const gridColor = theme === 'dark' ? '#4A5568' : '#ccc';
    const getStatusColor = (value, thresholds = { low: 70, mid: 85 }) => {
        if (value < thresholds.low) return '#dc3545'; if (value < thresholds.mid) return '#F58220'; return '#00A99D';
    };
    const courseData = useMemo(() => {
        const courses = [...new Set(data.map(item => item.courseTitle))];
        return courses.map(course => {
            const courseRecords = data.filter(item => item.courseTitle === course);
            if(courseRecords.length === 0) return null;
            const totalLearners = new Set(courseRecords.map(r => r.traineeName)).size;
            const avgCompletionRate = courseRecords.reduce((acc, curr) => acc + curr.completionRate, 0) / courseRecords.length;
            const avgQuizScore = courseRecords.reduce((acc, curr) => acc + curr.averageQuizScore, 0) / courseRecords.length;
            return { name: course, completion: avgCompletionRate, score: avgQuizScore, learners: totalLearners };
        }).filter(Boolean);
    }, [data]);
    const courseTypeData = useMemo(() => {
        const mandatoryCount = new Set(data.filter(d => d.courseType === CourseType.Mandatory).map(d => d.id)).size;
        const optionalCount = new Set(data.filter(d => d.courseType === CourseType.Optional).map(d => d.id)).size;
        return [ { name: CourseType.Mandatory, 'Training Records': mandatoryCount }, { name: CourseType.Optional, 'Training Records': optionalCount } ];
    }, [data]);
    const handleCourseTypeClick = (payload) => {
        const clickedType = payload.name; if(!clickedType) return;
        const isAlreadyFiltered = filters.courseTypeFilter.length === 1 && filters.courseTypeFilter[0] === clickedType;
        setFilters(prev => ({...prev, courseTypeFilter: isAlreadyFiltered ? [] : [clickedType]}));
    };
    const handleCourseClick = (payload) => {
        const clickedCourse = payload.name; if(!clickedCourse) return;
        const isAlreadyFiltered = filters.courseFilter.length === 1 && filters.courseFilter[0] === clickedCourse;
        setFilters(prev => ({ ...prev, courseFilter: isAlreadyFiltered ? [] : [clickedCourse] }));
    };
    const topCourses = [...courseData].sort((a, b) => b.completion - a.completion).slice(0, 5);
    const lowPerformingCourses = [...courseData].sort((a, b) => a[lowPerfSortBy] - b[lowPerfSortBy]).slice(0, 5);
    const avgScoresPerCourse = [...courseData].sort((a, b) => b.score - a.score);
    if (data.length === 0) return <DashboardCard title="Course Analysis"><div className="flex items-center justify-center h-full min-h-[400px] text-gray-500 dark:text-gray-400">No data available for the selected filters.</div></DashboardCard>;
    const PIE_COLORS = ['#0072BC', '#F58220'];
    const lowPerfSortOptions = [{id: 'completion', label: 'Completion'}, {id: 'score', label: 'Score'}, {id: 'learners', label: 'Learners'}];
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <DashboardCard title="Course Type Distribution" className="xl:col-span-1"><div style={{ width: '100%', height: 300 }}><ResponsiveContainer><BarChart data={courseTypeData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={gridColor}/><XAxis type="number" tick={{ fill: tickColor }}/><YAxis type="category" dataKey="name" tick={{ fill: tickColor }} /><Tooltip formatter={(value) => [value, 'Records']} /><Bar dataKey="Training Records" onClick={handleCourseTypeClick} maxBarSize={40}>{courseTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} cursor="pointer" opacity={!filters.courseTypeFilter.length || filters.courseTypeFilter.includes(entry.name) ? 1 : 0.4} />)}</Bar></BarChart></ResponsiveContainer></div></DashboardCard>
            <DashboardCard title="Top 5 Courses by Completion" className="xl:col-span-1"><div style={{ width: '100%', height: 300 }}><ResponsiveContainer><BarChart data={topCourses} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={gridColor}/><XAxis type="number" domain={[0, 100]} unit="%" tick={{ fill: tickColor }}/><YAxis type="category" dataKey="name" tick={{ fill: tickColor }} /><Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} /><Bar dataKey="completion" name="Completion Rate" onClick={handleCourseClick} maxBarSize={30}>{topCourses.map((entry, index) => <Cell key={`cell-${index}`} fill={getStatusColor(entry.completion)} cursor="pointer" opacity={!filters.courseFilter.length || filters.courseFilter.includes(entry.name) ? 1 : 0.4} />)}</Bar></BarChart></ResponsiveContainer></div></DashboardCard>
            <DashboardCard title="Low Performing Courses" className="xl:col-span-1" actions={<div className="flex items-center space-x-2"><span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sort by:</span>{lowPerfSortOptions.map(opt => <button key={opt.id} onClick={() => setLowPerfSortBy(opt.id)} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${lowPerfSortBy === opt.id ? 'bg-brand-primary text-white shadow' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>{opt.label}</button>)}</div>}><div style={{ width: '100%', height: 300 }}><ResponsiveContainer><BarChart data={lowPerformingCourses} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={gridColor} /><XAxis type="number" tick={{ fill: tickColor }} domain={[0, lowPerfSortBy === 'learners' ? 'auto' : 100]}/><YAxis type="category" dataKey="name" tick={{ fill: tickColor }} /><Tooltip formatter={(value, name) => [`${Number(value).toFixed(1)}${name !== 'learners' ? '%' : ''}`, `Avg ${name}`]} /><Bar dataKey={lowPerfSortBy} name={lowPerfSortBy} onClick={handleCourseClick} maxBarSize={30}>{lowPerformingCourses.map((entry, index) => <Cell key={`cell-${index}`} fill={getStatusColor(entry[lowPerfSortBy], lowPerfSortBy === 'learners' ? {low: 10, mid: 20} : {low: 60, mid: 75})} cursor="pointer" opacity={!filters.courseFilter.length || filters.courseFilter.includes(entry.name) ? 1 : 0.4} />)}</Bar></BarChart></ResponsiveContainer></div></DashboardCard>
            <DashboardCard title="Average Scores per Course" className="lg:col-span-3"><div style={{ width: '100%', height: 400 }}><ResponsiveContainer><BarChart data={avgScoresPerCourse} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={gridColor}/><XAxis type="number" domain={[0, 100]} tick={{ fill: tickColor }} unit="%"/><YAxis type="category" dataKey="name" tick={{ fill: tickColor }} /><Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Avg. Score']} /><Bar dataKey="score" name="Avg. Score" onClick={handleCourseClick} maxBarSize={30}>{avgScoresPerCourse.map((entry, index) => <Cell key={`cell-${index}`} fill={getStatusColor(entry.score, {low: 65, mid: 80})} cursor="pointer" opacity={!filters.courseFilter.length || filters.courseFilter.includes(entry.name) ? 1 : 0.4} />)}</Bar></BarChart></ResponsiveContainer></div></DashboardCard>
        </div>
    );
};

const LearnerPerformance = ({ allData, selectedEmail, onLearnerSelect }) => {
    const [selectedEmail2, setSelectedEmail2] = useState('');
    const { theme } = useTheme();
    const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
    const gridColor = theme === 'dark' ? '#4A5568' : '#ccc';

    const LearnerSelector = ({ allLearners, selectedEmail, onSelect, label, placeholder }) => {
        const [inputValue, setInputValue] = useState('');
        useEffect(() => {
            const learner = allLearners.find(l => l.email === selectedEmail);
            setInputValue(learner ? `${learner.name} (${learner.email})` : '');
        }, [selectedEmail, allLearners]);
        const handleInputChange = (e) => {
            const value = e.target.value;
            setInputValue(value);
            const matched = allLearners.find(l => `${l.name} (${l.email})` === value);
            if (matched) onSelect(matched.email); else if (!value) onSelect('');
        };
        return (
            <div>
                <label htmlFor={`learner-input-${label}`} className="font-semibold text-sm">{label}:</label>
                 <div className="relative mt-1">
                     <input type="text" id={`learner-input-${label}`} list={`learners-list-${label}`} value={inputValue} onChange={handleInputChange} placeholder={placeholder} className="w-full p-2 pr-8 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
                    <datalist id={`learners-list-${label}`}>{allLearners.map(learner => <option key={learner.email} value={`${learner.name} (${learner.email})`} />)}</datalist>
                    {inputValue && <button onClick={() => onSelect('')} className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500"><X className="h-5 w-5" /></button>}
                </div>
            </div>
        );
    };

    const uniqueLearners = useMemo(() => {
        const learnerMap = new Map();
        allData.forEach(d => { if (d.email && !learnerMap.has(d.email)) learnerMap.set(d.email, d.traineeName); });
        return Array.from(learnerMap.entries()).map(([email, name]) => ({ email, name })).sort((a,b) => a.name.localeCompare(b.name));
    }, [allData]);
    
    const selectedLearnerName = useMemo(() => uniqueLearners.find(l => l.email === selectedEmail)?.name || '', [selectedEmail, uniqueLearners]);
    const selectedLearnerName2 = useMemo(() => uniqueLearners.find(l => l.email === selectedEmail2)?.name || '', [selectedEmail2, uniqueLearners]);

    const learnerChartData = useMemo(() => {
        if (!selectedEmail && !selectedEmail2) return [];
        const data1 = selectedEmail ? allData.filter(d => d.email === selectedEmail) : [];
        const data2 = selectedEmail2 ? allData.filter(d => d.email === selectedEmail2) : [];
        const allDates = [...new Set([...data1, ...data2].map(d => d.completionDate.getTime()))].sort();
        return allDates.map(dateMs => {
            const date = new Date(dateMs);
            const record1 = data1.find(d => d.completionDate.getTime() === dateMs);
            const record2 = data2.find(d => d.completionDate.getTime() === dateMs);
            return { date: date.toLocaleDateString('en-CA'), learner1Score: record1?.postAssessmentScore, learner1Course: record1?.courseTitle, learner2Score: record2?.postAssessmentScore, learner2Course: record2?.courseTitle };
        });
    }, [selectedEmail, selectedEmail2, allData]);

    const completedCoursesData = useMemo(() => {
        if (!selectedEmail) return [];
        return allData.filter(d => d.email === selectedEmail && d.postAssessmentScore > 0).map(d => ({ courseTitle: d.courseTitle, completionDate: d.completionDate, postAssessmentScore: d.postAssessmentScore }));
    }, [selectedEmail, allData]);

    const courseTableHook = useDataTable(completedCoursesData, 'completionDate', 5);

    const handleExport = () => {
        if (courseTableHook.sortedItems.length === 0) { alert("No data to export."); return; }
        const dataToExport = courseTableHook.sortedItems.map(item => ({ 'Course Title': item.courseTitle, 'Completion Date': item.completionDate, 'Score (%)': item.postAssessmentScore }));
        exportToCsv(`Completed_Courses_${selectedLearnerName.replace(/\s+/g, '_')}`, dataToExport);
    };

    const learnerAverageScore = useMemo(() => {
        if (!completedCoursesData || completedCoursesData.length === 0) return 0;
        return completedCoursesData.reduce((acc, course) => acc + course.postAssessmentScore, 0) / completedCoursesData.length;
    }, [completedCoursesData]);

    const isTopPerformer = learnerAverageScore > 90;

    const companyAverage = useMemo(() => {
        if (allData.length === 0) return 0;
        return allData.reduce((acc, curr) => acc + curr.postAssessmentScore, 0) / allData.length;
    }, [allData]);

    const courseTableColumns = [
        { key: 'courseTitle', label: 'Course Title' },
        { key: 'completionDate', label: 'Completion Date', render: (item) => item.completionDate.toLocaleDateString() },
        { key: 'postAssessmentScore', label: 'Score', render: (item) => `${item.postAssessmentScore}%` },
    ];

    const SortControls = () => {
        const { requestSort, sortConfig } = courseTableHook;
        const sortOptions = [ { label: 'Course', key: 'courseTitle' }, { label: 'Date', key: 'completionDate' }, { label: 'Score', key: 'postAssessmentScore' } ];
        return (
            <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sort by:</span>
                {sortOptions.map(opt => {
                    const isActive = sortConfig.key === opt.key;
                    return <button key={opt.key} onClick={() => requestSort(opt.key)} className={`flex items-center px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${ isActive ? 'bg-brand-primary text-white shadow' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>{opt.label}{isActive && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-3 w-3 ml-1.5" /> : <ArrowDown className="h-3 w-3 ml-1.5" />)}</button>
                })}
            </div>
        );
    };

    const CustomTooltipContent = ({ active = false, payload = [], label = '' }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border dark:border-gray-600 rounded-lg shadow-xl text-sm">
                    <p className="font-bold text-gray-900 dark:text-gray-100 mb-2">Date: {label}</p>
                    {payload.map((p, index) => (
                        p.payload[`learner${index + 1}Score`] && (<div key={p.dataKey} style={{ color: p.color }}><p className="font-semibold">{p.name}: {p.value}%</p><p className="text-xs text-gray-500 dark:text-gray-400 pl-2">Course: {p.payload[`learner${index + 1}Course`]}</p></div>)
                    ))}
                </div>
            );
        } return null;
    };

    return (
        <DashboardCard title="Learner Progress Over Time">
            <div className="flex flex-col h-full">
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LearnerSelector allLearners={uniqueLearners} selectedEmail={selectedEmail} onSelect={onLearnerSelect} label="Learner 1" placeholder="Select first learner..." />
                    <LearnerSelector allLearners={uniqueLearners} selectedEmail={selectedEmail2} onSelect={setSelectedEmail2} label="Learner 2 (Optional)" placeholder="Select second learner to compare..." />
                </div>
                <div className="flex-grow" style={{ minHeight: '300px' }}>
                    {(selectedEmail || selectedEmail2) && learnerChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%"><LineChart data={learnerChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={gridColor} /><XAxis dataKey="date" tick={{ fill: tickColor }} /><YAxis domain={[0, 100]} tick={{ fill: tickColor }} unit="%"/><Tooltip content={<CustomTooltipContent />} /><Legend wrapperStyle={{ color: tickColor }}/>{selectedEmail && <Line connectNulls type="monotone" dataKey="learner1Score" name={selectedLearnerName} stroke="#0072BC" strokeWidth={2} />}{selectedEmail2 && <Line connectNulls type="monotone" dataKey="learner2Score" name={selectedLearnerName2} stroke="#F58220" strokeWidth={2} />}<ReferenceLine y={companyAverage} label={{ value: `Company Avg (${companyAverage.toFixed(1)}%)`, fill: tickColor, position: 'insideTopLeft' }} stroke="#dc3545" strokeDasharray="3 3" /></LineChart></ResponsiveContainer>
                    ) : <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">{selectedEmail ? 'No data for this learner.' : 'Please select at least one learner to view their performance.'}</div>}
                </div>
                {selectedEmail && completedCoursesData.length > 0 && (
                    <div className="mt-8">
                        <h4 className="text-md font-bold text-brand-dark dark:text-white mb-4 flex items-center gap-x-3"><span>Completed Courses for {selectedLearnerName}</span>{isTopPerformer && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 ring-1 ring-inset ring-teal-200 dark:ring-teal-800"><Star className="h-3 w-3 mr-1.5 text-yellow-500" fill="currentColor" />Top Performer</span>}</h4>
                        <div className="flex justify-between items-center mb-3"><SortControls /><button onClick={handleExport} className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600" aria-label="Export completed courses to CSV"><FileSpreadsheet className="h-4 w-4 mr-2" />Export CSV</button></div>
                        <DataTable hook={courseTableHook} columns={courseTableColumns} rowClassName={() => isTopPerformer ? 'bg-teal-50 dark:bg-teal-950 hover:bg-teal-100 dark:hover:bg-teal-900' : '' }/>
                    </div>
                )}
            </div>
        </DashboardCard>
    );
};

const TrendAnalysis = ({ data }) => {
    const { theme } = useTheme();
    const [showMA, setShowMA] = useState(true);
    const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
    const gridColor = theme === 'dark' ? '#4A5568' : '#ccc';
    const calculateMovingAverage = (data, windowSize) => {
        if (!data || data.length < windowSize) return data.map(d => ({ ...d, movingAverage: null }));
        return data.map((_, index, arr) => {
            if (index < windowSize - 1) return { ...arr[index], movingAverage: null };
            const window = arr.slice(index - windowSize + 1, index + 1);
            const sum = window.reduce((acc, val) => acc + val.avgCompletion, 0);
            return { ...arr[index], movingAverage: sum / windowSize };
        });
    };
    const monthlyData = useMemo(() => {
        const trends: {[key: string]: {totalCompletion: number, count: number, totalHours: number}} = {};
        data.forEach(item => {
            const month = item.completionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            if (!trends[month]) trends[month] = { totalCompletion: 0, count: 0, totalHours: 0 };
            trends[month].totalCompletion += item.completionRate;
            trends[month].count += 1;
            trends[month].totalHours += item.trainingHours;
        });
        const sortedTrends = Object.entries(trends).map(([month, values]) => ({ month, avgCompletion: values.totalCompletion / values.count, trainingHours: values.totalHours })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
        return calculateMovingAverage(sortedTrends, 3);
    }, [data]);
    if (data.length === 0) return <DashboardCard title="Trend Analysis"><div className="flex items-center justify-center h-full min-h-[400px] text-gray-500 dark:text-gray-400">No data available for the selected filters.</div></DashboardCard>;
    const completionActions = <label className="flex items-center space-x-2 cursor-pointer text-sm"><input type="checkbox" checked={showMA} onChange={() => setShowMA(!showMA)} className="rounded text-brand-primary focus:ring-brand-primary" /><span className="text-gray-600 dark:text-gray-300">Show 3-Month MA</span></label>;
    const renderChartOrMessage = (chart) => {
        if (monthlyData.length < 2) return <div className="flex items-center justify-center h-full min-h-[300px] text-center text-gray-500 dark:text-gray-400"><div><h4 className="font-semibold text-lg">Not Enough Data for a Trend</h4><p className="text-sm mt-1">A trend line requires data from at least two different time points (e.g., two months).<br/> Please adjust your filters or check your data source.</p></div></div>;
        return <div style={{ width: '100%', height: 400 }}>{chart}</div>;
    };
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard title="Completion Rate Over Time" actions={completionActions}>{renderChartOrMessage(<ResponsiveContainer><LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={gridColor} /><XAxis dataKey="month" tick={{ fill: tickColor }} /><YAxis domain={[0, 100]} unit="%" tick={{ fill: tickColor }} /><Tooltip formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]} /><Legend wrapperStyle={{ color: tickColor, paddingTop: '10px' }} /><Line type="monotone" dataKey="avgCompletion" name="Avg Completion Rate" stroke="#0072BC" strokeWidth={2} dot={monthlyData.length < 2}/><Brush dataKey="month" height={30} stroke="#8884d8" y={320} travellerWidth={20} />{showMA && <Line type="monotone" dataKey="movingAverage" name="3-Month Moving Avg" stroke="#00A99D" strokeWidth={2} strokeDasharray="5 5" dot={false}/>}</LineChart></ResponsiveContainer>)}</DashboardCard>
            <DashboardCard title="Total Training Hours Over Time">{renderChartOrMessage(<ResponsiveContainer><LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={gridColor}/><XAxis dataKey="month" tick={{ fill: tickColor }} /><YAxis tick={{ fill: tickColor }} /><Tooltip /><Legend wrapperStyle={{ color: tickColor, paddingTop: '10px' }} /><Line type="monotone" dataKey="trainingHours" name="Total Training Hours" stroke="#F58220" strokeWidth={2} dot={monthlyData.length < 2}/><Brush dataKey="month" height={30} stroke="#8884d8" y={320} travellerWidth={20} /></LineChart></ResponsiveContainer>)}</DashboardCard>
        </div>
    );
};

const EngagementPerformance = ({ data }) => {
    const { theme } = useTheme();
    const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
    const gridColor = theme === 'dark' ? '#4A5568' : '#ccc';
    const CustomTooltip = ({ active = false, payload = [] }) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return <div className="bg-white dark:bg-gray-800 p-2 border dark:border-gray-600 rounded shadow-lg text-sm"><p className="font-bold text-gray-800 dark:text-gray-100">{data.name}</p><p className="text-gray-700 dark:text-gray-300">{`Engagement (Hours): ${Number(data.x).toFixed(1)}`}</p><p className="text-gray-700 dark:text-gray-300">{`Performance (Score): ${Number(data.y).toFixed(1)}%`}</p></div>;
      } return null;
    };
    const { scatterData, avgEngagement, avgPerformance } = useMemo(() => {
        const learners = [...new Set(data.map(item => item.traineeName))];
        const processedData = learners.map(learner => {
            const learnerRecords = data.filter(item => item.traineeName === learner);
            const totalHours = learnerRecords.reduce((acc, curr) => acc + curr.trainingHours, 0);
            const avgScore = learnerRecords.reduce((acc, curr) => acc + curr.postAssessmentScore, 0) / learnerRecords.length;
            return { name: learner, x: totalHours, y: avgScore, z: learnerRecords.length * 50 };
        }).filter(d => !isNaN(d.y));
        if (processedData.length === 0) return { scatterData: [], avgEngagement: 0, avgPerformance: 0 };
        const avgX = processedData.reduce((acc, curr) => acc + curr.x, 0) / processedData.length;
        const avgY = processedData.reduce((acc, curr) => acc + curr.y, 0) / processedData.length;
        return { scatterData: processedData, avgEngagement: avgX, avgPerformance: avgY };
    }, [data]);
    if (data.length === 0) return <DashboardCard title="Engagement vs. Performance Correlation"><div className="flex items-center justify-center h-full min-h-[400px] text-gray-500 dark:text-gray-400">No data available for the selected filters.</div></DashboardCard>;
    return (
        <DashboardCard title="Engagement vs. Performance Correlation">
            <div style={{ width: '100%', height: 450 }} className="relative">
                 <div className="absolute top-[10%] left-[55%] text-center text-xs text-success font-bold opacity-80"><p>High Achievers</p><p>(High Perf / High Eng.)</p></div>
                 <div className="absolute bottom-[15%] left-[55%] text-center text-xs text-warning font-bold opacity-80"><p>Need Support</p><p>(Low Perf / High Eng.)</p></div>
                 <div className="absolute top-[10%] right-[55%] text-center text-xs text-brand-primary font-bold opacity-80"><p>Efficient</p><p>(High Perf / Low Eng.)</p></div>
                 <div className="absolute bottom-[15%] right-[55%] text-center text-xs text-danger font-bold opacity-80"><p>Need Motivation</p><p>(Low Perf / Low Eng.)</p></div>
                <ResponsiveContainer>
                    <ScatterChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
                        <CartesianGrid stroke={gridColor} strokeDasharray="3 3"/><XAxis type="number" dataKey="x" name="Training Hours" unit="h" label={{ value: 'Total Training Hours (Engagement)', position: 'insideBottom', offset: -15, fill: tickColor }} tick={{ fill: tickColor }} /><YAxis type="number" dataKey="y" name="Avg. Score" unit="%" domain={[0, 100]} label={{ value: 'Avg. Post-Assessment Score (Performance)', angle: -90, position: 'insideLeft', fill: tickColor, dy: 100 }} tick={{ fill: tickColor }} /><ZAxis type="number" dataKey="z" range={[50, 400]} /><ReferenceLine y={avgPerformance} stroke={tickColor} strokeDasharray="4 4"><Label value="Avg. Perf." position="right" fill={tickColor} fontSize={10}/></ReferenceLine><ReferenceLine x={avgEngagement} stroke={tickColor} strokeDasharray="4 4"><Label value="Avg. Eng." position="top" fill={tickColor} fontSize={10}/></ReferenceLine><Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} /><Scatter name="Learners" data={scatterData} fill="#0072BC" shape="circle" fillOpacity={0.6}/>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </DashboardCard>
    );
};

const Leaderboard = ({ data, onTraineeSelect }) => {
    const RankCell = ({ rank }) => {
        const rankColors = ["text-yellow-400", "text-gray-400", "text-orange-400"];
        if (rank <= 3) return <Trophy className={`h-6 w-6 ${rankColors[rank - 1]}`} fill="currentColor" aria-label={`Rank ${rank}`} />;
        return <span className="font-bold text-lg text-gray-500 dark:text-gray-400 w-6 text-center">{rank}</span>;
    };
    const ProgressBarCell = ({ value }) => {
        const getBarColor = (val) => {
            if (val >= 90) return 'bg-success'; if (val >= 75) return 'bg-brand-primary'; if (val >= 50) return 'bg-warning'; return 'bg-danger';
        };
        return (
            <div className="flex items-center gap-x-3"><span className="font-semibold text-gray-800 dark:text-gray-100 w-16 text-right">{Number(value).toFixed(1)}%</span><div className="w-full bg-gray-200 rounded-full h-3.5 dark:bg-gray-600"><div className={`${getBarColor(value)} h-3.5 rounded-full`} style={{ width: `${value}%` }} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}></div></div></div>
        );
    };
    const topTrainees = useMemo(() => {
        const traineeScores: {[key: string]: { name: string, totalScore: number, count: number }} = {};
        data.forEach(d => { if (d.postAssessmentScore > 0 && d.email) { if (!traineeScores[d.email]) traineeScores[d.email] = { name: d.traineeName, totalScore: 0, count: 0 }; traineeScores[d.email].totalScore += d.postAssessmentScore; traineeScores[d.email].count++; } });
        return Object.entries(traineeScores).map(([email, { name, totalScore, count }]) => ({ email, name, avgScore: parseFloat((totalScore / count).toFixed(1)), courseInfo: `(${count} courses)`, courseCount: count })).sort((a, b) => b.avgScore - a.avgScore).map((trainee, index) => ({ ...trainee, rank: index + 1 }));
    }, [data]);
    const topBranches = useMemo(() => {
        const branchRates: {[key: string]: { totalRate: number, count: number, trainees: Set<string> }} = {};
        data.forEach(d => { if (!branchRates[d.branch]) branchRates[d.branch] = { totalRate: 0, count: 0, trainees: new Set() }; branchRates[d.branch].totalRate += d.completionRate; branchRates[d.branch].count++; branchRates[d.branch].trainees.add(d.traineeName); });
        return Object.entries(branchRates).map(([name, { totalRate, count, trainees }]) => ({ name, avgRate: parseFloat((totalRate / count).toFixed(1)), traineeInfo: `(${trainees.size} trainees)`, traineeCount: trainees.size })).sort((a,b) => b.avgRate - a.avgRate).map((branch, index) => ({ ...branch, rank: index + 1}));
    }, [data]);
    const topSupervisors = useMemo(() => {
        const supervisorRates: {[key: string]: { totalRate: number, count: number, trainees: Set<string> }} = {};
        data.forEach(d => { if (d.supervisor) { if (!supervisorRates[d.supervisor]) supervisorRates[d.supervisor] = { totalRate: 0, count: 0, trainees: new Set() }; supervisorRates[d.supervisor].totalRate += d.completionRate; supervisorRates[d.supervisor].count++; supervisorRates[d.supervisor].trainees.add(d.traineeName); } });
        return Object.entries(supervisorRates).map(([name, { totalRate, count, trainees }]) => ({ name, avgRate: parseFloat((totalRate / count).toFixed(1)), traineeInfo: `(${trainees.size} trainees)`, traineeCount: trainees.size })).sort((a, b) => b.avgRate - a.avgRate).map((supervisor, index) => ({ ...supervisor, rank: index + 1}));
    }, [data]);
    const traineeTableHook = useDataTable(topTrainees, 'avgScore', 5);
    const branchTableHook = useDataTable(topBranches, 'avgRate', 5);
    const supervisorTableHook = useDataTable(topSupervisors, 'avgRate', 5);
    const traineeColumns = [ { key: 'rank', label: 'Rank', render: item => <RankCell rank={item.rank} /> }, { key: 'name', label: 'Trainee', render: item => <button onClick={() => onTraineeSelect(item.email)} className="text-left hover:underline text-brand-primary font-semibold">{item.name}<span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">{item.courseInfo}</span></button> }, { key: 'avgScore', label: 'Average Score', render: item => <ProgressBarCell value={item.avgScore} /> } ];
    const branchColumns = [ { key: 'rank', label: 'Rank', render: item => <RankCell rank={item.rank} /> }, { key: 'name', label: 'Branch', render: item => <span>{item.name}<span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{item.traineeInfo}</span></span> }, { key: 'avgRate', label: 'Average Completion', render: item => <ProgressBarCell value={item.avgRate} /> } ];
    const supervisorColumns = [ { key: 'rank', label: 'Rank', render: item => <RankCell rank={item.rank} /> }, { key: 'name', label: 'Supervisor', render: item => <span>{item.name}<span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{item.traineeInfo}</span></span> }, { key: 'avgRate', label: 'Team Average Completion', render: item => <ProgressBarCell value={item.avgRate} /> } ];
    if (data.length === 0) return <DashboardCard title="Leaderboards"><div className="flex items-center justify-center h-full min-h-[400px] text-gray-500 dark:text-gray-400">No data available for the selected filters.</div></DashboardCard>;
    return (
        <div className="grid grid-cols-1 gap-8">
            <DashboardCard title="Top Trainees by Average Score"><DataTable hook={traineeTableHook} columns={traineeColumns} /></DashboardCard>
            <DashboardCard title="Top Branches by Completion Rate"><DataTable hook={branchTableHook} columns={branchColumns} /></DashboardCard>
            <DashboardCard title="Top Supervisors by Team Completion"><DataTable hook={supervisorTableHook} columns={supervisorColumns} /></DashboardCard>
        </div>
    );
};

const ActionableInsights = ({ data, allData, onTraineeSelect }) => {
    const DEFAULT_THRESHOLDS = { AT_RISK_COMPLETION: 30, AT_RISK_SCORE: 50, COURSE_ATTENTION_COMPLETION: 60, COURSE_ATTENTION_SCORE: 60 };
    const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
    const handleThresholdChange = (e) => { const { name, value } = e.target; setThresholds(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 })); };
    const RankCell = ({ rank }) => {
        const rankColors = ["text-yellow-400", "text-gray-400", "text-orange-400"];
        if (rank <= 3) return <Trophy className={`h-6 w-6 ${rankColors[rank - 1]}`} fill="currentColor" aria-label={`Rank ${rank}`} />;
        return <span className="font-bold text-lg text-gray-500 dark:text-gray-400 w-6 text-center">{rank}</span>;
    };
    const atRiskTrainees = useMemo(() => {
        const riskMap = new Map();
        data.forEach(record => {
            const reasons = [];
            if (record.completionRate < thresholds.AT_RISK_COMPLETION) reasons.push(`Completion < ${thresholds.AT_RISK_COMPLETION}%`);
            if (record.postAssessmentScore > 0 && record.postAssessmentScore < thresholds.AT_RISK_SCORE) reasons.push(`Score < ${thresholds.AT_RISK_SCORE}%`);
            if (reasons.length > 0) { if (!riskMap.has(record.traineeName)) riskMap.set(record.traineeName, { trainee: record, reasons: [] }); riskMap.get(record.traineeName).reasons.push(...reasons.map(r => `${r} on '${record.courseTitle}'`)); }
        });
        return Array.from(riskMap.values());
    }, [data, thresholds]);
    const coursesNeedingAttention = useMemo(() => {
        const courseStats: {[key: string]: { totalCompletion: number, totalScore: number, scoreCount: number, recordCount: number, learners: Set<string> }} = {};
        data.forEach(record => { if (!courseStats[record.courseTitle]) courseStats[record.courseTitle] = { totalCompletion: 0, totalScore: 0, scoreCount: 0, recordCount: 0, learners: new Set() }; const stats = courseStats[record.courseTitle]; stats.totalCompletion += record.completionRate; stats.recordCount++; stats.learners.add(record.traineeName); if (record.postAssessmentScore > 0) { stats.totalScore += record.postAssessmentScore; stats.scoreCount++; } });
        return Object.entries(courseStats).map(([title, stats]) => ({ title, avgCompletion: parseFloat((stats.totalCompletion / stats.recordCount).toFixed(1)), avgScore: stats.scoreCount > 0 ? parseFloat((stats.totalScore / stats.scoreCount).toFixed(1)) : 0, learnerCount: stats.learners.size })).filter(course => course.avgCompletion < thresholds.COURSE_ATTENTION_COMPLETION || (course.avgScore > 0 && course.avgScore < thresholds.COURSE_ATTENTION_SCORE));
    }, [data, thresholds]);
    const topImprovers = useMemo(() => {
        const improverStats: {[key: string]: { name: string, totalImprovement: number, courseCount: number }} = {};
        data.forEach(record => { if (record.preAssessmentScore > 0 && record.postAssessmentScore > 0 && record.email) { if (!improverStats[record.email]) improverStats[record.email] = { name: record.traineeName, totalImprovement: 0, courseCount: 0 }; const improvement = ((record.postAssessmentScore - record.preAssessmentScore) / record.preAssessmentScore) * 100; if (improvement > 0) { improverStats[record.email].totalImprovement += improvement; improverStats[record.email].courseCount++; } } });
        return Object.entries(improverStats).filter(([, stats]) => stats.courseCount > 0).map(([email, stats]) => ({ email, name: stats.name, avgImprovement: parseFloat((stats.totalImprovement / stats.courseCount).toFixed(1)), })).sort((a, b) => b.avgImprovement - a.avgImprovement).map((trainee, index) => ({ ...trainee, rank: index + 1 }));
    }, [data]);
    const topPerformingCourses = useMemo(() => {
        const courseStats: {[key:string]: { totalCompletion: number, totalScore: number, scoreCount: number, recordCount: number }} = {};
        data.forEach(record => { if (!courseStats[record.courseTitle]) courseStats[record.courseTitle] = { totalCompletion: 0, totalScore: 0, scoreCount: 0, recordCount: 0 }; const stats = courseStats[record.courseTitle]; stats.totalCompletion += record.completionRate; stats.recordCount++; if (record.postAssessmentScore > 0) { stats.totalScore += record.postAssessmentScore; stats.scoreCount++; } });
        return Object.entries(courseStats).map(([title, stats]) => { const avgCompletion = stats.recordCount > 0 ? (stats.totalCompletion / stats.recordCount) : 0; const avgScore = stats.scoreCount > 0 ? (stats.totalScore / stats.scoreCount) : 0; const performanceScore = (avgCompletion * 0.6) + (avgScore * 0.4); return { title, avgCompletion, avgScore, performanceScore, recordCount: stats.recordCount }; }).sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5).map((course, index) => ({ ...course, rank: index + 1}));
    }, [data]);
    const atRiskTraineesData = useMemo(() => atRiskTrainees.map(item => ({ traineeName: item.trainee.traineeName, branch: item.trainee.branch, supervisor: item.trainee.supervisor, reasons: item.reasons.join('; '), email: item.trainee.email })), [atRiskTrainees]);
    const atRiskTableHook = useDataTable(atRiskTraineesData);
    const coursesTableHook = useDataTable(coursesNeedingAttention, 'avgCompletion');
    const topImproversHook = useDataTable(topImprovers, 'avgImprovement');
    const topCoursesHook = useDataTable(topPerformingCourses, 'performanceScore');
    const atRiskColumns = [ { key: 'traineeName', label: 'Trainee' }, { key: 'branch', label: 'Branch' }, { key: 'supervisor', label: 'Supervisor' }, { key: 'reasons', label: 'Reason(s)', render: item => <ul className="list-disc list-inside space-y-1 text-sm">{item.reasons.split('; ').slice(0, 2).map((reason, i) => <li key={i}>{reason}</li>)}{item.reasons.split('; ').length > 2 && <li className="text-xs text-gray-500">...and {item.reasons.split('; ').length - 2} more</li>}</ul> }, { key: 'email', label: 'Actions', render: item => <div><button onClick={() => onTraineeSelect(item.email)} className="px-2.5 py-1 text-xs font-semibold text-brand-primary bg-blue-100 dark:bg-blue-900/50 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors" title={`View details for ${item.traineeName}`}>View Details</button></div> } ];
    const coursesColumns = [ { key: 'title', label: 'Course Title' }, { key: 'avgCompletion', label: 'Avg Completion', render: item => <span className={item.avgCompletion < thresholds.COURSE_ATTENTION_COMPLETION ? 'text-danger font-semibold' : ''}>{item.avgCompletion.toFixed(1)}%</span> }, { key: 'avgScore', label: 'Avg Score', render: item => <span className={item.avgScore > 0 && item.avgScore < thresholds.COURSE_ATTENTION_SCORE ? 'text-danger font-semibold' : ''}>{item.avgScore.toFixed(1)}%</span> }, { key: 'learnerCount', label: 'Learners' } ];
    const topImproversColumns = [ { key: 'rank', label: 'Rank', render: item => <RankCell rank={item.rank} /> }, { key: 'name', label: 'Trainee' }, { key: 'avgImprovement', label: 'Avg. Improvement', render: item => <span className="font-semibold text-success">+{item.avgImprovement.toFixed(1)}%</span> } ];
    const topCoursesColumns = [ { key: 'rank', label: 'Rank', render: item => <RankCell rank={item.rank} /> }, { key: 'title', label: 'Course Title' }, { key: 'avgCompletion', label: 'Avg Completion', render: item => <span className="font-semibold text-green-600 dark:text-green-400">{item.avgCompletion.toFixed(1)}%</span> }, { key: 'avgScore', label: 'Avg Score', render: item => <span className="font-semibold text-green-600 dark:text-green-400">{item.avgScore.toFixed(1)}%</span> } ];
    if (data.length === 0) return <DashboardCard title="Actionable Insights"><div className="flex items-center justify-center h-full min-h-[400px] text-gray-500 dark:text-gray-400">No data available for the selected filters.</div></DashboardCard>;
    const ThresholdInput = ({ label, name, value, unit = "%" }) => <div><label htmlFor={name} className="block text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label><div className="relative mt-1"><input type="number" id={name} name={name} value={value} onChange={handleThresholdChange} className="w-24 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" /><div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">{unit}</span></div></div></div>;
    return (
        <div className="space-y-6">
            <DashboardCard title="At-Risk Trainees"><div className="p-4 mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600"><h4 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-3">Insight Thresholds</h4><div className="flex flex-wrap items-end gap-x-6 gap-y-4"><ThresholdInput label="At-Risk Completion" name="AT_RISK_COMPLETION" value={thresholds.AT_RISK_COMPLETION} /><ThresholdInput label="At-Risk Score" name="AT_RISK_SCORE" value={thresholds.AT_RISK_SCORE} /><ThresholdInput label="Course Attention Completion" name="COURSE_ATTENTION_COMPLETION" value={thresholds.COURSE_ATTENTION_COMPLETION} /><ThresholdInput label="Course Attention Score" name="COURSE_ATTENTION_SCORE" value={thresholds.COURSE_ATTENTION_SCORE} /></div></div><DataTable hook={atRiskTableHook} columns={atRiskColumns} /></DashboardCard>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6"><DashboardCard title="Courses Needing Attention"><DataTable hook={coursesTableHook} columns={coursesColumns} /></DashboardCard><DashboardCard title="Top Improvers (Pre vs Post Score)"><DataTable hook={topImproversHook} columns={topImproversColumns} /></DashboardCard><DashboardCard title="Top Performing Courses" className="xl:col-span-2"><DataTable hook={topCoursesHook} columns={topCoursesColumns} /></DashboardCard></div>
        </div>
    );
};

const ComparisonTool = ({ allData, options }) => {
    const [groupA, setGroupA] = useState({ category: '', value: '' });
    const [groupB, setGroupB] = useState({ category: '', value: '' });
    const calculateKpis = (data) => {
        if (data.length === 0) return { totalLearners: 0, avgCompletion: 0, avgPostScore: 0, improvement: 0, totalHours: 0, recordCount: 0 };
        const totalLearners = new Set(data.map(d => d.traineeName)).size;
        const avgCompletion = data.reduce((acc, curr) => acc + curr.completionRate, 0) / data.length;
        const totalHours = data.reduce((acc, curr) => acc + curr.trainingHours, 0);
        const completedTrainings = data.filter(d => d.postAssessmentScore > 0);
        const avgPostScore = completedTrainings.length > 0 ? completedTrainings.reduce((acc, curr) => acc + curr.postAssessmentScore, 0) / completedTrainings.length : 0;
        const preScores = completedTrainings.reduce((acc, curr) => acc + curr.preAssessmentScore, 0);
        const postScores = completedTrainings.reduce((acc, curr) => acc + curr.postAssessmentScore, 0);
        const improvement = preScores > 0 ? ((postScores - preScores) / preScores) * 100 : 0;
        return { totalLearners, avgCompletion, avgPostScore, improvement, totalHours, recordCount: data.length };
    };
    const getOptionsForCategory = (category) => {
        if (!category) return [];
        return { branch: options.branches, districtHead: options.districtHeads, supervisor: options.supervisors }[category].filter(opt => opt !== 'all');
    };
    const handleCategoryChange = (setter, e) => setter({ category: e.target.value, value: '' });
    const handleValueChange = (setter, e) => setter(prev => ({ ...prev, value: e.target.value }));
    const { groupAData, groupBData } = useMemo(() => {
        const filterData = group => !group.category || !group.value ? [] : allData.filter(item => item[group.category] === group.value);
        return { groupAData: filterData(groupA), groupBData: filterData(groupB) };
    }, [allData, groupA, groupB]);
    const kpisA = useMemo(() => calculateKpis(groupAData), [groupAData]);
    const kpisB = useMemo(() => calculateKpis(groupBData), [groupBData]);
    const ComparisonRow = ({ label, valueA, valueB, format }) => {
        const isAGreater = valueA > valueB, isBGreater = valueB > valueA, isEqual = valueA === valueB && valueA !== 0;
        const getCellClass = (isWinner) => isWinner ? 'font-bold text-success' : isEqual ? 'font-semibold' : 'text-gray-600 dark:text-gray-400';
        return <tr className="border-b dark:border-gray-700"><td className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{label}</td><td className={`py-3 px-4 text-center ${getCellClass(isAGreater)}`}>{format(valueA)}</td><td className={`py-3 px-4 text-center ${getCellClass(isBGreater)}`}>{format(valueB)}</td></tr>;
    };
    const showResults = groupA.value && groupB.value;
    return (
        <DashboardCard title="Comparison Tool">
            <div><h3 className="text-xl font-bold text-brand-dark dark:text-white mb-4">Comparison Setup</h3><div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-end"><div className="md:col-span-5"><h4 className="font-bold text-lg text-brand-primary mb-2">Group A</h4><div className="flex flex-col sm:flex-row gap-4"><div className="flex-1"><label className="text-sm font-medium text-gray-600 dark:text-gray-300">Compare By</label><select onChange={(e) => handleCategoryChange(setGroupA, e)} value={groupA.category} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"><option value="">Select Category...</option><option value="branch">Branch</option><option value="districtHead">District Head</option><option value="supervisor">Supervisor</option></select></div><div className="flex-1"><label className="text-sm font-medium text-gray-600 dark:text-gray-300">Select Value</label><select onChange={(e) => handleValueChange(setGroupA, e)} value={groupA.value} disabled={!groupA.category} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm disabled:bg-gray-100 dark:disabled:bg-gray-700/50 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"><option value="">Select Value...</option>{getOptionsForCategory(groupA.category).map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div></div></div><div className="hidden md:flex justify-center items-center md:col-span-1"><ChevronsRight className="h-8 w-8 text-gray-400 dark:text-gray-500" /></div><div className="md:col-span-5"><h4 className="font-bold text-lg text-brand-secondary mb-2">Group B</h4><div className="flex flex-col sm:flex-row gap-4"><div className="flex-1"><label className="text-sm font-medium text-gray-600 dark:text-gray-300">Compare By</label><select onChange={(e) => handleCategoryChange(setGroupB, e)} value={groupB.category} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"><option value="">Select Category...</option><option value="branch">Branch</option><option value="districtHead">District Head</option><option value="supervisor">Supervisor</option></select></div><div className="flex-1"><label className="text-sm font-medium text-gray-600 dark:text-gray-300">Select Value</label><select onChange={(e) => handleValueChange(setGroupB, e)} value={groupB.value} disabled={!groupB.category} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm disabled:bg-gray-100 dark:disabled:bg-gray-700/50 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"><option value="">Select Value...</option>{getOptionsForCategory(groupB.category).map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div></div></div></div></div>
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                {showResults ? <div><h3 className="text-xl font-bold text-brand-dark dark:text-white mb-4">Comparison Results</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"><div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800"><h5 className="font-bold text-brand-primary">{groupA.value}</h5><div className="flex items-center space-x-4 mt-2 text-sm text-gray-700 dark:text-gray-300"><div className="flex items-center"><UserIcon className="h-4 w-4 mr-1.5"/> {kpisA.totalLearners} Learners</div><div className="flex items-center"><FileTextIcon className="h-4 w-4 mr-1.5"/> {kpisA.recordCount} Records</div></div></div><div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800"><h5 className="font-bold text-brand-secondary">{groupB.value}</h5><div className="flex items-center space-x-4 mt-2 text-sm text-gray-700 dark:text-gray-300"><div className="flex items-center"><UserIcon className="h-4 w-4 mr-1.5"/> {kpisB.totalLearners} Learners</div><div className="flex items-center"><FileTextIcon className="h-4 w-4 mr-1.5"/> {kpisB.recordCount} Records</div></div></div></div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700"><th className="py-3 px-4 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">Metric</th><th className="py-3 px-4 text-center text-sm font-semibold uppercase text-brand-primary">{groupA.value || 'Group A'}</th><th className="py-3 px-4 text-center text-sm font-semibold uppercase text-brand-secondary">{groupB.value || 'Group B'}</th></tr></thead><tbody><ComparisonRow label="Total Learners" valueA={kpisA.totalLearners} valueB={kpisB.totalLearners} format={v => v} /><ComparisonRow label="Avg. Completion Rate" valueA={kpisA.avgCompletion} valueB={kpisB.avgCompletion} format={v => `${v.toFixed(1)}%`} /><ComparisonRow label="Avg. Post-Assessment Score" valueA={kpisA.avgPostScore} valueB={kpisB.avgPostScore} format={v => `${v.toFixed(1)}%`} /><ComparisonRow label="% Improvement (Pre/Post)" valueA={kpisA.improvement} valueB={kpisB.improvement} format={v => `${v.toFixed(1)}%`} /><ComparisonRow label="Total Training Hours" valueA={kpisA.totalHours} valueB={kpisB.totalHours} format={v => v.toFixed(1)} /></tbody></table></div></div> : <div className="text-center py-8 text-gray-500 dark:text-gray-400">Please select two groups to compare.</div>}
            </div>
        </DashboardCard>
    );
};

const FilterPanel = ({ filters, setFilters, options }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [localFilters, setLocalFilters] = useState(filters);
    const [activeQuickSelect, setActiveQuickSelect] = useState(null);
    useEffect(() => { setLocalFilters(filters); }, [filters]);
    useEffect(() => {
        const handler = setTimeout(() => { if (JSON.stringify(localFilters) !== JSON.stringify(filters)) setFilters(localFilters); }, 500);
        return () => clearTimeout(handler);
    }, [localFilters, setFilters, filters]);
    const getQuickSelectDates = (period) => {
        const end = new Date(); let start = new Date(); end.setHours(23, 59, 59, 999);
        switch (period) {
            case 'last7': start.setDate(end.getDate() - 7); break;
            case 'last30': start.setDate(end.getDate() - 30); break;
            case 'thisMonth': start = new Date(end.getFullYear(), end.getMonth(), 1); break;
            default: return { start: null, end: null };
        } start.setHours(0, 0, 0, 0); return { start, end };
    };
    const handleMultiSelectChange = (filterName, selected) => setLocalFilters(prev => ({ ...prev, [filterName]: selected }));
    const handleDateChange = (type, e) => {
        const dateValue = e.target.value;
        if (!dateValue) {
            setLocalFilters(prev => ({ ...prev, timePeriodFilter: { ...prev.timePeriodFilter, [type]: null } }));
            setActiveQuickSelect(null);
            return;
        }

        const newDate = new Date(dateValue);
        // Adjust for timezone offset
        const timezoneOffset = newDate.getTimezoneOffset() * 60000;
        let adjustedDate = new Date(newDate.getTime() + timezoneOffset);

        if (type === 'start') {
            adjustedDate.setHours(0, 0, 0, 0);
        } else { // 'end'
            adjustedDate = new Date(adjustedDate.getTime() + (24 * 60 * 60 * 1000 - 1));
        }
        
        setLocalFilters(prev => ({ ...prev, timePeriodFilter: { ...prev.timePeriodFilter, [type]: adjustedDate } }));
        setActiveQuickSelect(null);
    };
    const handleQuickSelect = (period) => {
        const { start, end } = getQuickSelectDates(period);
        setLocalFilters(prev => ({ ...prev, timePeriodFilter: { start, end } }));
        setActiveQuickSelect(period);
    };
    const handleClearDates = () => { setLocalFilters(prev => ({ ...prev, timePeriodFilter: { start: null, end: null } })); setActiveQuickSelect(null); };
    const handleResetFilters = () => { setFilters({ branchFilter: [], districtHeadFilter: [], supervisorFilter: [], courseFilter: [], courseTypeFilter: [], timePeriodFilter: { start: null, end: null } }); setActiveQuickSelect(null); };
    const formatDateForInput = date => { if (!date || isNaN(date.getTime())) return ''; try { return date.toISOString().split('T')[0]; } catch (e) { return ''; } };
    const areFiltersActive = () => filters.branchFilter.length > 0 || filters.districtHeadFilter.length > 0 || filters.supervisorFilter.length > 0 || filters.courseFilter.length > 0 || filters.courseTypeFilter.length > 0 || filters.timePeriodFilter.start !== null || filters.timePeriodFilter.end !== null;
    const getActiveFilterSummary = () => {
        const active = [];
        if (filters.branchFilter.length > 0) active.push(`Branch (${filters.branchFilter.length})`);
        if (filters.districtHeadFilter.length > 0) active.push('District');
        if (filters.supervisorFilter.length > 0) active.push('Supervisor');
        if (filters.courseFilter.length > 0) active.push(`Course (${filters.courseFilter.length})`);
        if (filters.courseTypeFilter.length > 0) active.push('Type');
        if (filters.timePeriodFilter.start || filters.timePeriodFilter.end) active.push('Date');
        if (active.length === 0) return "No active filters";
        if (active.length <= 3) return `Active: ${active.join(', ')}`;
        return `${active.length} filters active`;
    };
    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-[77px] z-10 border-t dark:border-gray-700">
            <div className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" onClick={() => setIsCollapsed(!isCollapsed)}>
                <div className="flex items-center space-x-3 overflow-hidden"><SlidersHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-300 flex-shrink-0" /><div><h3 className="font-semibold text-gray-800 dark:text-gray-100">Filters</h3>{isCollapsed && <p className="text-xs text-gray-500 dark:text-gray-400 truncate pr-2">{getActiveFilterSummary()}</p>}</div></div>
                <div className="flex items-center space-x-4">{isCollapsed && areFiltersActive() && <button onClick={(e) => { e.stopPropagation(); handleResetFilters(); }} className="text-xs font-semibold text-brand-primary hover:underline" aria-label="Reset all filters">Reset</button>}<button aria-label={isCollapsed ? "Show filters" : "Hide filters"} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">{isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}</button></div>
            </div>
            <div className={`transition-[max-height] duration-300 ease-in-out ${isCollapsed ? 'max-h-0 overflow-hidden' : 'max-h-[500px] overflow-visible'}`}>
                <div className="p-3 border-t border-gray-200 dark:border-gray-700"><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-3 items-end">
                    <MultiSelectFilter label="Branch" options={options.branches} selected={localFilters.branchFilter} onChange={(selected) => handleMultiSelectChange('branchFilter', selected)} />
                    <MultiSelectFilter label="District Head" options={options.districtHeads} selected={localFilters.districtHeadFilter} onChange={(selected) => handleMultiSelectChange('districtHeadFilter', selected)} />
                    <MultiSelectFilter label="Supervisor" options={options.supervisors} selected={localFilters.supervisorFilter} onChange={(selected) => handleMultiSelectChange('supervisorFilter', selected)} />
                    <MultiSelectFilter label="Course" options={options.courses} selected={localFilters.courseFilter} onChange={(selected) => handleMultiSelectChange('courseFilter', selected)} />
                    <MultiSelectFilter label="Course Type" options={options.courseTypes} selected={localFilters.courseTypeFilter} onChange={(selected) => handleMultiSelectChange('courseTypeFilter', selected)} />
                    <div className="lg:col-span-2"><label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Time Period</label><div className="grid grid-cols-2 gap-2"><input type="date" aria-label="Start Date" value={formatDateForInput(localFilters.timePeriodFilter.start)} onChange={(e) => handleDateChange('start', e)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" /><input type="date" aria-label="End Date" value={formatDateForInput(localFilters.timePeriodFilter.end)} onChange={(e) => handleDateChange('end', e)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" /></div><div className="flex items-center space-x-2 mt-2 flex-wrap"><button onClick={() => handleQuickSelect('last7')} className={`px-2 py-1 text-xs rounded transition-colors ${activeQuickSelect === 'last7' ? 'bg-brand-primary text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>Last 7 Days</button><button onClick={() => handleQuickSelect('last30')} className={`px-2 py-1 text-xs rounded transition-colors ${activeQuickSelect === 'last30' ? 'bg-brand-primary text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>Last 30 Days</button><button onClick={() => handleQuickSelect('thisMonth')} className={`px-2 py-1 text-xs rounded transition-colors ${activeQuickSelect === 'thisMonth' ? 'bg-brand-primary text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>This Month</button><button onClick={handleClearDates} aria-label="Clear dates" className="text-gray-500 dark:text-gray-400 hover:text-danger p-1"><X className="h-4 w-4" /></button></div></div>
                    <div className="lg:col-span-1"><button onClick={handleResetFilters} disabled={!areFiltersActive()} className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Reset all filters"><RotateCcw className="h-4 w-4 mr-2" />Reset</button></div>
                </div></div>
            </div>
        </div>
    );
};

const Sidebar = ({ activeSection, setActiveSection, sections }) => {
    return (
        <aside className="w-64 bg-brand-dark text-white flex-col hidden sm:flex">
            <div className="sidebar-logo p-4 border-b border-gray-700">
              <img 
                src="https://raw.githubusercontent.com/mohamedomar00700-sudo/United-Pharmacy-LMS-Dashboard/main/public/logo.jpeg" 
                alt="United Pharmacy Logo" 
                style={{width: '140px', height: 'auto', display: 'block', margin: '10px auto'}} 
              />
            </div>
            <nav className="flex-1 p-4">
                <ul>{sections.map(section => <li key={section.id}><button onClick={() => setActiveSection(section.id)} className={`w-full text-left flex items-center space-x-3 p-3 my-1 rounded-md transition-all duration-200 ${activeSection === section.id ? 'bg-brand-primary text-white shadow-md' : 'hover:bg-blue-900/50'}`}><section.icon className="h-5 w-5" /><span>{section.name}</span></button></li>)}</ul>
            </nav>
            <div className="p-4 border-t border-blue-900/50 text-center text-xs text-gray-400"><p>&copy; 2024 United Pharmacy</p></div>
        </aside>
    );
};

const Dashboard = () => {
    const [activeSection, setActiveSection] = useState('overview');
    const [allData, setAllData] = useState<TrainingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const exportRef = useRef(null);
    const [selectedLearnerEmail, setSelectedLearnerEmail] = useState('');
    const [filters, setFilters] = useState({ branchFilter: [], districtHeadFilter: [], supervisorFilter: [], courseFilter: [], courseTypeFilter: [], timePeriodFilter: { start: null, end: null } });
    
    const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQjnqWHdBApU1MUf5dfFdy8Yscugy4Nkyn_jT5g9xH6yzA8a2tiiMjsB0gKYDJxq50iee-S72CFfiCv/pub?gid=0&single=true&output=csv';

    const sections = [ { id: 'overview', name: 'Overview', icon: BarChart2 }, { id: 'leaderboard', name: 'Leaderboards', icon: Trophy }, { id: 'actionable-insights', name: 'Actionable Insights', icon: ShieldAlert }, { id: 'branch-comparison', name: 'Branch Comparison', icon: GitCompareArrows }, { id: 'comparison-tool', name: 'Comparison Tool', icon: Users }, { id: 'course-analysis', name: 'Course Analysis', icon: BookOpen }, { id: 'learner-performance', name: 'Learner Performance', icon: Target }, { id: 'trend-analysis', name: 'Trend Analysis', icon: TrendingUp }, { id: 'engagement-performance', name: 'Engagement vs Performance', icon: Users } ];

    useEffect(() => {
        if (!GOOGLE_SHEET_CSV_URL) {
            setError("Google Sheet URL is not configured. Please see the instructions in the code comments to set it up.");
            setLoading(false); return;
        }
        fetchTrainingData(GOOGLE_SHEET_CSV_URL).then(data => setAllData(data))
            .catch(err => { console.error("Failed to fetch or parse data:", err); setError("Failed to load data. Please check the Google Sheet URL and ensure it's a valid, publicly accessible CSV."); })
            .finally(() => setLoading(false));
    }, []);

    const filterOptions = useMemo(() => {
        const branches = [...new Set(allData.map(d => d.branch))];
        const districtHeads = [...new Set(allData.map(d => d.districtHead))];
        const supervisors = [...new Set(allData.map(d => d.supervisor))];
        const courses = [...new Set(allData.map(d => d.courseTitle))];
        const courseTypes = Object.values(CourseType);
        return { branches, districtHeads, supervisors, courses, courseTypes };
    }, [allData]);

    const filteredData = useMemo(() => allData.filter(item => 
        (filters.branchFilter.length === 0 || filters.branchFilter.includes(item.branch)) &&
        (filters.districtHeadFilter.length === 0 || filters.districtHeadFilter.includes(item.districtHead)) &&
        (filters.supervisorFilter.length === 0 || filters.supervisorFilter.includes(item.supervisor)) &&
        (filters.courseFilter.length === 0 || filters.courseFilter.includes(item.courseTitle)) &&
        (filters.courseTypeFilter.length === 0 || filters.courseTypeFilter.includes(item.courseType)) &&
        (!filters.timePeriodFilter.start || item.completionDate >= filters.timePeriodFilter.start) &&
        (!filters.timePeriodFilter.end || item.completionDate <= filters.timePeriodFilter.end)
    ), [allData, filters]);
    
    const handleSelectLearnerAndNavigate = (email) => { setSelectedLearnerEmail(email); setActiveSection('learner-performance'); };
    const handleNavigation = (section, newFilters) => { if (newFilters) setFilters(prev => ({...prev, ...newFilters})); setActiveSection(section); };
    const renderSection = () => {
        switch (activeSection) {
            case 'overview': return <Overview data={filteredData} allData={allData} onNavigate={handleNavigation} />;
            case 'leaderboard': return <Leaderboard data={filteredData} onTraineeSelect={handleSelectLearnerAndNavigate} />;
            case 'actionable-insights': return <ActionableInsights data={filteredData} allData={allData} onTraineeSelect={handleSelectLearnerAndNavigate} />;
            case 'branch-comparison': return <BranchComparison data={filteredData} allData={allData} filters={filters} setFilters={setFilters} />;
            case 'comparison-tool': return <ComparisonTool allData={allData} options={filterOptions} />;
            case 'course-analysis': return <CourseAnalysis data={filteredData} filters={filters} setFilters={setFilters} />;
            case 'learner-performance': return <LearnerPerformance allData={allData} selectedEmail={selectedLearnerEmail} onLearnerSelect={setSelectedLearnerEmail} />;
            case 'trend-analysis': return <TrendAnalysis data={filteredData} />;
            case 'engagement-performance': return <EngagementPerformance data={filteredData} />;
            default: return <Overview data={filteredData} allData={allData} onNavigate={handleNavigation}/>;
        }
    };
    if(loading) return <div className="flex justify-center items-center h-screen text-lg font-semibold text-brand-dark dark:text-brand-light">Loading Dashboard Data...</div>;
    return (
        <div className="flex h-screen">
            <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} sections={sections} />
            <main className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 overflow-y-auto">
                <header className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-20 flex justify-between items-center border-b dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-brand-dark dark:text-white">{sections.find(s => s.id === activeSection)?.name}</h1>
                    <div className="flex items-center space-x-2"><ExportCsvButton data={filteredData} fileName={`${activeSection}_data_export`} /><ExportButton elementRef={exportRef} fileName={activeSection} /><ThemeSwitcher /></div>
                </header>
                { !error && allData.length > 0 && activeSection !== 'comparison-tool' && <FilterPanel filters={filters} setFilters={setFilters} options={filterOptions} /> }
                <div ref={exportRef} className="p-4 md:p-6 lg:p-8 flex-1 bg-gray-100 dark:bg-gray-900">
                     {error ? <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 border border-danger rounded-lg"><h2 className="text-xl font-bold text-danger mb-2">Data Loading Error</h2><p className="text-gray-700 dark:text-gray-300">{error}</p><p className="mt-2 text-sm">Please refer to the setup instructions in <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded">index.tsx</code> to configure the Google Sheet URL.</p></div> : renderSection()}
                </div>
            </main>
        </div>
    );
};

function App() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
      <Dashboard />
    </div>
  );
}

// ========= APP INITIALIZATION =========
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);