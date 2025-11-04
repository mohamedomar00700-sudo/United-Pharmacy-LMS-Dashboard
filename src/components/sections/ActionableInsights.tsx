import React, { useState, useMemo } from 'react';
import { DashboardCard } from '../DashboardCard';
import { useDataTable } from '../../hooks/useDataTable';
import { DataTable } from '../DataTable';
import { TrainingRecord } from '../../types';
import { Trophy } from 'lucide-react';

interface ActionableInsightsProps {
    data: TrainingRecord[];
    allData: TrainingRecord[];
    onTraineeSelect: (email: string) => void;
}

const DEFAULT_THRESHOLDS = { AT_RISK_COMPLETION: 30, AT_RISK_SCORE: 50, COURSE_ATTENTION_COMPLETION: 60, COURSE_ATTENTION_SCORE: 60 };

const RankCell = ({ rank }: { rank: number }) => {
    const rankColors = ["text-yellow-400", "text-gray-400", "text-orange-400"];
    if (rank <= 3) return <Trophy className={`h-6 w-6 ${rankColors[rank - 1]}`} fill="currentColor" aria-label={`Rank ${rank}`} />;
    return <span className="font-bold text-lg text-gray-500 dark:text-gray-400 w-6 text-center">{rank}</span>;
};

const ThresholdInput = ({ label, name, value, onChange }: {label: string, name: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}) => (
    <div>
        <label htmlFor={name} className="block text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
        <div className="relative mt-1">
            <input type="number" id={name} name={name} value={value} onChange={onChange} className="w-24 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">%</span></div>
        </div>
    </div>
);

export const ActionableInsights = ({ data, onTraineeSelect }: ActionableInsightsProps) => {
    const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
    const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
        const { name, value } = e.target; 
        setThresholds(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 })); 
    };

    const atRiskTrainees = useMemo(() => {
        const riskMap = new Map<string, { trainee: TrainingRecord, reasons: string[] }>();
        data.forEach(record => {
            const reasons = [];
            if (record.completionRate < thresholds.AT_RISK_COMPLETION) reasons.push(`Completion < ${thresholds.AT_RISK_COMPLETION}%`);
            if (record.postAssessmentScore > 0 && record.postAssessmentScore < thresholds.AT_RISK_SCORE) reasons.push(`Score < ${thresholds.AT_RISK_SCORE}%`);
            if (reasons.length > 0) { 
                if (!riskMap.has(record.traineeName)) riskMap.set(record.traineeName, { trainee: record, reasons: [] }); 
                riskMap.get(record.traineeName)!.reasons.push(...reasons.map(r => `${r} on '${record.courseTitle}'`)); 
            }
        });
        return Array.from(riskMap.values());
    }, [data, thresholds]);

    const coursesNeedingAttention = useMemo(() => {
        const courseStats: {[key: string]: { totalCompletion: number, totalScore: number, scoreCount: number, recordCount: number, learners: Set<string> }} = {};
        data.forEach(record => { 
            if (!courseStats[record.courseTitle]) courseStats[record.courseTitle] = { totalCompletion: 0, totalScore: 0, scoreCount: 0, recordCount: 0, learners: new Set() }; 
            const stats = courseStats[record.courseTitle]; 
            stats.totalCompletion += record.completionRate; 
            stats.recordCount++; 
            stats.learners.add(record.traineeName); 
            if (record.postAssessmentScore > 0) { 
                stats.totalScore += record.postAssessmentScore; 
                stats.scoreCount++; 
            } 
        });
        return Object.entries(courseStats).map(([title, stats]) => ({ 
            title, 
            avgCompletion: parseFloat((stats.totalCompletion / stats.recordCount).toFixed(1)), 
            avgScore: stats.scoreCount > 0 ? parseFloat((stats.totalScore / stats.scoreCount).toFixed(1)) : 0, 
            learnerCount: stats.learners.size 
        })).filter(course => course.avgCompletion < thresholds.COURSE_ATTENTION_COMPLETION || (course.avgScore > 0 && course.avgScore < thresholds.COURSE_ATTENTION_SCORE));
    }, [data, thresholds]);

    const topImprovers = useMemo(() => {
        const improverStats: {[key: string]: { name: string, totalImprovement: number, courseCount: number }} = {};
        data.forEach(record => { 
            if (record.preAssessmentScore > 0 && record.postAssessmentScore > 0 && record.email) { 
                if (!improverStats[record.email]) improverStats[record.email] = { name: record.traineeName, totalImprovement: 0, courseCount: 0 }; 
                const improvement = ((record.postAssessmentScore - record.preAssessmentScore) / record.preAssessmentScore) * 100; 
                if (improvement > 0) { 
                    improverStats[record.email].totalImprovement += improvement; 
                    improverStats[record.email].courseCount++; 
                } 
            } 
        });
        return Object.entries(improverStats)
            .filter(([, stats]) => stats.courseCount > 0)
            .map(([email, stats]) => ({ 
                email, 
                name: stats.name, 
                avgImprovement: parseFloat((stats.totalImprovement / stats.courseCount).toFixed(1)), 
            }))
            .sort((a, b) => b.avgImprovement - a.avgImprovement)
            .map((trainee, index) => ({ ...trainee, rank: index + 1 }));
    }, [data]);

    const topPerformingCourses = useMemo(() => {
        const courseStats: {[key:string]: { totalCompletion: number, totalScore: number, scoreCount: number, recordCount: number }} = {};
        data.forEach(record => { 
            if (!courseStats[record.courseTitle]) courseStats[record.courseTitle] = { totalCompletion: 0, totalScore: 0, scoreCount: 0, recordCount: 0 }; 
            const stats = courseStats[record.courseTitle]; 
            stats.totalCompletion += record.completionRate; 
            stats.recordCount++; 
            if (record.postAssessmentScore > 0) { 
                stats.totalScore += record.postAssessmentScore; 
                stats.scoreCount++; 
            } 
        });
        return Object.entries(courseStats).map(([title, stats]) => { 
            const avgCompletion = stats.recordCount > 0 ? (stats.totalCompletion / stats.recordCount) : 0; 
            const avgScore = stats.scoreCount > 0 ? (stats.totalScore / stats.scoreCount) : 0; 
            const performanceScore = (avgCompletion * 0.6) + (avgScore * 0.4); 
            return { title, avgCompletion, avgScore, performanceScore, recordCount: stats.recordCount }; 
        }).sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5).map((course, index) => ({ ...course, rank: index + 1}));
    }, [data]);
    
    const atRiskTraineesData = useMemo(() => atRiskTrainees.map(item => ({ 
        traineeName: item.trainee.traineeName, 
        branch: item.trainee.branch, 
        supervisor: item.trainee.supervisor, 
        reasons: item.reasons.join('; '), 
        email: item.trainee.email 
    })), [atRiskTrainees]);

    const atRiskTableHook = useDataTable(atRiskTraineesData);
    const coursesTableHook = useDataTable(coursesNeedingAttention, 'avgCompletion');
    const topImproversHook = useDataTable(topImprovers, 'avgImprovement');
    const topCoursesHook = useDataTable(topPerformingCourses, 'performanceScore');

    const atRiskColumns = [ 
        { key: 'traineeName' as const, label: 'Trainee' }, 
        { key: 'branch' as const, label: 'Branch' }, 
        { key: 'supervisor' as const, label: 'Supervisor' }, 
        { key: 'reasons' as const, label: 'Reason(s)', render: (item: typeof atRiskTraineesData[0]) => <ul className="list-disc list-inside space-y-1 text-sm">{item.reasons.split('; ').slice(0, 2).map((reason, i) => <li key={i}>{reason}</li>)}{item.reasons.split('; ').length > 2 && <li className="text-xs text-gray-500">...and {item.reasons.split('; ').length - 2} more</li>}</ul> }, 
        { key: 'email' as const, label: 'Actions', render: (item: typeof atRiskTraineesData[0]) => <div><button onClick={() => onTraineeSelect(item.email)} className="px-2.5 py-1 text-xs font-semibold text-brand-primary bg-blue-100 dark:bg-blue-900/50 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors" title={`View details for ${item.traineeName}`}>View Details</button></div> } 
    ];
    const coursesColumns = [ 
        { key: 'title' as const, label: 'Course Title' }, 
        { key: 'avgCompletion' as const, label: 'Avg Completion', render: (item: typeof coursesNeedingAttention[0]) => <span className={item.avgCompletion < thresholds.COURSE_ATTENTION_COMPLETION ? 'text-danger font-semibold' : ''}>{item.avgCompletion.toFixed(1)}%</span> }, 
        { key: 'avgScore' as const, label: 'Avg Score', render: (item: typeof coursesNeedingAttention[0]) => <span className={item.avgScore > 0 && item.avgScore < thresholds.COURSE_ATTENTION_SCORE ? 'text-danger font-semibold' : ''}>{item.avgScore.toFixed(1)}%</span> }, 
        { key: 'learnerCount' as const, label: 'Learners' } 
    ];
    const topImproversColumns = [ 
        { key: 'rank' as const, label: 'Rank', render: (item: typeof topImprovers[0]) => <RankCell rank={item.rank} /> }, 
        { key: 'name' as const, label: 'Trainee' }, 
        { key: 'avgImprovement' as const, label: 'Avg. Improvement', render: (item: typeof topImprovers[0]) => <span className="font-semibold text-success">+{item.avgImprovement.toFixed(1)}%</span> } 
    ];
    const topCoursesColumns = [ 
        { key: 'rank' as const, label: 'Rank', render: (item: typeof topPerformingCourses[0]) => <RankCell rank={item.rank} /> }, 
        { key: 'title' as const, label: 'Course Title' }, 
        { key: 'avgCompletion' as const, label: 'Avg Completion', render: (item: typeof topPerformingCourses[0]) => <span className="font-semibold text-green-600 dark:text-green-400">{item.avgCompletion.toFixed(1)}%</span> }, 
        { key: 'avgScore' as const, label: 'Avg Score', render: (item: typeof topPerformingCourses[0]) => <span className="font-semibold text-green-600 dark:text-green-400">{item.avgScore.toFixed(1)}%</span> } 
    ];

    if (data.length === 0) return <DashboardCard title="Actionable Insights"><div className="text-center p-8 text-gray-500 dark:text-gray-400">No data available for the selected filters.</div></DashboardCard>;
    
    return (
        <div className="space-y-6">
            <DashboardCard title="At-Risk Trainees">
                <div className="p-4 mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-3">Insight Thresholds</h4>
                    <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
                        <ThresholdInput label="At-Risk Completion" name="AT_RISK_COMPLETION" value={thresholds.AT_RISK_COMPLETION} onChange={handleThresholdChange} />
                        <ThresholdInput label="At-Risk Score" name="AT_RISK_SCORE" value={thresholds.AT_RISK_SCORE} onChange={handleThresholdChange} />
                        <ThresholdInput label="Course Attention Completion" name="COURSE_ATTENTION_COMPLETION" value={thresholds.COURSE_ATTENTION_COMPLETION} onChange={handleThresholdChange} />
                        <ThresholdInput label="Course Attention Score" name="COURSE_ATTENTION_SCORE" value={thresholds.COURSE_ATTENTION_SCORE} onChange={handleThresholdChange} />
                    </div>
                </div>
                <DataTable hook={atRiskTableHook} columns={atRiskColumns} />
            </DashboardCard>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <DashboardCard title="Courses Needing Attention"><DataTable hook={coursesTableHook} columns={coursesColumns} /></DashboardCard>
                <DashboardCard title="Top Improvers (Pre vs Post Score)"><DataTable hook={topImproversHook} columns={topImproversColumns} /></DashboardCard>
                <DashboardCard title="Top Performing Courses" className="xl:col-span-2"><DataTable hook={topCoursesHook} columns={topCoursesColumns} /></DashboardCard>
            </div>
        </div>
    );
};
