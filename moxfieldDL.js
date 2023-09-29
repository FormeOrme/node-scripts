// https://api2.moxfield.com/v2/decks/search?pageNumber=1&pageSize=64&sortType=updated&sortDirection=Descending&fmt=historicBrawl
// https://api2.moxfield.com/v3/decks/all/kvSRmefVk0mWytx7GImV6w

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { performance } = require('perf_hooks');


var argv = require('minimist')(process.argv.slice(2));
console.log(argv);

// Define your query parameters as variables
const pageNumber = argv.pn || 1;
const pageSize = argv.ps || 60;

console.log(`Reading ${pageSize} decks from page ${pageNumber}`);

const sortType = 'updated';
const sortDirection = 'Descending';
const fmt = 'historicBrawl';
const delayBetweenRequests = 300;

const BASE_URL = `https://api2.moxfield.com`;
const LIST_URL = `${BASE_URL}/v2/decks/search?pageNumber=${pageNumber}&pageSize=${pageSize}&sortType=${sortType}&sortDirection=${sortDirection}&fmt=${fmt}`;
const DETAIL_URL = (deck) => `${BASE_URL}/v3/decks/all/${deck.publicId}`;

const responsesFolder = './moxfield_decks';
if (!fs.existsSync(responsesFolder)) {
  fs.mkdirSync(responsesFolder);
}

// Function to save response data to a file
function saveResponseToFile(url, index, data, startTime) {
  const urlParts = url.split('/');
  const filename = `${urlParts[urlParts.length - 1]}.json`;
  const filePath = path.join(responsesFolder, filename);
  const newFile = !fs.existsSync(filePath);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  const diff = (performance.now() - startTime).toFixed(2);
  console.log(`#${index} [${newFile}]: Saved [${data.createdByUser.userName}]'s [${data.name}], took [${diff}]`);
}

// Function to make a single Axios request with a delay
function makeDelayedRequest(url, delay) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      axios.get(url)
        .then(response => {
          resolve(response);
        })
        .catch(error => reject(error));
    }, delay);
  });
}

// Make the GET request using axios
axios.get(LIST_URL)
  .then(response => {
    // Handle the response here
    const urlList = response.data.data.map(deck => DETAIL_URL(deck));
    const promisesWithDelays = urlList.map((url, index) => makeDelayedRequest(url, index * delayBetweenRequests));

    // Process responses as they arrive
    promisesWithDelays.forEach((promise, index) => {
      const startTime = performance.now();
      promise
        .then(response => {
          saveResponseToFile(urlList[index], index, response.data, startTime);
        })
        .catch(error => {
          console.error(`Error for ${urlList[index]}:`, error);
        });
    });
  })
  .catch(console.error);
