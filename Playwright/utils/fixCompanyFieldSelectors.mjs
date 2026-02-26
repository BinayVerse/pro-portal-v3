import { readFileSync, writeFileSync } from 'fs';

const filePath = 'tests/book-demo.spec.ts';
let content = readFileSync(filePath, 'utf-8');

// Replace all Company field references to avoid conflict with Company Size
const replacements = [
  {
    from: `await expect(page.getByLabel('Company')).toHaveValue('Test Company');`,
    to: `await expect(page.getByRole('textbox', { name: 'Company' })).toHaveValue('Test Company');`
  },
  {
    from: `await page.getByRole('textbox', { name: 'Company' }).fill('Test Company');`,
    to: `await page.getByRole('textbox', { name: 'Company' }).fill('Test Company');` // already correct
  },
  {
    from: `await expect(page.getByLabel('Company')).toHaveValue('');`,
    to: `await expect(page.getByRole('textbox', { name: 'Company' })).toHaveValue('');`
  }
];

// Apply replacements
replacements.forEach(({ from, to }) => {
  content = content.replaceAll(from, to);
});

// Write the updated content back to the file
writeFileSync(filePath, content, 'utf-8');

console.log('Fixed Company field selectors');