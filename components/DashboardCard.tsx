import React from 'react';

interface DashboardCardProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    actions?: React.ReactNode;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ title, children, className = "", actions }) => {
    return (
        <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-all hover:shadow-lg dark:border dark:border-gray-700 ${className}`}>
            <div className="flex justify-between items-center mb-4 border-b dark:border-gray-600 pb-2">
                <h3 className="text-lg font-bold text-brand-dark dark:text-white">{title}</h3>
                {actions && <div className="flex items-center space-x-2">{actions}</div>}
            </div>
            <div className="h-full">{children}</div>
        </div>
    );
};