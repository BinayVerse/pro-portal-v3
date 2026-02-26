import { readFileSync, writeFileSync } from 'fs';

const filePath = 'tests/book-demo.spec.ts';
let content = readFileSync(filePath, 'utf-8');

// Fix all remaining dropdown interactions
content = content.replace(
  /await page\.getByLabel\('Company Size'\)\.click\(\);\s*await page\.getByRole\('option', { name: '11-50 employees' }\)\.click\(\);/g,
  `await page.getByLabel('Company Size').selectOption('11-50');`
);

content = content.replace(
  /await page\.getByLabel\('Use Case'\)\.click\(\);\s*await page\.getByRole\('option', { name: 'Legal artefact analysis' }\)\.click\(\);/g,
  `await page.getByLabel('Use Case').selectOption('legal');`
);

// Write the updated content back to the file
writeFileSync(filePath, content, 'utf-8');

console.log('Fixed all remaining dropdown interactions');