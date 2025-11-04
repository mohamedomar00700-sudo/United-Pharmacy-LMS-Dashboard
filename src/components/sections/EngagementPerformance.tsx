import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ReferenceLine, Label, ResponsiveContainer } from 'recharts';
import { DashboardCard } from '../DashboardCard';
import { TrainingRecord } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface EngagementPerformanceProps {
    data: TrainingRecord[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return <div className="bg-white dark:bg-gray-800 p-2 border dark:border-gray-600 rounded shadow-lg text-sm"><p className="font-bold text-gray-800 dark:text-gray-100">{data.name}</p><p className="text-gray-700 dark:text-gray-300">{`Engagement (Hours): ${data.x.toFixed(1)}`}</p><p className="text-gray-700 dark:text-gray-300">{`Performance (Score): ${data.y.toFixed(1)}%`}</p></div>;
  } return null;
};

export const EngagementPerformance = ({ data }: EngagementPerformanceProps) => {
    const { theme } = useTheme();
    const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
    const gridColor = theme === 'dark' ? '#4A5568' : '#ccc';
    
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

    if (data.length === 0) return <DashboardCard title="Engagement vs. Performance"><div className="text-center p-8 text-gray-500 dark:text-gray-400">No data available for the selected filters.</div></DashboardCard>;

    return (
        <DashboardCard title="Engagement vs. Performance Correlation">
            <div style={{ width: '100%', height: 450 }} className="relative">
                 <div className="absolute top-[10%] left-[55%] text-center text-xs text-success font-bold opacity-80"><p>High Achievers</p><p>(High Perf / High Eng.)</p></div>
                 <div className="absolute bottom-[15%] left-[55%] text-center text-xs text-warning font-bold opacity-80"><p>Need Support</p><p>(Low Perf / High Eng.)</p></div>
                 <div className="absolute top-[10%] right-[55%] text-center text-xs text-brand-primary font-bold opacity-80"><p>Efficient</p><p>(High Perf / Low Eng.)</p></div>
                 <div className="absolute bottom-[15%] right-[55%] text-center text-xs text-danger font-bold opacity-80"><p>Need Motivation</p><p>(Low Perf / Low Eng.)</p></div>
                <ResponsiveContainer>
                    <ScatterChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
                        <CartesianGrid stroke={gridColor} strokeDasharray="3 3"/>
                        <XAxis type="number" dataKey="x" name="Training Hours" unit="h" label={{ value: 'Total Training Hours (Engagement)', position: 'insideBottom', offset: -15, fill: tickColor }} tick={{ fill: tickColor }} />
                        <YAxis type="number" dataKey="y" name="Avg. Score" unit="%" domain={[0, 100]} label={{ value: 'Avg. Post-Assessment Score (Performance)', angle: -90, position: 'insideLeft', fill: tickColor, dy: 100 }} tick={{ fill: tickColor }} />
                        <ZAxis type="number" dataKey="z" range={[50, 400]} />
                        <ReferenceLine y={avgPerformance} stroke={tickColor} strokeDasharray="4 4"><Label value="Avg. Perf." position="right" fill={tickColor} fontSize={10}/></ReferenceLine>
                        <ReferenceLine x={avgEngagement} stroke={tickColor} strokeDasharray="4 4"><Label value="Avg. Eng." position="top" fill={tickColor} fontSize={10}/></ReferenceLine>
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                        <Scatter name="Learners" data={scatterData} fill="#0072BC" shape="circle" fillOpacity={0.6}/>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </DashboardCard>
    );
};
