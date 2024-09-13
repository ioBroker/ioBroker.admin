const { copyFileSync } = require('node:fs');

copyFileSync('./src/types.d.ts', './build/types.d.ts');
