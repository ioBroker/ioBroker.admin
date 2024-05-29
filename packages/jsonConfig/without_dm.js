const fs = require('node:fs');

const pack = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
pack.name = '@iobroker/json-config';
delete pack.dependencies['@iobroker/dm-gui-components'];
fs.writeFileSync('./package.json', `${JSON.stringify(pack, null, 2)}\n`, 'utf8');

function getSpaces(line) {
    let spaces = 0;
    while (line[spaces] === ' ') {
        spaces++;
    }
    return spaces;
}

const original = fs.readFileSync('./src/JsonConfigComponent/ConfigDeviceManager.tsx', 'utf8');
const file = original.split('\n');
let uncomment = null;
let comment = null;
for (let l = 0; l < file.length; l++) {
    file[l] = file[l].replace(/\r/g, '');
    if (file[l].includes('// START-WITH-DM')) {
        comment = getSpaces(file[l]);
    } else if (file[l].includes('// END-WITH-DM')) {
        comment = null;
    } else if (file[l].includes('// START-WITHOUT-DM')) {
        uncomment = getSpaces(file[l]);
    } else if (file[l].includes('// END-WITHOUT-DM')) {
        uncomment = null;
    } else if (comment !== null) {
        if (file[l].substring(comment, comment + 2) !== '//') {
            file[l] = `${file[l].substring(0, comment)}// ${file[l].substring(comment)}`;
        }
    } else if (uncomment !== null) {
        if (file[l].substring(uncomment, uncomment + 2) === '//') {
            file[l] = `${file[l].substring(0, uncomment)}${file[l].substring(uncomment + 3)}`;
        }
    }
}

while (file[file.length - 1].trim() === '') {
    file.pop();
}
file.push('');

if (original !== file.join('\n')) {
    fs.writeFileSync('./src/JsonConfigComponent/ConfigDeviceManager.tsx', file.join('\n'), 'utf8');
}
