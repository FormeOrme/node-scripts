const express = require('express');
const fs = require('fs');
const path = require('path');

var argv = require('minimist')(process.argv.slice(2));
console.log(argv);


const app = express();
const port = 3000;

const threshold = 3;

const loadFile = (startName, extension) => fs.readdirSync(__dirname)
    .reverse()
    .find(file => path.parse(file).name.startsWith(startName) && path.parse(file).ext.slice(1) === extension);

const localeCompare = (a, b) => a.localeCompare(b);

const indexName = (name) => name.replace(/A-/g, "").replace(/[^\w]/g, "").toLowerCase()

const humanName = (name) => name.replace(/A-/g, "").replace(/ \/\/.+/g, "")

function mergeObjects(arrayOfObjects) {
    const sumObject = {};
    arrayOfObjects.forEach(obj => {
        // Iterate through the keys in each object
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                // If the key exists in the sumObject, add the value, otherwise set it to the value
                sumObject[key] = (sumObject[key] || 0) + obj[key];
            }
        }
    });
    return sumObject;
}

if (!argv.skip) {
    class Card {
        constructor(card, deck) {
            this.name = card.name;
            this.image = CARD_IMAGES[card.name]?.image;
            this.count = 1;
            this.types = card.type_line.match(/\w+/g);
            this.color = deck.countColor;
            this.commander = deck.countCommander;
            this.colorIdentity = deck.countColorIdentity;
            this.hubs = deck.countHubs;
        }

        update(deck) {
            this.count++;
            const ci = deck.colorIdentity.join("");
            this.colorIdentity[ci] = (this.colorIdentity[ci] || 0) + 1;
            deck.colorIdentity.forEach(c => this.color[c] = (this.color[c] || 0) + 1);
            deck.hubs.map(h => h.name).forEach(c => this.hubs[c] = (this.hubs[c] || 0) + 1);
            this.commander[deck.commander.name] = (this.commander[deck.commander.name] || 0) + 1;
        }
    }

    class Deck {
        get countColor() { return this.colorIdentity.reduce((a, c) => { a[c] = 1; return a; }, {}); }
        get ci() { return this.colorIdentity.join(""); }
        get countColorIdentity() { return ({ [this.ci]: 1 }); }
        get countHubs() { return this.hubs.map(h => h.name).reduce((a, c) => { a[c] = 1; return a; }, {}); }

        get commander() {
            return Object.values(this.boards.commanders.cards)
                .map(wrapper => {
                    const card = wrapper.card;
                    card.name = humanName(card.name);
                    return card;
                })[0];
        }
        get countCommander() { return ({ [this.commander.name]: 1 }); }

        isValid() {
            return true;// this.hubs.length != 0;
        }

    }

    class CardList {
        constructor() {
            this.cardsMap = {};
            this.count = 0;
            this.superTypes = [];
            this.countMap = {
                color: {},
                colorIdentity: {},
                hubs: {},
                commander: {}
            };
            this.commanderCI = {};
        }

        add(card, deck) {
            const cardNameId = indexName(card.name);
            this.superTypes = [
                ...this.superTypes,
                ...card.type_line.split("—")[0].match(/\w+/g)
            ]
            this.cardsMap[cardNameId]
                ? this.cardsMap[cardNameId].update(deck)
                : (this.cardsMap[cardNameId] = new Card(card, deck));

            this.commanderCI[deck.commander.name] = deck.ci;
        }

        updateCounts(deck) {
            this.countMap.color = mergeObjects([this.countMap.color, deck.countColor]);
            this.countMap.colorIdentity = mergeObjects([this.countMap.colorIdentity, deck.countColorIdentity]);
            this.countMap.hubs = mergeObjects([this.countMap.hubs, deck.countHubs]);
            this.countMap.commander = mergeObjects([this.countMap.commander, deck.countCommander]);
        }

        get data() {
            const cards = Object.values(this.cardsMap).filter(c => c.count > threshold);
            return ({
                threshold: threshold,
                count: this.count,
                countMap: this.countMap,
                types: Array.from(new Set(cards.reduce((a, c) => { a.push(...c.types); return a }, []))).sort(localeCompare),
                superTypes: Array.from(new Set(this.superTypes)),
                cards: cards,
                commanderCI: this.commanderCI,
            });
        }
    }

    console.time("CARD_IMAGES");
    const CARD_IMAGES = JSON.parse(fs.readFileSync(loadFile("oracle-cards-", "json")))
        // .filter(c => c.legalities.historicbrawl == "legal" || c.legalities.explorer == "legal" || c.legalities.historic == "legal")
        .map(c => ({
            name: c.name,
            image: c.image_uris?.normal || c.card_faces[0].image_uris?.normal
        }))
        .reduce((a, c) => { a[c.name] = c; return a; }, {});
    console.timeEnd("CARD_IMAGES");

    console.time("moxfieldStatsData");
    const moxfieldDecksFolder = path.join(__dirname, 'moxfield_decks');
    const files = fs.readdirSync(moxfieldDecksFolder);
    const allCards = new CardList();
    files.forEach((file) => {
        if (file.endsWith('.json')) {
            const deckPath = path.join(moxfieldDecksFolder, file);
            const deck = Object.setPrototypeOf(JSON.parse(fs.readFileSync(deckPath, 'utf8')), Deck.prototype);

            if (deck.isValid()) {
                allCards.count++;
                const deckCards = [
                    ...Object.values(deck.boards.mainboard.cards),
                    ...Object.values(deck.boards.commanders.cards)
                ];
                allCards.updateCounts(deck);
                deckCards
                    .map(obj => obj.card)
                    .map(card => {
                        card.name = card.name.replace(/A-/g, "");
                        return card;
                    })
                    .forEach(card => allCards.add(card, deck));
            } else {
                console.log(`${deck.name} is not valid`);
            }
        }
    });
    fs.writeFileSync("public/moxfieldStatsData.json", JSON.stringify(allCards.data));
    console.timeEnd("moxfieldStatsData");
}

app.use(express.static('public'));
app.use('/moxfield_decks', express.static('moxfield_decks'));

app.get('/moxfieldStats', (req, res) => {
    const htmlFilePath = path.join(__dirname, 'public', 'moxfieldStats.html');
    const html = fs.readFileSync(htmlFilePath, 'utf8');
    res.send(html);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}/moxfieldStats`);
});
