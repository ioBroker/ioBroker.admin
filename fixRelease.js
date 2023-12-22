/**
 * Release script adds a version entry to private packages, which introduces conflicts in following releases
 */
const fs = require('fs');
const path = require('path');

function removePackEntry() {
    const packPath = path.join(__dirname, 'packages', 'admin', 'src', 'package.json');
    const packString = fs.readFileSync(packPath, {
        encoding: 'utf-8',
    });

    const packJson = JSON.parse(packString);

    delete packJson.version;

    fs.writeFileSync(packPath, JSON.stringify(packJson, null, 2), { encoding: 'utf-8' });
}

if (require.main === module) {
    removePackEntry();
}
