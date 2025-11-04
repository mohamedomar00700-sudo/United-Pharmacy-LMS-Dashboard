import React, { useState, useMemo } from 'react';
import { DashboardCard } from '../DashboardCard';
import { TrainingRecord } from '../../types';
import { ChevronsRight, User as UserIcon, FileText as FileTextIcon } from 'lucide-react';

interface ComparisonToolProps {
    allData: TrainingRecord[];
    options: {
        branches: string[];
        districtHeads: string[];
        supervisors: string[];
    };
}

export const ComparisonTool = ({ allData, options }: ComparisonToolProps) => {
    const [groupA, setGroupA] = useState({ category: '', value: '' });
    const [groupB, setGroupB] = useState({ category: '', value: '' });

    const calculateKpis = (data: TrainingRecord[]) => {
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

    const getOptionsForCategory = (category: string) => {
        if (!category) return [];
        return { branch: options.branches, districtHead: options.districtHeads, supervisor: options.supervisors }[category as keyof typeof options] || [];
    };

    const handleCategoryChange = (setter: React.Dispatch<React.SetStateAction<{category: string, value: string}>>, e: React.ChangeEvent<HTMLSelectElement>) => setter({ category: e.target.value, value: '' });
    const handleValueChange = (setter: React.Dispatch<React.SetStateAction<{category: string, value: string}>>, e: React.ChangeEvent<HTMLSelectElement>) => setter(prev => ({ ...prev, value: e.target.value }));

    const { groupAData, groupBData } = useMemo(() => {
        const filterData = (group: {category: string, value: string}) => 
            !group.category || !group.value ? [] : allData.filter(item => item[group.category as keyof TrainingRecord] === group.value);
        return { groupAData: filterData(groupA), groupBData: filterData(groupB) };
    }, [allData, groupA, groupB]);

    const kpisA = useMemo(() => calculateKpis(groupAData), [groupAData]);
    const kpisB = useMemo(() => calculateKpis(groupBData), [groupBData]);

    const ComparisonRow = ({ label, valueA, valueB, format }: {label: string, valueA: number, valueB: number, format: (v: number) => string | number}) => {
        const isAGreater = valueA > valueB, isBGreater = valueB > valueA, isEqual = valueA === valueB && valueA !== 0;
        const getCellClass = (isWinner: boolean) => isWinner ? 'font-bold text-success' : isEqual ? 'font-semibold' : 'text-gray-600 dark:text-gray-400';
        return <tr className="border-b dark:border-gray-700"><td className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{label}</td><td className={`py-3 px-4 text-center ${getCellClass(isAGreater)}`}>{format(valueA)}</td><td className={`py-3 px-4 text-center ${getCellClass(isBGreater)}`}>{format(valueB)}</td></tr>;
    };

    const showResults = groupA.value && groupB.value;

    return (
        <DashboardCard title="Comparison Tool">
            <div>
                <h3 className="text-xl font-bold text-brand-dark dark:text-white mb-4">Comparison Setup</h3>
                <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-end">
                    <div className="md:col-span-5">
                        <h4 className="font-bold text-lg text-brand-primary mb-2">Group A</h4>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Compare By</label>
                                <select onChange={(e) => handleCategoryChange(setGroupA, e)} value={groupA.category} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"><option value="">Select Category...</option><option value="branch">Branch</option><option value="districtHead">District Head</option><option value="supervisor">Supervisor</option></select>
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Select Value</label>
                                <select onChange={(e) => handleValueChange(setGroupA, e)} value={groupA.value} disabled={!groupA.category} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm disabled:bg-gray-100 dark:disabled:bg-gray-700/50 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"><option value="">Select Value...</option>{getOptionsForCategory(groupA.category).map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:flex justify-center items-center md:col-span-1"><ChevronsRight className="h-8 w-8 text-gray-400 dark:text-gray-500" /></div>
                    <div className="md:col-span-5">
                        <h4 className="font-bold text-lg text-brand-secondary mb-2">Group B</h4>
                        <div className="flex flex-col sm:flex-row gap-4">
                             <div className="flex-1">
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Compare By</label>
                                <select onChange={(e) => handleCategoryChange(setGroupB, e)} value={groupB.category} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"><option value="">Select Category...</option><option value="branch">Branch</option><option value="districtHead">District Head</option><option value="supervisor">Supervisor</option></select>
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Select Value</label>
                                <select onChange={(e) => handleValueChange(setGroupB, e)} value={groupB.value} disabled={!groupB.category} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm disabled:bg-gray-100 dark:disabled:bg-gray-700/50 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"><option value="">Select Value...</option>{getOptionsForCategory(groupB.category).map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                {showResults ? (
                    <div>
                        <h3 className="text-xl font-bold text-brand-dark dark:text-white mb-4">Comparison Results</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h5 className="font-bold text-brand-primary">{groupA.value}</h5>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-700 dark:text-gray-300">
                                    <div className="flex items-center"><UserIcon className="h-4 w-4 mr-1.5"/> {kpisA.totalLearners} Learners</div>
                                    <div className="flex items-center"><FileTextIcon className="h-4 w-4 mr-1.5"/> {kpisA.recordCount} Records</div>
                                </div>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                                <h5 className="font-bold text-brand-secondary">{groupB.value}</h5>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-700 dark:text-gray-300">
                                    <div className="flex items-center"><UserIcon className="h-4 w-4 mr-1.5"/> {kpisB.totalLearners} Learners</div>
                                    <div className="flex items-center"><FileTextIcon className="h-4 w-4 mr-1.5"/> {kpisB.recordCount} Records</div>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead><tr className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700"><th className="py-3 px-4 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">Metric</th><th className="py-3 px-4 text-center text-sm font-semibold uppercase text-brand-primary">{groupA.value || 'Group A'}</th><th className="py-3 px-4 text-center text-sm font-semibold uppercase text-brand-secondary">{groupB.value || 'Group B'}</th></tr></thead>
                                <tbody>
                                    <ComparisonRow label="Total Learners" valueA={kpisA.totalLearners} valueB={kpisB.totalLearners} format={v => v} />
                                    <ComparisonRow label="Avg. Completion Rate" valueA={kpisA.avgCompletion} valueB={kpisB.avgCompletion} format={v => `${v.toFixed(1)}%`} />
                                    <ComparisonRow label="Avg. Post-Assessment Score" valueA={kpisA.avgPostScore} valueB={kpisB.avgPostScore} format={v => `${v.toFixed(1)}%`} />
                                    <ComparisonRow label="% Improvement (Pre/Post)" valueA={kpisA.improvement} valueB={kpisB.improvement} format={v => `${v.toFixed(1)}%`} />
                                    <ComparisonRow label="Total Training Hours" valueA={kpisA.totalHours} valueB={kpisB.totalHours} format={v => v.toFixed(1)} />
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : <div className="text-center py-8 text-gray-500 dark:text-gray-400">Please select two groups to compare.</div>}
            </div>
        </DashboardCard>
    );
};
