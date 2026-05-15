const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            results.push(file);
        }
    });
    return results;
}

const files = walk('src/app/api');
files.forEach(file => {
    if (file.endsWith('.ts')) {
        let content = fs.readFileSync(file, 'utf8');
        const newContent = content.split('User: \\`${user.id}\\`').join('Email: \\`${user.email || user.id}\\`');
        if (content !== newContent) {
            fs.writeFileSync(file, newContent, 'utf8');
            console.log(`Updated ${file}`);
        }
    }
});
