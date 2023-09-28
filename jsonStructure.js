const fs = require('fs');

// Replace 'your_json_file.json' with the actual filename
const fileName = 'moxfieldStatsData.json';

// Read the JSON file
fs.readFile(fileName, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading JSON file: ${err}`);
    return;
  }

  try {
    // Parse the JSON data into a JavaScript object
    const jsonData = JSON.parse(data);

    // Function to extract JSON structure
    function extractStructure(data, parentKey = '') {
      const structure = {};

      for (const key in data) {
        const newKey = parentKey ? `${parentKey}.${key}` : key;

        if (Array.isArray(data[key])) {
          // If the element is an array, process its elements recursively
          structure[newKey] = [];
          data[key].forEach((item, index) => {
            structure[newKey][index] = extractStructure(item);
          });
        } else if (typeof data[key] === 'object') {
          // If the element is an object, process it recursively
          structure[newKey] = extractStructure(data[key], newKey);
        } else {
          // If the element is neither an array nor an object, store its type
          structure[newKey] = typeof data[key];
        }
      }

      return structure;
    }

    // Extract JSON structure
    const jsonStructure = extractStructure(jsonData);

    // Print the structure
    console.log(jsonStructure);
  } catch (parseError) {
    console.error(`Error parsing JSON data: ${parseError}`);
  }
});
