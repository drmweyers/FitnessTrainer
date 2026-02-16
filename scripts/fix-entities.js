#!/usr/bin/env node
/**
 * Script to fix unescaped entities in JSX/TSX files
 * Replaces ' with &apos; and " with &quot; inside JSX text nodes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get files with unescaped entities from ESLint
const output = execSync('npx eslint components/ app/ --ext .tsx,.jsx 2>&1', { encoding: 'utf-8' });
const lines = output.split('\n');

const filesToFix = new Set();
let currentFile = null;

for (const line of lines) {
  if (line.match(/^C:\\/)) {
    currentFile = line.trim();
  } else if (currentFile && line.includes('react/no-unescaped-entities')) {
    filesToFix.add(currentFile);
  }
}

console.log(`Found ${filesToFix.size} files with unescaped entities`);

for (const file of filesToFix) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Replace unescaped apostrophes in JSX text (between > and <)
    // Be careful not to replace in attributes or code
    const aposFix = content.replace(/>([^<]*)'([^<]*)</g, (match, before, after) => {
      // Only replace if it looks like text content (not in code)
      if (!before.includes('{') && !after.includes('}')) {
        modified = true;
        return `>${before}&apos;${after}<`;
      }
      return match;
    });

    content = aposFix;

    // Replace unescaped quotes in JSX text
    const quoteFix = content.replace(/>([^<]*)"([^<]*)</g, (match, before, after) => {
      // Only replace if it looks like text content (not in code)
      if (!before.includes('{') && !after.includes('}')) {
        modified = true;
        return `>${before}&quot;${after}<`;
      }
      return match;
    });

    content = quoteFix;

    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Fixed: ${file}`);
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
}

console.log('Done!');
