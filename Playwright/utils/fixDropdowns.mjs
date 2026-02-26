#!/usr/bin/env node

import fs from 'fs';

// Fix all dropdown selections in book-demo.spec.ts
function fixDropdownSelections() {
  console.log('🔧 Fixing dropdown selections in book-demo.spec.ts');
  
  let content = fs.readFileSync('./tests/book-demo.spec.ts', 'utf8');
  
  // Replace company size selections
  content = content.replaceAll(
    "    // Select company size\n    await page.getByLabel('Company Size').click();\n    await page.getByRole('option', { name: '11-50 employees' }).click();",
    "    // Select company size\n    await page.getByLabel('Company Size').selectOption('11-50');"
  );
  
  // Replace use case selections
  content = content.replaceAll(
    "    // Select use case\n    await page.getByLabel('Use Case').click();\n    await page.getByRole('option', { name: 'Legal artefact analysis' }).click();",
    "    // Select use case\n    await page.getByLabel('Use Case').selectOption('legal');"
  );
  
  // Also handle variations with different spacing
  content = content.replaceAll(
    "    await page.getByLabel('Company Size').click();\n    await page.getByRole('option', { name: '11-50 employees' }).click();",
    "    await page.getByLabel('Company Size').selectOption('11-50');"
  );
  
  content = content.replaceAll(
    "    await page.getByLabel('Use Case').click();\n    await page.getByRole('option', { name: 'Legal artefact analysis' }).click();",
    "    await page.getByLabel('Use Case').selectOption('legal');"
  );
  
  fs.writeFileSync('./tests/book-demo.spec.ts', content);
  console.log('✅ Fixed all dropdown selections');
}

fixDropdownSelections();
console.log('🎉 Dropdown selection fixes completed!');