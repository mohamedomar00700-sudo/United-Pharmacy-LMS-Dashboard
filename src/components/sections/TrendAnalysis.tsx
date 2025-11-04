import React, { useState, useMemo } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { DashboardCard } from '../DashboardCard';
import { TrainingRecord } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface TrendAnalysisProps {
    data: TrainingRecord[];
}

export const TrendAnalysis = ({ data }: TrendAnalysisProps) => {
    const { theme } = useTheme();
    const [showMA, setShowMA] = useState(true);
    const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
    const gridColor = theme === 'dark' ? '#4A5568' : '#ccc';

    const calculateMovingAverage = (data: any[], windowSize: number) => {
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
        const sortedTrends = Object.entries(trends)
            .map(([month, values]) => ({ 
                month, 
                avgCompletion: values.totalCompletion / values.count, 
                trainingHours: values.totalHours 
            }))
            .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
        return calculateMovingAverage(sortedTrends, 3);
    }, [data]);

    if (data.length === 0) return <DashboardCard title="Trend Analysis"><div className="text-center p-8 text-gray-500 dark:text-gray-400">No data available for the selected filters.</div></DashboardCard>;

    const completionActions = (
        <label className="flex items-center space-x-2 cursor-pointer text-sm">
            <input type="checkbox" checked={showMA} onChange={() => setShowMA(!showMA)} className="rounded text-brand-primary focus:ring-brand-primary" />
            <span className="text-gray-600 dark:text-gray-300">Show 3-Month MA</span>
        </label>
    );

    const renderChartOrMessage = (chart: React.ReactNode) => {
        if (monthlyData.length < 2) {
            return (
                <div className="flex items-center justify-center h-full min-h-[300px] text-center text-gray-500 dark:text-gray-400">
                    <div>
                        <h4 className="font-semibold text-lg">Not Enough Data for a Trend</h4>
                        <p className="text-sm mt-1">A trend line requires data from at least two different time points (e.g., two months).<br/> Please adjust your filters or check your data source.</p>
                    </div>
                </div>
            );
        }
        return <div style={{ width: '100%', height: 400 }}>{chart}</div>;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard title="Completion Rate Over Time" actions={completionActions}>
                {renderChartOrMessage(
                    <ResponsiveContainer>
                        <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="month" tick={{ fill: tickColor }} />
                            <YAxis domain={[0, 100]} unit="%" tick={{ fill: tickColor }} />
                            <Tooltip formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]} />
                            <Legend wrapperStyle={{ color: tickColor, paddingTop: '10px' }} />
                            <Line type="monotone" dataKey="avgCompletion" name="Avg Completion Rate" stroke="#0072BC" strokeWidth={2} dot={monthlyData.length < 2}/>
                            <Brush dataKey="month" height={30} stroke="#8884d8" y={320} travellerWidth={20} />
                            {showMA && <Line type="monotone" dataKey="movingAverage" name="3-Month Moving Avg" stroke="#00A99D" strokeWidth={2} strokeDasharray="5 5" dot={false}/>}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </DashboardCard>
            <DashboardCard title="Total Training Hours Over Time">
                {renderChartOrMessage(
                    <ResponsiveContainer>
                        <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor}/>
                            <XAxis dataKey="month" tick={{ fill: tickColor }} />
                            <YAxis tick={{ fill: tickColor }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ color: tickColor, paddingTop: '10px' }} />
                            <Line type="monotone" dataKey="trainingHours" name="Total Training Hours" stroke="#F58220" strokeWidth={2} dot={monthlyData.length < 2}/>
                            <Brush dataKey="month" height={30} stroke="#8884d8" y={320} travellerWidth={20} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </DashboardCard>
        </div>
    );
};
