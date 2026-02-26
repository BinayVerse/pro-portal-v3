#!/usr/bin/env node

import fs from 'fs';

// Fix all remaining Company selectors in book-demo.spec.ts
function fixCompanySelectors() {
  console.log('🔧 Fixing Company field selectors in book-demo.spec.ts');
  
  let content = fs.readFileSync('./tests/book-demo.spec.ts', 'utf8');
  
  // Replace all remaining instances of getByLabel('Company').fill
  content = content.replaceAll(
    "await page.getByLabel('Company').fill('Test Company');",
    "await page.getByRole('textbox', { name: 'Company' }).fill('Test Company');"
  );
  
  fs.writeFileSync('./tests/book-demo.spec.ts', content);
  console.log('✅ Fixed all Company field selectors');
}

fixCompanySelectors();
console.log('🎉 Company selector fixes completed!');