const fs = require('fs');
const path = require('path');

const directories = ['app', 'components'];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Patterns for large loaders
  const loaderPattern1 = /<Loader2\s+className="[^"]*h-(?:8|10|12|6)[^"]*"\s*\/?>(?:<\/Loader2>)?/g;
  const loaderPattern2 = /<div\s+className="[^"]*animate-spin[^"]*h-8[^"]*"\s*><\/div>/g;
  // A wrapper flex div around the loader might be used
  const flexCenterLoaderPattern = /<div\s+className="[^"]*flex\s+justify-center[^"]*">\s*(?:<Loader2[^>]*>\s*<\/Loader2>|<Loader2[^>]*\/>|<div[^>]*animate-spin[^>]*><\/div>)\s*<\/div>/g;
  
  let modified = false;

  // Replace matching loader instances
  if (loaderPattern1.test(content) || loaderPattern2.test(content) || flexCenterLoaderPattern.test(content)) {
    content = content.replace(flexCenterLoaderPattern, '<MenvoLoader />');
    content = content.replace(loaderPattern1, '<MenvoLoader />');
    content = content.replace(loaderPattern2, '<MenvoLoader />');
    modified = true;
  }

  // Also replace explicit "Carregando..." text combined with smaller loaders if they represent a full page state, but let's stick to the visual loaders first.

  if (modified) {
    // Check if MenvoLoader is imported
    if (!content.includes('MenvoLoader')) {
        // Find last import
        const imports = content.match(/^import .* from .*$/gm);
        if (imports && imports.length > 0) {
            const lastImport = imports[imports.length - 1];
            content = content.replace(lastImport, lastImport + '\nimport { MenvoLoader } from "@/components/ui/menvo-loader"');
        } else {
            content = 'import { MenvoLoader } from "@/components/ui/menvo-loader"\n' + content;
        }
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') && !fullPath.includes('menvo-loader.tsx') && !fullPath.includes('loading.tsx')) {
      processFile(fullPath);
    }
  }
}

directories.forEach(walkDir);
