const fs = require('fs');
const path = require('path');

const locales = ['pt-BR', 'en', 'es', 'da', 'fr', 'sv'];
const messagesDir = 'messages';

// Helper to deep merge objects
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

// 1. Get all unique keys across pt-BR and en
const ptBR = JSON.parse(fs.readFileSync(path.join(messagesDir, 'pt-BR.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(messagesDir, 'en.json'), 'utf8'));

// 2. Normalize function to ensure all locales have the same keys
locales.forEach(locale => {
  const filePath = path.join(messagesDir, `${locale}.json`);
  let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Ensure basic sections exist based on pt-BR template
  for (const section in ptBR) {
    if (!content[section]) {
      content[section] = JSON.parse(JSON.stringify(ptBR[section]));
      console.log(`Adding missing section '${section}' to ${locale}`);
    } else {
      // Sync keys within section
      syncKeys(ptBR[section], content[section], `${locale}.${section}`);
    }
  }
  
  // Fix specifically the SDG part mentioned by the user
  if (content.about && content.about.sdg) {
    content.about.sdg.goalNumber = content.about.sdg.goalNumber || "ODS {{number}}";
  }

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
});

function syncKeys(source, target, path) {
  for (const key in source) {
    if (!(key in target)) {
      target[key] = JSON.parse(JSON.stringify(source[key]));
      console.log(`Adding missing key '${path}.${key}'`);
    } else if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
      syncKeys(source[key], target[key], `${path}.${key}`);
    }
  }
}
