#!/usr/bin/env node

const fs = require('fs');
const os = require('os');

// -------------------- Check Node.js --------------------
if (!process.version) {
    console.error('Node.js is required to run Onyx. Please install it from https://nodejs.org/');
    process.exit(1);
}

// -------------------- Check chalk --------------------
let chalk;
try {
    chalk = require('chalk').default;
} catch (err) {
    console.error('The "chalk" dependency is missing.');
    console.log('Install it by running: npm install chalk');
    process.exit(1);
}

// -------------------- Config --------------------
const VIRTUAL_DIR = 'Onyx> ';
const ALLOWED_CODES = {
    l: 'abcdefghijklmnopqrstuvwxyz',
    u: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    d: '0123456789',
    s: '!@#$%^&*()-_=+[]{}|;:,.<>?/'
};
const EXCLUDE_CODES = {
    x: 'all-lower',
    y: 'all-upper',
    z: 'all-digits',
    w: 'no-symbols'
};

// -------------------- Functions --------------------
function* generateAll(charset, minLen, maxLen) {
    for (let length = minLen; length <= maxLen; length++) {
        const n = charset.length;
        const indices = Array(length).fill(0);
        while (true) {
            yield indices.map(i => charset[i]).join('');
            let pos = length - 1;
            while (pos >= 0) {
                indices[pos]++;
                if (indices[pos] < n) break;
                indices[pos] = 0;
                pos--;
            }
            if (pos < 0) break;
        }
    }
}

function randomPassword(charset, length) {
    let pw = '';
    for (let i = 0; i < length; i++) {
        pw += charset[Math.floor(Math.random() * charset.length)];
    }
    return pw;
}

function isIrrelevant(pw, bans) {
    if (bans.includes('all-lower') && pw === pw.toLowerCase() && pw.match(/[a-z]/)) return true;
    if (bans.includes('all-upper') && pw === pw.toUpperCase() && pw.match(/[A-Z]/)) return true;
    if (bans.includes('all-digits') && pw.match(/^\d+$/)) return true;
    if (bans.includes('no-symbols') && pw.match(/^[A-Za-z0-9]+$/)) return true;
    return false;
}

function showHelp() {
    console.log(chalk.cyan.bold(`\n=== Onyx Password Generator ===\n`));
    console.log(`${VIRTUAL_DIR}Usage: node onyx.js [options]\n`);
    console.log(chalk.yellow('Options:'));
    console.log('  -a  Allowed characters codes (multiple with /). Example: -a l/u/d/s');
    console.log('      l = a-z  u = A-Z  d = 0-9  s = symbols');
    console.log('  -e  Exclusion codes (multiple with /). Example: -e x/z');
    console.log('      x = all-lower  y = all-upper  z = all-digits  w = no-symbols');
    console.log('  -l  Password length or range. Example: -l 8-16');
    console.log('  -f  Output filename. Example: -f passwords.txt');
    console.log('  -n  Number of random passwords to generate. Example: -n 1000');
    console.log('  --man  Show full manual page\n');
    console.log(chalk.green('Example command:'));
    console.log('  node onyx.js -a l/u/d/s -e x/z -l 8-12 -f passwords.txt -n 1000\n');
}

function showMan() {
    console.log(chalk.cyan.bold('\n=== Onyx Password Generator MANUAL ===\n'));
    console.log(chalk.yellow('Allowed characters codes:'));
    for (const [code, chars] of Object.entries(ALLOWED_CODES)) {
        console.log(`  ${code} = ${chars}`);
    }
    console.log(chalk.yellow('\nExclusion codes:'));
    for (const [code, name] of Object.entries(EXCLUDE_CODES)) {
        console.log(`  ${code} = ${name}`);
    }
    console.log('\nPassword length: use min-max, e.g., 8-16');
    console.log('Output file: specify with -f');
    console.log('Random passwords: specify with -n <number>');
    console.log(chalk.green('\nFull example:'));
    console.log('  node onyx.js -a l/u/d/s -e x/w -l 8-12 -f mypasswords.txt -n 500\n');
}

function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {};
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '-a': parsed.allowed = args[i + 1].split('/'); i++; break;
            case '-e': parsed.exclude = args[i + 1].split('/'); i++; break;
            case '-l': parsed.length = args[i + 1]; i++; break;
            case '-f': parsed.file = args[i + 1]; i++; break;
            case '-n': parsed.randomCount = parseInt(args[i + 1]); i++; break;
            case '--man': parsed.man = true; break;
            default: break;
        }
    }
    return parsed;
}

// -------------------- Main --------------------
async function main() {
    const args = parseArgs();

    if (args.man) { showMan(); process.exit(0); }
    if (!args.allowed || !args.length || !args.file) { showHelp(); process.exit(0); }

    let charset = '';
    for (const code of args.allowed) if (ALLOWED_CODES[code]) charset += ALLOWED_CODES[code];
    charset = [...new Set(charset.split(''))].join('');
    if (!charset) { console.log(chalk.red('No valid allowed characters selected.')); process.exit(1); }

    const bans = [];
    if (args.exclude) for (const code of args.exclude) if (EXCLUDE_CODES[code]) bans.push(EXCLUDE_CODES[code]);

    let minLen, maxLen;
    if (args.length.includes('-')) [minLen, maxLen] = args.length.split('-').map(x => parseInt(x));
    else minLen = maxLen = parseInt(args.length);

    const outputFile = args.file;
    const fileStream = fs.createWriteStream(outputFile, { flags: 'a' });

    let total = 0n;
    if (args.randomCount) total = BigInt(args.randomCount);
    else for (let L = minLen; L <= maxLen; L++) total += BigInt(Math.pow(charset.length, L));

    let count = 0n;
    const start = Date.now();
    const updateProgress = () => {
        const elapsed = (Date.now() - start) / 1000;
        const rate = count / BigInt(Math.max(1, Math.floor(elapsed)));
        const remaining = Number(total - count);
        const eta = rate > 0 ? Number(remaining) / Number(rate) : Infinity;
        const percent = Number((count * 100n) / total);
        process.stdout.write(`\r${chalk.green(count.toString())} / ${chalk.yellow(total.toString())} | ${percent}% | ${Number(rate).toFixed(1)} pw/s | ETA: ${eta.toFixed(1)}s   `);
    };

    if (args.randomCount) {
        while (count < BigInt(args.randomCount)) {
            const L = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
            const pw = randomPassword(charset, L);
            if (isIrrelevant(pw, bans)) continue;
            if (!fileStream.write(pw + os.EOL)) await new Promise(r => fileStream.once('drain', r));
            count++;
            if (count % 100n === 0n) updateProgress();
        }
    } else {
        for (const pw of generateAll(charset.split(''), minLen, maxLen)) {
            if (isIrrelevant(pw, bans)) continue;
            if (!fileStream.write(pw + os.EOL)) await new Promise(r => fileStream.once('drain', r));
            count++;
            if (count % 100n === 0n) updateProgress();
        }
    }

    await new Promise(resolve => fileStream.end(resolve));
    console.log(chalk.cyan(`\n\nDone. ${count} passwords saved to ${outputFile}`));
}

main();
