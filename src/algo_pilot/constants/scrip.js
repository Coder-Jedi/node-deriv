import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the JSON file
const filePath = path.join(__dirname, 'active-symbols.json');
const rawData = fs.readFileSync(filePath);
const activeSymbols = JSON.parse(rawData);

// Extract forex symbols
const forexSymbols = activeSymbols.active_symbols
    .filter(symbol => symbol.symbol.startsWith('frx'))
    .map(symbol => symbol.symbol);

console.log(forexSymbols, forexSymbols.length);