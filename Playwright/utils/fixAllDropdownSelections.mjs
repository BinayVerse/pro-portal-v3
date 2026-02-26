import { readFileSync, writeFileSync } from 'fs';

const filePath = 'tests/book-demo.spec.ts';
let content = readFileSync(filePath, 'utf-8');

// Replace all dropdown interactions with selectOption method
const replacements = [
  // Company Size dropdown selections
  {
    from: `    // Select company size
    await page.getByLabel('Company Size').click();
    await page.getByRole('option', { name: '11-50 employees' }).click();`,
    to: `    // Select company size
    await page.getByLabel('Company Size').selectOption('11-50');`
  },
  
  // Use Case dropdown selections  
  {
    from: `    // Select use case
    await page.getByLabel('Use Case').click();
    await page.getByRole('option', { name: 'Legal artefact analysis' }).click();`,
    to: `    // Select use case
    await page.getByLabel('Use Case').selectOption('Legal artefact analysis');`
  }
];

// Apply all replacements
replacements.forEach(({ from, to }) => {
  content = content.replaceAll(from, to);
});

// Write the updated content back to the file
writeFileSync(filePath, content, 'utf-8');

console.log('Fixed all dropdown selections in book-demo.spec.ts');