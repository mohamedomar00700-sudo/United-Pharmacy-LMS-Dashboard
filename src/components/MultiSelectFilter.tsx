import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface MultiSelectFilterProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
}

export const MultiSelectFilter = ({ label, options, selected, onChange }: MultiSelectFilterProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { 
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false); 
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        } else {
            setSearchTerm('');
        }
    }, [isOpen]);

    const handleSelect = (option: string) => {
        onChange(selected.includes(option) ? selected.filter(item => item !== option) : [...selected, option]);
    };

    const filteredOptions = useMemo(() => options.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase())), [options, searchTerm]);

    const handleSelectAll = () => {
        onChange(selected.length === options.length ? [] : options);
    };

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
                        <li className="p-2 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" checked={selected.length === options.length} onChange={handleSelectAll} className="rounded text-brand-primary focus:ring-brand-primary" />
                                <span className="font-semibold">Select All</span>
                            </label>
                        </li>
                        {filteredOptions.length > 0 ? filteredOptions.map(option => (
                            <li key={option} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" checked={selected.includes(option)} onChange={() => handleSelect(option)} className="rounded text-brand-primary focus:ring-brand-primary" />
                                    <span>{option}</span>
                                </label>
                            </li>
                        )) : <li className="p-2 text-center text-sm text-gray-500">No options found.</li>}
                    </ul>
                </div>
            )}
        </div>
    );
};
