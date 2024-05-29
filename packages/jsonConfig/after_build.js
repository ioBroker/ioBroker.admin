const fs = require('node:fs');

fs.copyFileSync('./src/types.d.ts', './build/types.d.ts');
