const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        if (fs.statSync(file).isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./app').concat(walk('./components'));
let filesChanged = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    const useClientRegex = /import\s+{\s*Loader2\s*}\s*from\s+['"]lucide-react['"]\r?\n['"]use client['"];?\r?\n/g;
    content = content.replace(useClientRegex, `"use client"\nimport { Loader2 } from "lucide-react"\n`);

    const useClientRegex2 = /import\s+{\s*Loader2\s*}\s*from\s+['"]lucide-react['"]\r?\n\r?\n['"]use client['"];?\r?\n/g;
    content = content.replace(useClientRegex2, `"use client"\nimport { Loader2 } from "lucide-react"\n`);

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        filesChanged++;
        console.log(`Fixed imports in ${file}`);
    }
}

console.log(`Done. Changed ${filesChanged} files.`);
