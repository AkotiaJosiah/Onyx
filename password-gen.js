#!/usr/bin/env node

const fs = require("fs");
const readline = require("readline");

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans);
  }));
}

// Generator for all possible passwords
function* generateAll(charset, length) {
  const n = charset.length;
  const indices = Array(length).fill(0);

  while (true) {
    yield indices.map(i => charset[i]).join("");

    // Increase like odometer
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

async function main() {
  const charset = await askQuestion("Enter allowed characters: ");
  const length = parseInt(await askQuestion("Enter password length: "), 10);
  const fileName = await askQuestion("Enter filename to save passwords: ");

  const total = BigInt(Math.pow(charset.length, length));
  const file = fs.createWriteStream(fileName, { flags: "a" });

  let count = 0n;
  const barLength = 30n; // number of symbols in progress bar

  const gen = generateAll(charset.split(""), length);

  for (let pw of gen) {
    if (!file.write(pw + "\n")) {
      // backpressure handling
      await new Promise(resolve => file.once("drain", resolve));
    }
    count++;

    // Show progress bar (with "=" instead of "#")
    if (count % 1000n === 0n || count === total) {
      const percent = Number((count * 100n) / total);
      const filled = Math.floor((percent / 100) * Number(barLength));

      process.stdout.write(
        `\rProgress: [${"=".repeat(filled)}${"-".repeat(Number(barLength) - filled)}] ${percent}%`
      );
    }
  }

  await new Promise(resolve => file.end(resolve)); // <-- ensures file closes & flushes
  console.log(`\nDone. ${count} passwords saved to ${fileName}`);
}

main();
