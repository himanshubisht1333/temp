const fs = require('fs');
const code = fs.readFileSync('e:\\SGT\\HackProject\\interviewiq\\client\\src\\app\\interview\\page.tsx', 'utf-8');

let stack = [];
let line = 1;
for (let i = 0; i < code.length; i++) {
    const char = code[i];
    if (char === '\n') line++;
    if (char === '{') stack.push({ char, line, index: i });
    if (char === '}') {
        if (stack.length === 0) {
            console.log(`Unmatched } at line ${line}`);
        } else {
            stack.pop();
        }
    }
}

if (stack.length > 0) {
    console.log(`Unmatched { remaining: ${stack.length}`);
    stack.forEach(unm => console.log(`Open { at line ${unm.line}`));
} else {
    console.log("No brace mismatch found!");
}
