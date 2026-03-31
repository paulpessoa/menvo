const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDirs = ['app', 'components'];

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    walk(dir, (filePath) => {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // Fix corrupted quotes
        content = content.replace(/from \\"next-intl\\"/g, 'from "next-intl"');
        content = content.replace(/from \\'next-intl\\'/g, "from 'next-intl'");
        
        // Fix hook name (singular to plural)
        content = content.replace(/useTranslation\(/g, 'useTranslations(');
        content = content.replace(/import \{ useTranslation \}/g, 'import { useTranslations }');
        
        // Fix hook destructuring (const { t } = useTranslations() -> const t = useTranslations())
        content = content.replace(/const \{ t \} = useTranslations\(/g, 'const t = useTranslations(');

        if (content !== originalContent) {
          console.log(`Fixing: ${filePath}`);
          fs.writeFileSync(filePath, content, 'utf8');
        }
      }
    });
  }
});
