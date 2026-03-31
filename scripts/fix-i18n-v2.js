const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDirs = ['app', 'components'];

targetDirs.forEach(dir => {
  walk(dir, (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;

      // Global fix for imports
      content = content.replace(/from ["']react-i18next["']/g, 'from "next-intl"');
      
      // Global fix for hook name
      content = content.replace(/useTranslation\(/g, 'useTranslations(');
      
      // Global fix for hook destructuring if it survived
      content = content.replace(/const \{ t \} = useTranslations\(/g, 'const t = useTranslations(');

      if (content !== originalContent) {
        console.log(`Fixing: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  });
});
