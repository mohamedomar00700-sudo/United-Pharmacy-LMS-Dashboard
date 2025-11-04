import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface KpiCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: string;
    changeColor?: 'text-success' | 'text-danger' | 'text-gray-500 dark:text-gray-400';
    tooltip?: string;
    sparklineData?: { value: number }[];
    onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, change, changeColor, tooltip, sparklineData, onClick }) => {
    const cardContent = (
         <div 
            className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md flex items-center space-x-4 transition-all hover:shadow-lg hover:scale-105 dark:border dark:border-gray-700 w-full h-full"
            title={tooltip}
        >
            <div className="flex-shrink-0 bg-brand-light dark:bg-gray-700 p-3 rounded-full">
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-brand-dark dark:text-white">{value}</p>
                 {change && (
                    <p className={`text-sm font-semibold ${changeColor}`}>{change}</p>
                )}
            </div>
             {sparklineData && sparklineData.length > 1 && (
                <div className="w-24 h-12">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData}>
                            <Line type="monotone" dataKey="value" stroke={changeColor === 'text-success' ? '#00A99D' : changeColor === 'text-danger' ? '#dc3545' : '#8884d8'} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
    
    if (onClick) {
        return (
            <button onClick={onClick} className="w-full text-left">
                {cardContent}
            </button>
        );
    }

    return cardContent;
};