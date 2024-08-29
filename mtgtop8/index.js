const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://mtgtop8.com/format?f=MO')
    .then(response => {
        // Load the HTML into Cheerio
        const $ = cheerio.load(response.data);

        // Example: Extracting deck names and their authors (adjust selectors as needed)
        const decks = [];

        $('div.WL .S14').each((index, element) => {
            const deckName = $(element).text().trim();
            const deckAuthor = $(element).next().text().trim();  // Assuming author is in the next element
            decks.push({ deckName, deckAuthor });
        });

        console.log(decks);
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });