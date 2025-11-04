import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { FilterPanel } from './FilterPanel';
import { Overview } from './sections/Overview';
import { BranchComparison } from './sections/BranchComparison';
import { CourseAnalysis } from './sections/CourseAnalysis';
import { LearnerPerformance } from './sections/LearnerPerformance';
import { TrendAnalysis } from './sections/TrendAnalysis';
import { EngagementPerformance } from './sections/EngagementPerformance';
import { Leaderboard } from './sections/Leaderboard';
import { ActionableInsights } from './sections/ActionableInsights';
import { ComparisonTool } from './sections/ComparisonTool';
import { ThemeSwitcher } from './ThemeSwitcher';
import { ExportButton } from './ExportButton';
import { ExportCsvButton } from './ExportCsvButton';
import { fetchTrainingData } from '../services/googleSheetService';
import { CourseType, TrainingRecord } from '../types';
import { BookOpen, BarChart2, TrendingUp, Users, Target, GitCompareArrows, Trophy, ShieldAlert } from 'lucide-react';

export const Dashboard = () => {
    const [activeSection, setActiveSection] = useState('overview');
    const [allData, setAllData] = useState<TrainingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const exportRef = useRef(null);
    const [selectedLearnerEmail, setSelectedLearnerEmail] = useState('');
    const [filters, setFilters] = useState({ 
        branchFilter: [] as string[], 
        districtHeadFilter: [] as string[], 
        supervisorFilter: [] as string[], 
        courseFilter: [] as string[], 
        courseTypeFilter: [] as string[], 
        timePeriodFilter: { start: null as Date | null, end: null as Date | null } 
    });
    
    // IMPORTANT: Replace this with your own Google Sheet CSV export URL
    const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQjnqWHdBApU1MUf5dfFdy8Yscugy4Nkyn_jT5g9xH6yzA8a2tiiMjsB0gKYDJxq50iee-S72CFfiCv/pub?gid=0&single=true&output=csv';

    const sections = [ 
        { id: 'overview', name: 'Overview', icon: BarChart2 }, 
        { id: 'leaderboard', name: 'Leaderboards', icon: Trophy }, 
        { id: 'actionable-insights', name: 'Actionable Insights', icon: ShieldAlert }, 
        { id: 'branch-comparison', name: 'Branch Comparison', icon: GitCompareArrows }, 
        { id: 'comparison-tool', name: 'Comparison Tool', icon: Users }, 
        { id: 'course-analysis', name: 'Course Analysis', icon: BookOpen }, 
        { id: 'learner-performance', name: 'Learner Performance', icon: Target }, 
        { id: 'trend-analysis', name: 'Trend Analysis', icon: TrendingUp }, 
        { id: 'engagement-performance', name: 'Engagement vs Performance', icon: Users } 
    ];

    useEffect(() => {
        if (!GOOGLE_SHEET_CSV_URL) {
            setError("Google Sheet URL is not configured. Please see the instructions in the code to set it up.");
            setLoading(false); 
            return;
        }
        fetchTrainingData(GOOGLE_SHEET_CSV_URL).then(data => setAllData(data))
            .catch(err => { 
                console.error("Failed to fetch or parse data:", err); 
                setError("Failed to load data. Please check the Google Sheet URL and ensure it's a valid, publicly accessible CSV."); 
            })
            .finally(() => setLoading(false));
    }, []);

    const filterOptions = useMemo(() => {
        const branches = [...new Set(allData.map(d => d.branch))].filter(Boolean).sort();
        const districtHeads = [...new Set(allData.map(d => d.districtHead))].filter(Boolean).sort();
        const supervisors = [...new Set(allData.map(d => d.supervisor))].filter(Boolean).sort();
        const courses = [...new Set(allData.map(d => d.courseTitle))].filter(Boolean).sort();
        const courseTypes = Object.values(CourseType);
        return { branches, districtHeads, supervisors, courses, courseTypes };
    }, [allData]);

    const filteredData = useMemo(() => allData.filter(item => 
        (filters.branchFilter.length === 0 || filters.branchFilter.includes(item.branch)) &&
        (filters.districtHeadFilter.length === 0 || filters.districtHeadFilter.includes(item.districtHead)) &&
        (filters.supervisorFilter.length === 0 || filters.supervisorFilter.includes(item.supervisor)) &&
        (filters.courseFilter.length === 0 || filters.courseFilter.includes(item.courseTitle)) &&
        (filters.courseTypeFilter.length === 0 || filters.courseTypeFilter.includes(item.courseType)) &&
        (!filters.timePeriodFilter.start || item.completionDate >= filters.timePeriodFilter.start) &&
        (!filters.timePeriodFilter.end || item.completionDate <= filters.timePeriodFilter.end)
    ), [allData, filters]);
    
    const handleSelectLearnerAndNavigate = (email: string) => { 
        setSelectedLearnerEmail(email); 
        setActiveSection('learner-performance'); 
    };
    
    const handleNavigation = (section: string, newFilters?: Partial<typeof filters>) => { 
        if (newFilters) {
            setFilters(prev => ({...prev, ...newFilters}));
        }
        setActiveSection(section); 
    };

    const renderSection = () => {
        switch (activeSection) {
            case 'overview': return <Overview data={filteredData} allData={allData} onNavigate={handleNavigation} />;
            case 'leaderboard': return <Leaderboard data={filteredData} onTraineeSelect={handleSelectLearnerAndNavigate} />;
            case 'actionable-insights': return <ActionableInsights data={filteredData} allData={allData} onTraineeSelect={handleSelectLearnerAndNavigate} />;
            case 'branch-comparison': return <BranchComparison data={filteredData} allData={allData} filters={filters} setFilters={setFilters} />;
            case 'comparison-tool': return <ComparisonTool allData={allData} options={filterOptions} />;
            case 'course-analysis': return <CourseAnalysis data={filteredData} filters={filters} setFilters={setFilters} />;
            case 'learner-performance': return <LearnerPerformance allData={allData} selectedEmail={selectedLearnerEmail} onLearnerSelect={setSelectedLearnerEmail} />;
            case 'trend-analysis': return <TrendAnalysis data={filteredData} />;
            case 'engagement-performance': return <EngagementPerformance data={filteredData} />;
            default: return <Overview data={filteredData} allData={allData} onNavigate={handleNavigation}/>;
        }
    };

    if(loading) return <div className="flex justify-center items-center h-screen text-lg font-semibold text-brand-dark dark:text-brand-light">Loading Dashboard Data...</div>;
    
    return (
        <div className="flex h-screen">
            <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} sections={sections} />
            <main className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 overflow-y-auto">
                <header className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-20 flex justify-between items-center border-b dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-brand-dark dark:text-white">{sections.find(s => s.id === activeSection)?.name}</h1>
                    <div className="flex items-center space-x-2">
                        <ExportCsvButton data={filteredData} fileName={`${activeSection}_data_export`} />
                        <ExportButton elementRef={exportRef} fileName={activeSection} />
                        <ThemeSwitcher />
                    </div>
                </header>
                { !error && allData.length > 0 && activeSection !== 'comparison-tool' && <FilterPanel filters={filters} setFilters={setFilters} options={filterOptions} /> }
                <div ref={exportRef} className="p-4 md:p-6 lg:p-8 flex-1 bg-gray-100 dark:bg-gray-900">
                     {error ? (
                        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 border border-danger rounded-lg">
                            <h2 className="text-xl font-bold text-danger mb-2">Data Loading Error</h2>
                            <p className="text-gray-700 dark:text-gray-300">{error}</p>
                            <p className="mt-2 text-sm">Please refer to the setup instructions in <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded">src/components/Dashboard.tsx</code> to configure the Google Sheet URL.</p>
                        </div>
                     ) : renderSection()}
                </div>
            </main>
        </div>
    );
};
