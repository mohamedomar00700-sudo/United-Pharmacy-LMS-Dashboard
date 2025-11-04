import React, { useMemo, useState } from 'react';
import { TrainingRecord, CourseType } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { DashboardCard } from '../DashboardCard';
import { useTheme } from '../../hooks/useTheme';
import { Filters } from '../Dashboard';

interface CourseAnalysisProps {
    data: TrainingRecord[];
    filters: Filters;
    setFilters: (filters: React.SetStateAction<Filters>) => void;
}
type LowPerfSortKey = 'completion' | 'score' | 'learners';


const getStatusColor = (value: number, thresholds = { low: 70, mid: 85 }) => {
    if (value < thresholds.low) return '#dc3545'; // danger
    if (value < thresholds.mid) return '#F58220'; // warning
    return '#00A99D'; // success
};

export const CourseAnalysis: React.FC<CourseAnalysisProps> = ({ data, filters, setFilters }) => {
    const { theme } = useTheme();
    const [lowPerfSortBy, setLowPerfSortBy] = useState<LowPerfSortKey>('completion');

    const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
    const gridColor = theme === 'dark' ? '#4A5568' : '#ccc';

    const courseData = useMemo(() => {
        const courses = [...new Set(data.map(item => item.courseTitle))];
        return courses.map(course => {
            const courseRecords = data.filter(item => item.courseTitle === course);
            if(courseRecords.length === 0) return null;
            const totalLearners = new Set(courseRecords.map(r => r.traineeName)).size;
            const avgCompletionRate = courseRecords.reduce((acc, curr) => acc + curr.completionRate, 0) / courseRecords.length;
            const avgQuizScore = courseRecords.reduce((acc, curr) => acc + curr.averageQuizScore, 0) / courseRecords.length;
            
            return {
                name: course,
                completion: avgCompletionRate,
                score: avgQuizScore,
                learners: totalLearners,
            };
        }).filter(Boolean) as {name: string, completion: number, score: number, learners: number}[];
    }, [data]);
    
    const courseTypeData = useMemo(() => {
        const mandatoryCount = new Set(data.filter(d => d.courseType === CourseType.Mandatory).map(d => d.id)).size;
        const optionalCount = new Set(data.filter(d => d.courseType === CourseType.Optional).map(d => d.id)).size;
        return [
            { name: CourseType.Mandatory, 'Training Records': mandatoryCount },
            { name: CourseType.Optional, 'Training Records': optionalCount },
        ];
    }, [data]);

    const handleCourseTypeClick = (payload: any) => {
        const clickedType = payload.name;
        if(!clickedType) return;

        const isAlreadyFiltered = filters.courseTypeFilter.length === 1 && filters.courseTypeFilter[0] === clickedType;

        if (isAlreadyFiltered) {
             setFilters(prev => ({...prev, courseTypeFilter: []}));
        } else {
             setFilters(prev => ({...prev, courseTypeFilter: [clickedType]}));
        }
    };

    const handleCourseClick = (payload: any) => {
        const clickedCourse = payload.name;
        if(!clickedCourse) return;
        
        const isAlreadyFiltered = filters.courseFilter.length === 1 && filters.courseFilter[0] === clickedCourse;

        if (isAlreadyFiltered) {
            setFilters(prev => ({ ...prev, courseFilter: [] }));
        } else {
            setFilters(prev => ({ ...prev, courseFilter: [clickedCourse] }));
        }
    };
    
    const topCourses = [...courseData].sort((a, b) => b.completion - a.completion).slice(0, 5);
    const lowPerformingCourses = [...courseData].sort((a, b) => a[lowPerfSortBy] - b[lowPerfSortBy]).slice(0, 5);
    const avgScoresPerCourse = [...courseData].sort((a, b) => b.score - a.score);

    if (data.length === 0) return <div className="text-center p-8 text-gray-500 dark:text-gray-400">No data available for the selected filters.</div>;

    const PIE_COLORS = ['#0072BC', '#F58220'];
    const lowPerfSortOptions: {id: LowPerfSortKey, label: string}[] = [
        {id: 'completion', label: 'Completion'},
        {id: 'score', label: 'Score'},
        {id: 'learners', label: 'Learners'},
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <DashboardCard title="Course Type Distribution" className="xl:col-span-1">
                 <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={courseTypeData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor}/>
                            <XAxis type="number" tick={{ fill: tickColor }}/>
                            <YAxis type="category" dataKey="name" tick={{ fill: tickColor }} />
                            <Tooltip formatter={(value) => [value, 'Records']} />
                            <Bar dataKey="Training Records" onClick={handleCourseTypeClick} maxBarSize={40}>
                                 {courseTypeData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                                        cursor="pointer"
                                        opacity={!filters.courseTypeFilter.length || filters.courseTypeFilter.includes(entry.name as CourseType) ? 1 : 0.4}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </DashboardCard>
            <DashboardCard title="Top 5 Courses by Completion" className="xl:col-span-1">
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={topCourses} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor}/>
                            <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fill: tickColor }}/>
                            <YAxis type="category" dataKey="name" tick={{ fill: tickColor }} />
                            <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                            <Bar dataKey="completion" name="Completion Rate" onClick={handleCourseClick} maxBarSize={30}>
                                {topCourses.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={getStatusColor(entry.completion)}
                                        cursor="pointer"
                                        opacity={!filters.courseFilter.length || filters.courseFilter.includes(entry.name) ? 1 : 0.4}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </DashboardCard>

            <DashboardCard 
                title="Low Performing Courses" 
                className="xl:col-span-1"
                actions={
                     <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sort by:</span>
                        {lowPerfSortOptions.map(opt => (
                            <button key={opt.id} onClick={() => setLowPerfSortBy(opt.id)} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${lowPerfSortBy === opt.id ? 'bg-brand-primary text-white shadow' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>{opt.label}</button>
                        ))}
                    </div>
                }>
                 <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={lowPerformingCourses} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis type="number" tick={{ fill: tickColor }} domain={[0, lowPerfSortBy === 'learners' ? 'auto' : 100]}/>
                            <YAxis type="category" dataKey="name" tick={{ fill: tickColor }} />
                            <Tooltip formatter={(value, name) => [`${(value as number).toFixed(1)}${name !== 'learners' ? '%' : ''}`, `Avg ${name}`]} />
                            <Bar dataKey={lowPerfSortBy} name={lowPerfSortBy} onClick={handleCourseClick} maxBarSize={30}>
                                 {lowPerformingCourses.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={getStatusColor(entry[lowPerfSortBy], lowPerfSortBy === 'learners' ? {low: 10, mid: 20} : {low: 60, mid: 75})}
                                        cursor="pointer"
                                        opacity={!filters.courseFilter.length || filters.courseFilter.includes(entry.name) ? 1 : 0.4}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </DashboardCard>
            
            <DashboardCard title="Average Scores per Course" className="lg:col-span-3">
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <BarChart data={avgScoresPerCourse} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor}/>
                            <XAxis type="number" domain={[0, 100]} tick={{ fill: tickColor }} unit="%"/>
                            <YAxis type="category" dataKey="name" tick={{ fill: tickColor }} />
                            <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Avg. Score']} />
                            <Bar dataKey="score" name="Avg. Score" onClick={handleCourseClick} maxBarSize={30}>
                                {avgScoresPerCourse.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.score, {low: 65, mid: 80})}
                                     cursor="pointer"
                                     opacity={!filters.courseFilter.length || filters.courseFilter.includes(entry.name) ? 1 : 0.4}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </DashboardCard>
        </div>
    );
};