
// FIX: Changed `rows` type from `object[]` to `Record<string, any>[]`.
// This resolves the error on the `instanceof` check by allowing `cell` to be of type `any`,
// and it enables correct property access on `row`.
export const exportToCsv = (filename: string, rows: Record<string, any>[]) => {
    if (!rows || !rows.length) {
        return;
    }
    const separator = ',';
    // Sanitize headers to be valid object keys
    const headers = Object.keys(rows[0]);
    
    const csvContent = [
        headers.join(separator),
        ...rows.map(row => {
            return headers.map(k => {
                let cell = row[k] === null || row[k] === undefined ? '' : row[k];
                
                // Format dates nicely
                if (cell instanceof Date) {
                    return cell.toLocaleDateString();
                }

                let cellString = String(cell);

                // Handle values that contain comma, quote or newline
                if (cellString.search(/("|,|\n)/g) >= 0) {
                    cellString = `"${cellString.replace(/"/g, '""')}"`;
                }
                return cellString;
            }).join(separator);
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
