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

    // Remove border-l-[\w\/-]+ completely from all files
    content = content.replace(/\bborder-l-[a-zA-Z0-9-\/]+\b/g, '');
    
    // Clean up multiple spaces inside className strings
    content = content.replace(/className=(['"])(.*?)\1/g, (match, quote, inner) => {
        return `className=${quote}${inner.replace(/\s+/g, ' ').trim()}${quote}`;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        filesChanged++;
        console.log(`Removed left borders in ${file}`);
    }
}

// Remove the button from BookMentorshipModal.tsx
const modalPath = 'components/mentorship/BookMentorshipModal.tsx';
if (fs.existsSync(modalPath)) {
    let modalContent = fs.readFileSync(modalPath, 'utf8');
    modalContent = modalContent.replace(/<button[\s\S]*?onClick=\{onClose\}[\s\S]*?aria-label="Fechar"[\s\S]*?>[\s\S]*?<X className="w-5 h-5" \/>[\s\S]*?<\/button>/, '');
    fs.writeFileSync(modalPath, modalContent, 'utf8');
    console.log('Removed extra X from BookMentorshipModal');
}

console.log(`Done. Changed ${filesChanged} files with borders.`);
