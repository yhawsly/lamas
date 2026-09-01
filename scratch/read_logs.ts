const fs = require('fs');
const path = require('path');

const files = [
    'prisma-error.log',
    'verify_output.txt',
    'build_output.txt',
    'check_output.txt',
    'lint_output.txt'
];

files.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        console.log(`=== ${file} ===`);
        try {
            const content = fs.readFileSync(filePath, 'utf16le');
            console.log(content.slice(-2000)); // Print last 2000 chars
        } catch (e) {
            console.error(`Error reading ${file}:`, e);
        }
    } else {
        console.log(`=== ${file} does not exist ===`);
    }
});
