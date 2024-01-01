const express = require('express');
const xlsx = require('xlsx');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to read data from XLS file and send to the client
app.get('/data', (req, res) => {
  // Update the file path to your actual XLS file location
  const filePath = 'D:\\GitHub\\node-scripts\\graphs\\2024-01-01_13-39-21.xls';

  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  // Group data by year
  const groupedData = rawData.reduce((result, entry) => {
    const year = new Date(entry.Date).getFullYear().toString();
    if (!result[year]) {
      result[year] = [];
    }
    result[year].push(entry);
    return result;
  }, {});

  res.json(groupedData);
});

// Add a route handler for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'graphs', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
