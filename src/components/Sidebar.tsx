import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Section {
    id: string;
    name: string;
    icon: LucideIcon;
}

interface SidebarProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
    sections: Section[];
}

export const Sidebar = ({ activeSection, setActiveSection, sections }: SidebarProps) => {
    
    return (
        <aside className="w-64 bg-brand-dark text-white flex-col hidden sm:flex">
            <div className="p-4 border-b border-gray-700">
                <img src="/logo.jpg" alt="United Pharmacy Logo" className="w-full h-auto" />
            </div>
            <nav className="flex-1 p-4">
                <ul>
                    {sections.map(section => (
                        <li key={section.id}>
                            <button 
                                onClick={() => setActiveSection(section.id)} 
                                className={`w-full text-left flex items-center space-x-3 p-3 my-1 rounded-md transition-all duration-200 ${activeSection === section.id ? 'bg-brand-primary text-white shadow-md' : 'hover:bg-blue-900/50'}`}
                            >
                                <section.icon className="h-5 w-5" />
                                <span>{section.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-blue-900/50 text-center text-xs text-gray-400">
                <p>&copy; 2024 United Pharmacy</p>
            </div>
        </aside>
    );
};