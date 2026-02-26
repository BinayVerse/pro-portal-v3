import { readFileSync, writeFileSync } from 'fs';

const filePath = 'tests/book-demo.spec.ts';
let content = readFileSync(filePath, 'utf-8');

// Fix all dropdown selections with correct values
const replacements = [
  // Company Size selections - use correct values
  {
    from: `await page.getByLabel('Company Size').selectOption('11-50');`,
    to: `await page.getByLabel('Company Size').selectOption('11-50');`
  },
  
  // Use Case selections - use correct values
  {
    from: `await page.getByLabel('Use Case').selectOption('Legal artefact analysis');`,
    to: `await page.getByLabel('Use Case').selectOption('legal');`
  }
];

// Apply all replacements
replacements.forEach(({ from, to }) => {
  content = content.replaceAll(from, to);
});

// Write the updated content back to the file
writeFileSync(filePath, content, 'utf-8');

console.log('Fixed dropdown selections to use correct values');