import React, { useState, useEffect } from 'react';
import { Filters } from './Dashboard';
import { MultiSelectFilter } from './MultiSelectFilter';
import { X, RotateCcw, SlidersHorizontal, ChevronUp, ChevronDown } from 'lucide-react';

interface FilterPanelProps {
    filters: Filters;
    setFilters: (value: Filters) => void;
    options: {
        branches: string[];
        districtHeads: string[];
        supervisors: string[];
        courses: string[];
        courseTypes: string[];
    };
}

const getQuickSelectDates = (period: string) => {
    const end = new Date();
    let start = new Date();
    end.setHours(23, 59, 59, 999); // Set end to end of today

    switch (period) {
        case 'last7':
            start.setDate(end.getDate() - 7);
            break;
        case 'last30':
            start.setDate(end.getDate() - 30);
            break;
        case 'thisMonth':
            start = new Date(end.getFullYear(), end.getMonth(), 1);
            break;
        default:
            return { start: null, end: null };
    }
    start.setHours(0, 0, 0, 0); // Set start to beginning of the day
    return { start, end };
};


export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, setFilters, options }) => {
    
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [localFilters, setLocalFilters] = useState<Filters>(filters);
    const [activeQuickSelect, setActiveQuickSelect] = useState<string | null>(null);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (JSON.stringify(localFilters) !== JSON.stringify(filters)) {
                 setFilters(localFilters);
            }
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [localFilters, setFilters, filters]);

    const handleMultiSelectChange = (filterName: keyof Omit<Filters, 'timePeriodFilter'>, selected: string[]) => {
        setLocalFilters(prev => ({ ...prev, [filterName]: selected }));
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value ? new Date(e.target.value) : null;
        setLocalFilters(prev => ({
            ...prev,
            timePeriodFilter: { ...prev.timePeriodFilter, start: newDate }
        }));
        setActiveQuickSelect(null);
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value ? new Date(e.target.value) : null;
        setLocalFilters(prev => ({
            ...prev,
            timePeriodFilter: { ...prev.timePeriodFilter, end: newDate }
        }));
        setActiveQuickSelect(null);
    };
    
    const handleQuickSelect = (period: string) => {
        const { start, end } = getQuickSelectDates(period);
        setLocalFilters(prev => ({
            ...prev,
            timePeriodFilter: { start, end }
        }));
        setActiveQuickSelect(period);
    };

    const handleClearDates = () => {
        setLocalFilters(prev => ({
            ...prev,
            timePeriodFilter: { start: null, end: null }
        }));
        setActiveQuickSelect(null);
    };

    const handleResetFilters = () => {
        const resetState: Filters = {
            branchFilter: [],
            districtHeadFilter: [],
            supervisorFilter: [],
            courseFilter: [],
            courseTypeFilter: [],
            timePeriodFilter: { start: null, end: null },
        };
        setFilters(resetState);
        setActiveQuickSelect(null);
    };
    
    const formatDateForInput = (date: Date | null) => {
        if (!date || isNaN(date.getTime())) return '';
        try {
            return date.toISOString().split('T')[0];
        } catch (error) {
            return '';
        }
    }

    const areFiltersActive = () => {
        return filters.branchFilter.length > 0 ||
               filters.districtHeadFilter.length > 0 ||
               filters.supervisorFilter.length > 0 ||
               filters.courseFilter.length > 0 ||
               filters.courseTypeFilter.length > 0 ||
               filters.timePeriodFilter.start !== null ||
               filters.timePeriodFilter.end !== null;
    };

    const getActiveFilterSummary = () => {
        const activeFilters: string[] = [];
        if (filters.branchFilter.length > 0) activeFilters.push(`Branch (${filters.branchFilter.length})`);
        if (filters.districtHeadFilter.length > 0) activeFilters.push('District');
        if (filters.supervisorFilter.length > 0) activeFilters.push('Supervisor');
        if (filters.courseFilter.length > 0) activeFilters.push(`Course (${filters.courseFilter.length})`);
        if (filters.courseTypeFilter.length > 0) activeFilters.push('Type');
        if (filters.timePeriodFilter.start || filters.timePeriodFilter.end) activeFilters.push('Date');
        
        if (activeFilters.length === 0) return "No active filters";
        if (activeFilters.length <= 3) return `Active: ${activeFilters.join(', ')}`;
        return `${activeFilters.length} filters active`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-[77px] z-10 border-t dark:border-gray-700">
            <div className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" onClick={() => setIsCollapsed(!isCollapsed)}>
                <div className="flex items-center space-x-3 overflow-hidden">
                    <SlidersHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-300 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">Filters</h3>
                        {isCollapsed && (
                           <p className="text-xs text-gray-500 dark:text-gray-400 truncate pr-2">{getActiveFilterSummary()}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                     {isCollapsed && areFiltersActive() && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleResetFilters();
                            }}
                            className="text-xs font-semibold text-brand-primary hover:underline"
                            aria-label="Reset all filters"
                        >
                            Reset
                        </button>
                     )}
                    <button
                        aria-label={isCollapsed ? "Show filters" : "Hide filters"}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            <div className={`transition-[max-height] duration-300 ease-in-out ${isCollapsed ? 'max-h-0 overflow-hidden' : 'max-h-[500px] overflow-visible'}`}>
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-3 items-end">
                        <MultiSelectFilter label="Branch" options={options.branches} selected={localFilters.branchFilter} onChange={(selected) => handleMultiSelectChange('branchFilter', selected)} />
                        <MultiSelectFilter label="District Head" options={options.districtHeads} selected={localFilters.districtHeadFilter} onChange={(selected) => handleMultiSelectChange('districtHeadFilter', selected)} />
                        <MultiSelectFilter label="Supervisor" options={options.supervisors} selected={localFilters.supervisorFilter} onChange={(selected) => handleMultiSelectChange('supervisorFilter', selected)} />
                        <MultiSelectFilter label="Course" options={options.courses} selected={localFilters.courseFilter} onChange={(selected) => handleMultiSelectChange('courseFilter', selected)} />
                        <MultiSelectFilter label="Course Type" options={options.courseTypes} selected={localFilters.courseTypeFilter} onChange={(selected) => handleMultiSelectChange('courseTypeFilter', selected)} />
                        
                        <div className="lg:col-span-2">
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Time Period</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="date"
                                    aria-label="Start Date"
                                    value={formatDateForInput(localFilters.timePeriodFilter.start)}
                                    onChange={handleStartDateChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                />
                                <input
                                    type="date"
                                    aria-label="End Date"
                                    value={formatDateForInput(localFilters.timePeriodFilter.end)}
                                    onChange={handleEndDateChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                />
                            </div>
                            <div className="flex items-center space-x-2 mt-2 flex-wrap">
                                <button onClick={() => handleQuickSelect('last7')} className={`px-2 py-1 text-xs rounded transition-colors ${activeQuickSelect === 'last7' ? 'bg-brand-primary text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>Last 7 Days</button>
                                <button onClick={() => handleQuickSelect('last30')} className={`px-2 py-1 text-xs rounded transition-colors ${activeQuickSelect === 'last30' ? 'bg-brand-primary text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>Last 30 Days</button>
                                <button onClick={() => handleQuickSelect('thisMonth')} className={`px-2 py-1 text-xs rounded transition-colors ${activeQuickSelect === 'thisMonth' ? 'bg-brand-primary text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>This Month</button>
                                <button onClick={handleClearDates} aria-label="Clear dates" className="text-gray-500 dark:text-gray-400 hover:text-danger p-1"><X className="h-4 w-4" /></button>
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <button
                                onClick={handleResetFilters}
                                disabled={!areFiltersActive()}
                                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Reset all filters"
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};