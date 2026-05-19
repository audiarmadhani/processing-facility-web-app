import fs from 'fs';
import path from 'path';

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const pagePath = path.join(root, 'page.js');
const lines = fs.readFileSync(pagePath, 'utf8').split('\n');

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

function write(rel, content, header = "'use client';\n\n") {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, header + content);
  console.log('wrote', rel, content.split('\n').length, 'lines');
}

// Create form accordions (inner content only, lines 1691-2361)
write('components/sections/_createAccordions.txt', slice(1691, 2361), '');
write('components/sections/_detailsAccordions.txt', slice(2642, 3992), '');

console.log('done');
