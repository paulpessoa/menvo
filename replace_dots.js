const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
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

    // Only process if it has Loader2
    if (content.includes('<Loader2')) {
        content = content.replace(/<Loader2([^>]*?)\/?>/g, (match, props) => {
            // Keep the original props but modify className if it exists
            let newProps = props;
            
            // Extract className
            const classNameMatch = props.match(/className=(['"])(.*?)\1/);
            if (classNameMatch) {
                let classNames = classNameMatch[2];
                // Remove spin and sizes
                classNames = classNames
                    .replace(/\banimate-spin\b/g, '')
                    .replace(/\bh-[\d\.]+\b/g, '')
                    .replace(/\bw-[\d\.]+\b/g, '')
                    .replace(/\btext-[a-zA-Z0-9-]+\b/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                if (classNames) {
                    newProps = props.replace(classNameMatch[0], `className="${classNames}"`);
                } else {
                    newProps = props.replace(classNameMatch[0], '').replace(/\s+/g, ' ').trimEnd();
                }
            } else {
                newProps = props.trimEnd();
            }
            
            return `<MenvoDots${newProps ? ' ' + newProps.trim() : ''} />`;
        });
        
        // Add import
        if (!original.includes('MenvoDots')) {
            const importStatement = `import { MenvoDots } from "@/components/ui/menvo-loader"\n`;
            // Find first import
            const firstImportIndex = content.indexOf('import ');
            if (firstImportIndex !== -1) {
                content = content.slice(0, firstImportIndex) + importStatement + content.slice(firstImportIndex);
            } else {
                // if there's 'use client', put after that
                const useClientMatch = content.match(/['"]use client['"];?\n/);
                if (useClientMatch) {
                    content = content.replace(useClientMatch[0], useClientMatch[0] + importStatement);
                } else {
                    content = importStatement + content;
                }
            }
        }
    }

    if (content !== original) {
        // Clean up lucide-react imports
        if (!content.includes('<Loader2')) {
            content = content.replace(/import\s+{([^}]*?)}\s+from\s+['"]lucide-react['"]/g, (match, imports) => {
                const newImports = imports.split(',').map(i => i.trim()).filter(i => i !== 'Loader2' && i !== '').join(', ');
                if (newImports.length === 0) return '';
                return `import { ${newImports} } from "lucide-react"`;
            });
            content = content.replace(/import\s+Loader2\s+from\s+['"]lucide-react['"]\n?/g, '');
        }

        fs.writeFileSync(file, content, 'utf8');
        filesChanged++;
        console.log(`Updated ${file}`);
    }
}

console.log(`Done. Changed ${filesChanged} files.`);
