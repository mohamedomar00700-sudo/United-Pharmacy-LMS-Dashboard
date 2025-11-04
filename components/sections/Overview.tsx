import React, { useMemo } from 'react';
import { TrainingRecord } from '../../types';
import { KpiCard } from '../KpiCard';
import { Users, CheckCircle, UserX, TrendingUp } from 'lucide-react';
import { Filters } from '../Dashboard';

interface OverviewProps {
    data: TrainingRecord[];
    allData: TrainingRecord[];
    onNavigate: (section: string, filters?: Partial<Filters>) => void;
}

// FIX: Made the getTrendData function generic and type-safe to support different numeric properties,
// including dynamically calculated ones like 'improvement'. This resolves the type error.
const getTrendData = <K extends string>(
    records: ({ completionDate: Date } & Record<K, number>)[],
    key: K,
    days = 30
) => {
    const sorted = [...records].sort((a,b) => a.completionDate.getTime() - b.completionDate.getTime());
    if (sorted.length < 2) return [];

    const trend = sorted.slice(-days).map(d => ({ value: d[key] }));
    // Ensure we have at least 2 data points for a line
    return trend.length > 1 ? trend : [];
}

export const Overview: React.FC<OverviewProps> = ({ data, allData, onNavigate }) => {

    const companyAvgs = useMemo(() => {
        if (allData.length === 0) {
            return {
                avgCompletion: 0,
            };
        }
        const avgCompletion = allData.reduce((acc, curr) => acc + curr.completionRate, 0) / allData.length;
        return { avgCompletion };
    }, [allData]);

    const stats = useMemo(() => {
        if (data.length === 0) {
            return {
                totalLearners: 0,
                avgCompletion: 0,
                activeLearners: 0,
                inactiveLearners: 0,
                improvement: 0,
                avgCompletionChange: { text: 'N/A', color: 'text-gray-500 dark:text-gray-400' as const },
                sparklines: {
                    learners: [],
                    completion: [],
                    improvement: [],
                }
            };
        }

        const totalLearners = new Set(data.map(d => d.traineeName)).size;
        const avgCompletion = data.reduce((acc, curr) => acc + curr.completionRate, 0) / data.length;
        const activeLearners = new Set(data.filter(d => d.completionRate > 0).map(d => d.traineeName)).size;
        
        const completedTrainings = data.filter(d => d.postAssessmentScore > 0);
        const preScores = completedTrainings.reduce((acc, curr) => acc + curr.preAssessmentScore, 0);
        const postScores = completedTrainings.reduce((acc, curr) => acc + curr.postAssessmentScore, 0);
        const improvement = preScores > 0 ? ((postScores - preScores) / preScores) * 100 : 0;
        
        const diff = avgCompletion - companyAvgs.avgCompletion;
        const changeText = diff.toFixed(1) === '0.0' ? 'Matches company avg' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}% vs company avg`;
        const changeColor = diff > 0.1 ? 'text-success' : diff < -0.1 ? 'text-danger' : 'text-gray-500 dark:text-gray-400';
        
        const sparklines = {
            learners: getTrendData(data, 'id'),
            completion: getTrendData(data, 'completionRate'),
            improvement: getTrendData(data.map(d => ({...d, improvement: d.preAssessmentScore > 0 ? ((d.postAssessmentScore - d.preAssessmentScore)/d.preAssessmentScore)*100 : 0})), 'improvement')
        };


        return {
            totalLearners,
            avgCompletion: Math.round(avgCompletion),
            activeLearners,
            inactiveLearners: totalLearners - activeLearners,
            improvement: Math.round(improvement),
            avgCompletionChange: { text: changeText, color: changeColor as 'text-success' | 'text-danger' | 'text-gray-500 dark:text-gray-400' },
            sparklines,
        };
    }, [data, companyAvgs]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard 
                title="Total Learners" 
                value={stats.totalLearners} 
                icon={<Users className="text-brand-primary" />} 
                tooltip="Total unique trainees. Click to view leaderboards."
                onClick={() => onNavigate('leaderboard')}
                sparklineData={stats.sparklines.learners}
            />
            <KpiCard 
                title="Average Completion Rate" 
                value={`${stats.avgCompletion}%`} 
                icon={<CheckCircle className="text-success" />} 
                change={stats.avgCompletionChange.text}
                changeColor={stats.avgCompletionChange.color}
                tooltip="The average completion rate for all training records."
                sparklineData={stats.sparklines.completion}
            />
            <KpiCard 
                title="Active vs Inactive Learners" 
                value={`${stats.activeLearners} / ${stats.inactiveLearners}`} 
                icon={<UserX className="text-warning" />} 
                tooltip="Active learners have a completion rate > 0%. Click to view at-risk trainees."
                onClick={() => onNavigate('actionable-insights')}
            />
            <KpiCard 
                title="% Improvement" 
                value={`${stats.improvement}%`} 
                icon={<TrendingUp className="text-brand-secondary" />} 
                change={`Pre vs Post Assessment`} 
                changeColor='text-success'
                tooltip="The average percentage improvement between pre and post-assessment scores."
                sparklineData={stats.sparklines.improvement}
            />
        </div>
    );
};
