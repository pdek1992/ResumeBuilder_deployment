const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components/builder/templates');
const files = fs.readdirSync(dir).filter(f => f.endsWith('Template.tsx') || f === 'StandardTemplate.tsx');

let changedFiles = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Fix overflow-hidden
  content = content.replace(
    /"origin-top-left bg-white overflow-hidden min-h-full([^"]*)"/g,
    '"origin-top-left bg-white min-h-full"'
  );
  content = content.replace(
    /isPrintMode \? "" : "shadow-\[/g,
    'isPrintMode ? "" : "overflow-hidden shadow-['
  );
  
  // Fix background colors using replaceAll (string based, no regex issues)
  let t = content;
  content = content.replaceAll('\10', 'hexToRgba(accent, 0.1)');
  content = content.replaceAll('\15', 'hexToRgba(accent, 0.15)');
  content = content.replaceAll('\05', 'hexToRgba(accent, 0.05)');
  content = content.replaceAll('\24', 'hexToRgba(accent, 0.24)');

  if (content !== original) {
    if (content.includes('hexToRgba') && !original.includes('hexToRgba')) {
       content = content.replace(
        /import \{ cn \} from "@\/lib\/utils";/g,
        'import { cn, hexToRgba } from "@/lib/utils";'
       );
    }
    fs.writeFileSync(filePath, content, 'utf8');
    changedFiles++;
    console.log("Updated", file);
  }
}

console.log("Total updated:", changedFiles);
