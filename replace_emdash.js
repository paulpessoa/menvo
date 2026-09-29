const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!fullPath.includes('node_modules') && !fullPath.includes('.next') && !fullPath.includes('.git')) {
                results = results.concat(walk(fullPath));
            }
        } else {
            if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.json') || fullPath.endsWith('.md')) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const files = walk('.');
let filesChanged = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace em-dash "—" with regular hyphen "-"
    content = content.replace(/—/g, '-');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        filesChanged++;
        console.log(`Replaced em-dash in ${file}`);
    }
}

console.log(`Done. Changed ${filesChanged} files.`);
