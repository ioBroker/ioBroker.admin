// this is service script that extracts names from names.txt and places them into list.json
/*
const fs = require('fs');

function readTxt(fileName) {
    const text = fs.readFileSync(fileName).toString('utf8');
    const lines = text.split('\n');
    const langs = lines.shift().split('\t').map(l => l.toLowerCase().trim());

    const result = {};
    lines.forEach(line => {
        const words = line.split('\t').map(w => w.trim());
        const word = {};
        result[words[0]] = word;
        langs.forEach((lang, i) => {
            word[lang] = words[i];
        });
    });
    return result;
}

function mergeTexts(jsonFileName, words) {
    const file = require(jsonFileName);
    file.forEach(item => {
        if (typeof item.name === 'string' && words[item.name]) {
            item.name = words[item.name];
        }
    });
    fs.writeFileSync(jsonFileName, JSON.stringify(file, null, 2));
}

const words = readTxt(__dirname + '/names.txt');
mergeTexts(__dirname + '/list.json', words);
*/