const fs = require('fs');

const p = 'lib/email/brevo.ts';
if (fs.existsSync(p)) {
    let c = fs.readFileSync(p, 'utf8');
    c = c.replace(/ style="border-left: [^"]+"/g, '');
    c = c.replace(/ style='border-left: [^']+'/g, '');
    fs.writeFileSync(p, c, 'utf8');
    console.log('Removed left borders from brevo.ts');
}
