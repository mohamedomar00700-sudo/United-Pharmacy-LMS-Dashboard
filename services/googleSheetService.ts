

import { TrainingRecord, CourseType } from '../types.ts';

/**
 * Parses a CSV text string into an array of objects.
 * This is a simple parser and assumes no commas are present within the data fields.
 * @param {string} text The CSV text to parse.
 * @returns {Record<string, string>[]} An array of objects representing the rows.
 */
const parseCSV = (text: string): Record<string, string>[] => {
  const lines = text.trim().replace(/\r/g, '').split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, header, i) => {
      obj[header] = (values[i] || '').trim();
      return obj;
    }, {} as Record<string, string>);
  });
};

/**
 * Maps a parsed CSV row to a structured TrainingRecord object.
 * @param {Record<string, string>} row The raw object from the parsed CSV.
 * @param {number} index The index of the row, used for generating a unique ID.
 * @returns {TrainingRecord} The structured training record.
 */
const mapRowToTrainingRecord = (row: Record<string, string>, index: number): TrainingRecord => {
    const safeParseFloat = (val: string) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    };
    
    // NOTE: These keys must exactly match the column headers in your Google Sheet.
    const record: TrainingRecord = {
        id: index + 1,
        traineeName: row['Trainee Name'] || '',
        email: row['Email'] || '',
        branch: row['Branch'] || '',
        districtHead: row['District Head'] || '',
        supervisor: row['Supervisor'] || '',
        courseTitle: row['Course Title'] || '',
        completionRate: safeParseFloat(row['Completion Rate (%)']),
        preAssessmentScore: safeParseFloat(row['Pre-Assessment Score']),
        postAssessmentScore: safeParseFloat(row['Post-Assessment Score']),
        averageQuizScore: safeParseFloat(row['Average Quiz Score']),
        courseType: row['Course Type'] === 'Mandatory' ? CourseType.Mandatory : CourseType.Optional,
        completionDate: new Date(row['Completion Date']),
        trainingHours: safeParseFloat(row['Training Hours']),
    };

    if (isNaN(record.completionDate.getTime())) {
        console.warn('Invalid date found for row:', row);
        record.completionDate = new Date(); // Fallback to current date
    }
    
    return record;
};

/**
 * Fetches data from a public Google Sheet CSV URL and returns it as an array of TrainingRecord objects.
 * @param {string} sheetUrl The public URL of the Google Sheet, published as a CSV.
 * @returns {Promise<TrainingRecord[]>} A promise that resolves to an array of training records.
 */
export const fetchTrainingData = async (sheetUrl: string): Promise<TrainingRecord[]> => {
    const response = await fetch(sheetUrl);
    if (!response.ok) {
        throw new Error(`Network response was not ok. Status: ${response.status}`);
    }
    const csvText = await response.text();
    const parsedData = parseCSV(csvText);
    return parsedData.map(mapRowToTrainingRecord);
};