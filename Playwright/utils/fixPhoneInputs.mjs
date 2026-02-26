import { readFileSync, writeFileSync } from 'fs';

const filePath = 'tests/book-demo.spec.ts';
let content = readFileSync(filePath, 'utf-8');

// Fix all phone number inputs
const replacements = [
  {
    from: `await page.getByPlaceholder('Your phone number').fill('+1234567890');`,
    to: `// For phone, click the input area and type
    await page.getByPlaceholder('Your phone number').click();
    await page.getByPlaceholder('Your phone number').fill('1234567890');`
  }
];

// Apply all replacements
replacements.forEach(({ from, to }) => {
  content = content.replaceAll(from, to);
});

// Write the updated content back to the file
writeFileSync(filePath, content, 'utf-8');

console.log('Fixed phone number inputs in all tests');