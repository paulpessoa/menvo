const fs = require('fs');
const path = require('path');

const directories = ['app', 'components'];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // If file contains MenvoLoader but doesn't import it
  if (content.includes('<MenvoLoader') && !content.includes('import { MenvoLoader }')) {
    const importMatch = content.match(/^import .* from .*$/gm) || content.match(/^import .* from .*\r?$/gm);
    if (importMatch && importMatch.length > 0) {
        const lastImport = importMatch[importMatch.length - 1];
        content = content.replace(lastImport, lastImport + '\nimport { MenvoLoader } from "@/components/ui/menvo-loader"');
    } else {
        content = 'import { MenvoLoader } from "@/components/ui/menvo-loader"\n' + content;
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Added import to ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') && !fullPath.includes('menvo-loader.tsx')) {
      processFile(fullPath);
    }
  }
}

directories.forEach(walkDir);
