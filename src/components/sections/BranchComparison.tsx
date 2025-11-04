import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import { DashboardCard } from '../DashboardCard';
import { TrainingRecord } from '../../types';
import { useTheme } from '../../hooks/useTheme';

// Define more specific types for props
interface Filters {
    branchFilter: string[];
}
interface BranchComparisonProps {
    data: TrainingRecord[];
    allData: TrainingRecord[];
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<any>>;
}

export const BranchComparison = ({ data, allData, filters, setFilters }: BranchComparisonProps) => {
    const { theme } = useTheme();
    const [viewType, setViewType] = useState('all');
    const [sortBy, setSortBy] = useState('completionRate');
    
    const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
    const gridColor = theme === 'dark' ? '#374151' : '#E5E7EB';

    const CustomTooltip = ({ active, payload, label, companyAvgs }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-white dark:bg-gray-800 p-3 border dark:border-gray-600 rounded-lg shadow-xl text-sm transition-all">
            <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">{label}</p><p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{data.recordCount} training records</p>
            <p className="text-brand-primary font-semibold">{`Completion Rate: ${data.completionRate.toFixed(1)}%`}</p><p className="text-brand-secondary font-semibold">{`Avg. Quiz Score: ${data.quizScore.toFixed(1)}%`}</p>
            <div className="border-t dark:border-gray-700 mt-2 pt-2 text-xs"><p className="text-gray-600 dark:text-gray-300">Company Avg Completion: {companyAvgs.completion.toFixed(1)}%</p><p className="text-gray-600 dark:text-gray-300">Company Avg Score: {companyAvgs.score.toFixed(1)}%</p></div>
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
        const branchMap = new Map<string, { completionTotal: number, scoreTotal: number, recordCount: number }>();
        data.forEach(item => {
            if (!item.branch) return;
            if (!branchMap.has(item.branch)) branchMap.set(item.branch, { completionTotal: 0, scoreTotal: 0, recordCount: 0 });
            const stats = branchMap.get(item.branch)!;
            stats.completionTotal += item.completionRate;
            stats.scoreTotal += item.averageQuizScore;
            stats.recordCount++;
        });
        const aggregatedData = Array.from(branchMap.entries()).map(([branch, stats]) => ({ name: branch, displayName: branch.replace(/ Pharmacy| Pharma| Health| Meds| Drugs/g, ''), completionRate: stats.recordCount > 0 ? stats.completionTotal / stats.recordCount : 0, quizScore: stats.recordCount > 0 ? stats.scoreTotal / stats.recordCount : 0, recordCount: stats.recordCount }));
        const sortedData = aggregatedData.sort((a, b) => (b[sortBy as keyof typeof b] as number) - (a[sortBy as keyof typeof a] as number));
        
        if(viewType === 'top5') return sortedData.slice(0, 5);
        if(viewType === 'bottom5') return sortedData.slice(-5);
        return sortedData;
    }, [data, viewType, sortBy]);

    const chartKey = useMemo(() => `${viewType}-${sortBy}-${JSON.stringify(filters)}-${branchData.map(d => `${d.name}:${d.completionRate.toFixed(0)}`).join(',')}`, [branchData, viewType, sortBy, filters]);

    const handleBarClick = (payload: any) => {
        if (!payload || !payload.name) return;
        const clickedBranch = payload.name;
        const isAlreadyFiltered = filters.branchFilter.length === 1 && filters.branchFilter[0] === clickedBranch;
        setFilters((prev: any) => ({ ...prev, branchFilter: isAlreadyFiltered ? [] : [clickedBranch] }));
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