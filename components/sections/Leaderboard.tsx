import React, { useMemo } from 'react';
import { TrainingRecord } from '../../types';
import { DashboardCard } from '../DashboardCard';
import { DataTable, Column } from '../DataTable';
import { Trophy } from 'lucide-react';
import useDataTable from '../../hooks/useDataTable';

const RankCell: React.FC<{ rank: number }> = ({ rank }) => {
    const rankColors = [
        "text-yellow-400", // Gold
        "text-gray-400",   // Silver
        "text-orange-400"  // Bronze
    ];
    if (rank <= 3) {
        return <Trophy className={`h-6 w-6 ${rankColors[rank - 1]}`} fill="currentColor" aria-label={`Rank ${rank}`} />;
    }
    return <span className="font-bold text-lg text-gray-500 dark:text-gray-400 w-6 text-center">{rank}</span>;
};

const ProgressBarCell: React.FC<{ value: number }> = ({ value }) => {
    const getBarColor = (val: number) => {
        if (val >= 90) return 'bg-success';
        if (val >= 75) return 'bg-brand-primary';
        if (val >= 50) return 'bg-warning';
        return 'bg-danger';
    };

    return (
        <div className="flex items-center gap-x-3">
            <span className="font-semibold text-gray-800 dark:text-gray-100 w-16 text-right">{value.toFixed(1)}%</span>
            <div className="w-full bg-gray-200 rounded-full h-3.5 dark:bg-gray-600">
                <div
                    className={`${getBarColor(value)} h-3.5 rounded-full`}
                    style={{ width: `${value}%` }}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={100}
                ></div>
            </div>
        </div>
    );
};


export const Leaderboard: React.FC<{ data: TrainingRecord[], onTraineeSelect: (email: string) => void }> = ({ data, onTraineeSelect }) => {

    const topTrainees = useMemo(() => {
        const traineeScores: { [email: string]: { name: string; totalScore: number; count: number } } = {};
        data.forEach(d => {
            if (d.postAssessmentScore > 0 && d.email) {
                 if (!traineeScores[d.email]) {
                    traineeScores[d.email] = { name: d.traineeName, totalScore: 0, count: 0 };
                }
                traineeScores[d.email].totalScore += d.postAssessmentScore;
                traineeScores[d.email].count++;
            }
        });
        return Object.entries(traineeScores)
            .map(([email, { name, totalScore, count }]) => ({ 
                email,
                name, 
                avgScore: parseFloat((totalScore / count).toFixed(1)),
                courseInfo: `(${count} courses)`, // New searchable property
                courseCount: count,
            }))
            .sort((a, b) => b.avgScore - a.avgScore)
            .map((trainee, index) => ({ ...trainee, rank: index + 1 }));
    }, [data]);

    const topBranches = useMemo(() => {
        const branchRates: { [name: string]: { totalRate: number; count: number; trainees: Set<string> } } = {};
        data.forEach(d => {
            if (!branchRates[d.branch]) {
                branchRates[d.branch] = { totalRate: 0, count: 0, trainees: new Set() };
            }
            branchRates[d.branch].totalRate += d.completionRate;
            branchRates[d.branch].count++;
            branchRates[d.branch].trainees.add(d.traineeName);
        });
        return Object.entries(branchRates)
            .map(([name, { totalRate, count, trainees }]) => ({ 
                name, 
                avgRate: parseFloat((totalRate / count).toFixed(1)),
                traineeInfo: `(${trainees.size} trainees)`, // New searchable property
                traineeCount: trainees.size,
            }))
            .sort((a,b) => b.avgRate - a.avgRate)
            .map((branch, index) => ({ ...branch, rank: index + 1}));
    }, [data]);

    const topSupervisors = useMemo(() => {
        const supervisorRates: { [name: string]: { totalRate: number; count: number; trainees: Set<string> } } = {};
        data.forEach(d => {
            if (d.supervisor) {
                 if (!supervisorRates[d.supervisor]) {
                    supervisorRates[d.supervisor] = { totalRate: 0, count: 0, trainees: new Set() };
                }
                supervisorRates[d.supervisor].totalRate += d.completionRate;
                supervisorRates[d.supervisor].count++;
                supervisorRates[d.supervisor].trainees.add(d.traineeName);
            }
        });
        return Object.entries(supervisorRates)
            .map(([name, { totalRate, count, trainees }]) => ({ 
                name, 
                avgRate: parseFloat((totalRate / count).toFixed(1)),
                traineeInfo: `(${trainees.size} trainees)`, // New searchable property
                traineeCount: trainees.size,
            }))
            .sort((a, b) => b.avgRate - a.avgRate)
            .map((supervisor, index) => ({ ...supervisor, rank: index + 1}));
    }, [data]);
    
    const traineeTableHook = useDataTable(topTrainees, 'avgScore', 5);
    const branchTableHook = useDataTable(topBranches, 'avgRate', 5);
    const supervisorTableHook = useDataTable(topSupervisors, 'avgRate', 5);


    type TraineeData = typeof topTrainees[number];
    const traineeColumns: Column<TraineeData>[] = [
        { key: 'rank', label: 'Rank', render: item => <RankCell rank={item.rank} /> },
        { 
            key: 'name', 
            label: 'Trainee',
            render: item => (
                <button onClick={() => onTraineeSelect(item.email)} className="text-left hover:underline text-brand-primary font-semibold">
                    {item.name}
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">{item.courseInfo}</span>
                </button>
            )
        },
        { 
            key: 'avgScore', 
            label: 'Average Score',
            render: item => <ProgressBarCell value={item.avgScore} />
        }
    ];

    type BranchData = typeof topBranches[number];
    const branchColumns: Column<BranchData>[] = [
        { key: 'rank', label: 'Rank', render: item => <RankCell rank={item.rank} /> },
        { 
            key: 'name', 
            label: 'Branch',
            render: item => (
                <span>
                    {item.name}
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{item.traineeInfo}</span>
                </span>
            )
        },
        { 
            key: 'avgRate', 
            label: 'Average Completion',
            render: item => <ProgressBarCell value={item.avgRate} />
        }
    ];

    type SupervisorData = typeof topSupervisors[number];
    const supervisorColumns: Column<SupervisorData>[] = [
        { key: 'rank', label: 'Rank', render: item => <RankCell rank={item.rank} /> },
        { 
            key: 'name', 
            label: 'Supervisor',
            render: item => (
                 <span>
                    {item.name}
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{item.traineeInfo}</span>
                </span>
            )
        },
        { 
            key: 'avgRate', 
            label: 'Team Average Completion',
            render: item => <ProgressBarCell value={item.avgRate} />
        }
    ];

    if (data.length === 0) return <div className="text-center p-8 text-gray-500 dark:text-gray-400">No data available for the selected filters.</div>;

    return (
        <div className="grid grid-cols-1 gap-8">
            <DashboardCard title="Top Trainees by Average Score">
                <DataTable
                    hook={traineeTableHook}
                    columns={traineeColumns}
                />
            </DashboardCard>
             <DashboardCard title="Top Branches by Completion Rate">
                <DataTable
                    hook={branchTableHook}
                    columns={branchColumns}
                />
            </DashboardCard>
             <DashboardCard title="Top Supervisors by Team Completion">
                 <DataTable
                    hook={supervisorTableHook}
                    columns={supervisorColumns}
                />
            </DashboardCard>
        </div>
    );
};