import fs from 'fs';
import csv from 'csv-parser';

const inputFile = 'rigged-hilbert-space-2_2023-08-27_export.csv'; // Replace with your CSV file name
const outputFile = 'output.json'; // Replace with desired JSON output file name
const data = [];

fs.createReadStream(inputFile)
    .pipe(csv())
    .on('data', (row) => {
        data.push(row);
    })
    .on('end', () => {
        fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
        console.log('CSV to JSON conversion completed.');
    });
