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

    content = content.replace(/<(Button|button)[^>]*>([\s\S]*?)<\/\1>/g, (match, tag, inner) => {
        if (inner.includes('<MenvoDots')) {
            const newInner = inner.replace(/<MenvoDots([^>]*?)\/?>/g, (dotMatch, props) => {
                let classNames = 'animate-spin h-4 w-4';
                const classNameMatch = props.match(/className=(['"])(.*?)\1/);
                if (classNameMatch) {
                    classNames = `${classNameMatch[2]} animate-spin h-4 w-4`.trim();
                }
                return `<Loader2 className="${classNames}" />`;
            });
            return match.replace(inner, newInner);
        }
        return match;
    });

    if (content !== original) {
        // If we added Loader2, ensure it's imported from lucide-react
        const hasLoader2Import = /import\s+{[^}]*Loader2[^}]*}\s+from\s+['"]lucide-react['"]/.test(content);
        if (!hasLoader2Import) {
            const lucideRegex = /import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/;
            const match = content.match(lucideRegex);
            if (match) {
                content = content.replace(lucideRegex, `import { $1, Loader2 } from "lucide-react"`);
            } else {
                content = `import { Loader2 } from "lucide-react"\n` + content;
            }
        }

        // If MenvoDots is no longer used, remove its import
        if (!content.includes('<MenvoDots')) {
            content = content.replace(/import\s*{\s*MenvoDots\s*}\s*from\s+['"]@\/components\/ui\/menvo-loader['"]\n?/g, '');
        }

        fs.writeFileSync(file, content, 'utf8');
        filesChanged++;
        console.log(`Restored spinners in ${file}`);
    }
}

console.log(`Done. Changed ${filesChanged} files.`);
