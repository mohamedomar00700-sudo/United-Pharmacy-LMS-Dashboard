export const exportToCsv = (filename: string, rows: Record<string, any>[]) => {
    if (!rows || !rows.length) {
        return;
    }
    const separator = ',';
    const headers = Object.keys(rows[0]);
    
    const csvContent = [
        headers.join(separator),
        ...rows.map(row => {
            return headers.map(k => {
                let cell = row[k] === null || row[k] === undefined ? '' : row[k];
                
                if (cell instanceof Date) {
                    return cell.toLocaleDateString();
                }

                let cellString = String(cell);

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
