#!/usr/bin/env node
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const PASSWORD_FILE = path.join(__dirname, 'passwords.txt');

function generatePassword(charset, length) {
  while (true) {
    let pw = '';
    for (let i = 0; i < length; i++) {
      pw += charset[Math.floor(Math.random() * charset.length)];
    }
    if (
      /[a-z]/.test(pw) &&
      /[A-Z]/.test(pw) &&
      /[0-9]/.test(pw) &&
      /[!@#$%^&*()_+\[\]{}|;:,.<>?/~`-=]/.test(pw)
    ) return pw;
  }
}

function savePassword(pw) {
  fs.appendFileSync(PASSWORD_FILE, pw + '\n');
}

rl.question('Enter allowed characters: ', (chars) => {
  rl.question('Enter password length: ', (lenInput) => {
    const length = parseInt(lenInput);
    console.log(`\nGenerating passwords... Saved to ${PASSWORD_FILE}`);
    console.log('Press Ctrl+C to stop.\n');

    if (!fs.existsSync(PASSWORD_FILE)) fs.writeFileSync(PASSWORD_FILE, '');

    function loop() {
      const pw = generatePassword(chars, length);
      console.log(pw);
      savePassword(pw);
      setImmediate(loop);
    }

    loop();
  });
});
