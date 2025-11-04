import React from 'react';
import { DashboardCard } from '../DashboardCard';

export const HowToUse: React.FC = () => {
    return (
        <div className="space-y-6">
            <DashboardCard title="Connecting Your Google Sheet Data">
                <p className="text-gray-700 dark:text-gray-300 font-semibold mb-2">
                    This dashboard is ready to connect to your live data from Google Sheets. Please follow these steps:
                </p>
                <ol className="list-decimal list-inside mt-4 space-y-3 text-gray-700 dark:text-gray-300">
                    <li>
                        <span className="font-bold">Publish your Google Sheet:</span>
                        <ul className="list-disc list-inside ml-6 mt-1 text-gray-600 dark:text-gray-400">
                            <li>Open your Google Sheet containing the LMS data.</li>
                            <li>Go to the menu: <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded">File &gt; Share &gt; Publish to web</code>.</li>
                            <li>In the dialog, under the 'Link' tab, select the specific sheet with your data (e.g., 'Sheet1').</li>
                            <li>In the dropdown next to it, choose <span className="font-bold">'Comma-separated values (.csv)'</span>.</li>
                            <li>Click the 'Publish' button and confirm.</li>
                            <li>Copy the generated public URL.</li>
                        </ul>
                    </li>
                    <li>
                        <span className="font-bold">Update the Dashboard configuration:</span>
                         <ul className="list-disc list-inside ml-6 mt-1 text-gray-600 dark:text-gray-400">
                             <li>In the project files, open: <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded">components/Dashboard.tsx</code>.</li>
                             <li>Find the constant named <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded">GOOGLE_SHEET_CSV_URL</code> near the top of the file.</li>
                             <li>Replace the placeholder text with the public URL you copied from Google Sheets.</li>
                             <li>Save the file. The dashboard will automatically reload with your live data.</li>
                         </ul>
                    </li>
                </ol>
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-warning text-yellow-800 dark:text-yellow-200 rounded-r-lg">
                    <p className="font-bold">Important Notes:</p>
                    <ul className="list-disc list-inside ml-4 mt-2 text-sm">
                        <li>The column headers in your Google Sheet must exactly match the expected format. The required columns are: <code className="text-xs">Trainee Name</code>, <code className="text-xs">Branch</code>, <code className="text-xs">District Head</code>, <code className="text-xs">Supervisor</code>, <code className="text-xs">Course Title</code>, <code className="text-xs">Completion Rate (%)</code>, <code className="text-xs">Pre-Assessment Score</code>, <code className="text-xs">Post-Assessment Score</code>, <code className="text-xs">Average Quiz Score</code>, <code className="text-xs">Course Type</code>, <code className="text-xs">Completion Date</code>, and <code className="text-xs">Training Hours</code>. The old <code className="text-xs">District Head / Supervisor</code> column is no longer used.</li>
                        <li>The simple data parser used in this dashboard assumes that your data fields (like course titles or names) do not contain commas.</li>
                         <li>Any changes you make to the data in your Google Sheet will be reflected in the dashboard upon the next page refresh.</li>
                    </ul>
                </div>
            </DashboardCard>

            <DashboardCard title="Using This Interactive Dashboard">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                    This dashboard is designed to provide powerful, at-a-glance insights into your training program's effectiveness. Here's how to navigate and use its features:
                </p>
                <h4 className="font-bold text-brand-dark dark:text-brand-light mt-4">1. Navigation Sidebar</h4>
                <p className="text-gray-600 dark:text-gray-400">
                    Use the sidebar on the left to switch between different analysis pages. Each page focuses on a specific aspect of the training data.
                </p>

                <h4 className="font-bold text-brand-dark dark:text-brand-light mt-4">2. Interactive Filters</h4>
                <p className="text-gray-600 dark:text-gray-400">
                    The filter panel at the top allows you to drill down into your data. You can filter by Branch, Supervisor, specific Courses, Course Type (Mandatory/Optional), and a date range. All charts and KPIs on the page will update automatically based on your selections.
                </p>
                
                <h4 className="font-bold text-brand-dark dark:text-brand-light mt-4">3. Understanding the Charts</h4>
                <ul className="list-disc list-inside mt-2 space-y-2 text-gray-600 dark:text-gray-400">
                    <li><strong>Bar Charts:</strong> Used for comparing metrics across different categories like branches or courses. Hover over the bars to see detailed values. Some charts use color-coding (Red/Yellow/Green) for quick performance assessment.</li>
                    <li><strong>Line Charts:</strong> Ideal for tracking trends over time, such as completion rates per month or an individual learner's progress.</li>
                    <li><strong>Scatter Plot:</strong> This chart helps you identify correlations between two different metrics, like the relationship between time spent training (engagement) and assessment scores (performance).</li>
                </ul>

                <h4 className="font-bold text-brand-dark dark:text-brand-light mt-4">4. Conditional Formatting & Visual Cues</h4>
                <p className="text-gray-600 dark:text-gray-400">
                   Notice the use of colors in some charts. We use a Red-Yellow-Green system to instantly highlight areas of concern (Red), areas needing attention (Yellow), and areas of high performance (Green). This helps in quickly identifying actionable insights.
                </p>
            </DashboardCard>
        </div>
    );
};