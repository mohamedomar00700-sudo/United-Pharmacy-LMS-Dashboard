import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
import { DashboardCard } from '../DashboardCard';
import { useDataTable } from '../../hooks/useDataTable';
import { DataTable } from '../DataTable';
import { TrainingRecord } from '../../types';
import { X, FileSpreadsheet, Star, ArrowUp, ArrowDown } from 'lucide-react';
import { exportToCsv } from '../../services/exportService';
import { useTheme } from '../../hooks/useTheme';

interface LearnerPerformanceProps {
    allData: TrainingRecord[];
    selectedEmail: string;
    onLearnerSelect: (email: string) => void;
}

const LearnerSelector = ({ allLearners, selectedEmail, onSelect, label, placeholder }: any) => {
    const [inputValue, setInputValue] = useState('');
    useEffect(() => {
        const learner = allLearners.find((l: any) => l.email === selectedEmail);
        setInputValue(learner ? `${learner.name} (${learner.email})` : '');
    }, [selectedEmail, allLearners]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        const matched = allLearners.find((l: any) => `${l.name} (${l.email})` === value);
        if (matched) onSelect(matched.email); else if (!value) onSelect('');
    };
    return (
        <div>
            <label htmlFor={`learner-input-${label}`} className="font-semibold text-sm">{label}:</label>
             <div className="relative mt-1">
                 <input type="text" id={`learner-input-${label}`} list={`learners-list-${label}`} value={inputValue} onChange={handleInputChange} placeholder={placeholder} className="w-full p-2 pr-8 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
                <datalist id={`learners-list-${label}`}>{allLearners.map((learner: any) => <option key={learner.email} value={`${learner.name} (${learner.email})`} />)}</datalist>
                {inputValue && <button onClick={() => onSelect('')} className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500"><X className="h-5 w-5" /></button>}
            </div>
        </div>
    );
};

const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 p-3 border dark:border-gray-600 rounded-lg shadow-xl text-sm">
                <p className="font-bold text-gray-900 dark:text-gray-100 mb-2">Date: {label}</p>
                {payload.map((p: any, index: number) => (
                    p.payload[`learner${index + 1}Score`] && (<div key={p.dataKey} style={{ color: p.color }}><p className="font-semibold">{p.name}: {p.value}%</p><p className="text-xs text-gray-500 dark:text-gray-400 pl-2">Course: {p.payload[`learner${index + 1}Course`]}</p></div>)
                ))}
            </div>
        );
    } return null;
};

// FIX: Define a type for completed courses to help with TypeScript inference.
type CompletedCourse = {
    courseTitle: string;
    completionDate: Date;
    postAssessmentScore: number;
};

export const LearnerPerformance = ({ allData, selectedEmail, onLearnerSelect }: LearnerPerformanceProps) => {
    const [selectedEmail2, setSelectedEmail2] = useState('');
    const { theme } = useTheme();
    const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
    const gridColor = theme === 'dark' ? '#4A5568' : '#ccc';

    const uniqueLearners = useMemo(() => {
        const learnerMap = new Map<string, string>();
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

    const completedCoursesData = useMemo((): CompletedCourse[] => {
        if (!selectedEmail) return [];
        return allData.filter(d => d.email === selectedEmail && d.postAssessmentScore > 0).map(d => ({ courseTitle: d.courseTitle, completionDate: d.completionDate, postAssessmentScore: d.postAssessmentScore }));
    }, [selectedEmail, allData]);

    // FIX: Explicitly provide the generic type to `useDataTable` to fix a TypeScript inference issue.
    const courseTableHook = useDataTable<CompletedCourse>(completedCoursesData, 'completionDate', 5);

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
        { key: 'courseTitle' as const, label: 'Course Title' },
        { key: 'completionDate' as const, label: 'Completion Date', render: (item: CompletedCourse) => item.completionDate.toLocaleDateString() },
        { key: 'postAssessmentScore' as const, label: 'Score', render: (item: CompletedCourse) => `${item.postAssessmentScore}%` },
    ];

    const SortControls = () => {
        const { requestSort, sortConfig } = courseTableHook;
        const sortOptions = [ { label: 'Course', key: 'courseTitle' as const }, { label: 'Date', key: 'completionDate' as const }, { label: 'Score', key: 'postAssessmentScore' as const } ];
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

    return (
        <DashboardCard title="Learner Progress Over Time">
            <div className="flex flex-col h-full">
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LearnerSelector allLearners={uniqueLearners} selectedEmail={selectedEmail} onSelect={onLearnerSelect} label="Learner 1" placeholder="Select first learner..." />
                    <LearnerSelector allLearners={uniqueLearners} selectedEmail={selectedEmail2} onSelect={setSelectedEmail2} label="Learner 2 (Optional)" placeholder="Select second learner to compare..." />
                </div>
                <div className="flex-grow" style={{ minHeight: '300px' }}>
                    {(selectedEmail || selectedEmail2) && learnerChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={learnerChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                <XAxis dataKey="date" tick={{ fill: tickColor }} />
                                <YAxis domain={[0, 100]} tick={{ fill: tickColor }} unit="%"/>
                                <Tooltip content={<CustomTooltipContent />} />
                                <Legend wrapperStyle={{ color: tickColor }}/>
                                {selectedEmail && <Line connectNulls type="monotone" dataKey="learner1Score" name={selectedLearnerName} stroke="#0072BC" strokeWidth={2} />}
                                {selectedEmail2 && <Line connectNulls type="monotone" dataKey="learner2Score" name={selectedLearnerName2} stroke="#F58220" strokeWidth={2} />}
                                <ReferenceLine y={companyAverage} label={{ value: `Company Avg (${companyAverage.toFixed(1)}%)`, fill: tickColor, position: 'insideTopLeft' }} stroke="#dc3545" strokeDasharray="3 3" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">{selectedEmail ? 'No data for this learner.' : 'Please select at least one learner to view their performance.'}</div>}
                </div>
                {selectedEmail && completedCoursesData.length > 0 && (
                    <div className="mt-8">
                        <h4 className="text-md font-bold text-brand-dark dark:text-white mb-4 flex items-center gap-x-3">
                            <span>Completed Courses for {selectedLearnerName}</span>
                            {isTopPerformer && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 ring-1 ring-inset ring-teal-200 dark:ring-teal-800"><Star className="h-3 w-3 mr-1.5 text-yellow-500" fill="currentColor" />Top Performer</span>}
                        </h4>
                        <div className="flex justify-between items-center mb-3">
                            <SortControls />
                            <button onClick={handleExport} className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600" aria-label="Export completed courses to CSV">
                                <FileSpreadsheet className="h-4 w-4 mr-2" />Export CSV
                            </button>
                        </div>
                        <DataTable hook={courseTableHook} columns={courseTableColumns} rowClassName={() => isTopPerformer ? 'bg-teal-50 dark:bg-teal-950 hover:bg-teal-100 dark:hover:bg-teal-900' : '' }/>
                    </div>
                )}
            </div>
        </DashboardCard>
    );
};