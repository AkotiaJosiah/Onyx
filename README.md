# Onyx Password Generator

A strong, cross-platform password generator.  
Generates random passwords based on allowed/excluded characters and length ranges, and saves them automatically. Compatible with Windows, Linux, and macOS.

---

--Guide--

1. Clone the repositiory:

```bash
git clone https://github.com/AkotiaJosiah/Onyx.git
cd Onyx

2. Install Node.js required to run Onyx:

Windows/macOS: https://nodejs.org/
and follow the installer

Linux (Debian/Ubuntu):
```bash
sudo apt update
sudo apt install nodejs npm

3. Install required dependencies(chalk)
```bash
npm install

4. Run Onyx

Windows (CMD / PowerShell / Git Bash)
```powershell
node onyx.js -a l/u/d/s -e x/z -l 8-12 -f passwords.txt -n 1000

Linux / macOS
Make executable first

```bash
chmod +x onyx.js

Then run:
```bash
./onyx.js -a l/u/d/s -e x/z -l 8-12 -f passwords.txt -n 1000

or on any OS via node:
```bash
node onyx.js -a l/u/d/s -e x/z -l 8-12 -f passwords.txt -n 1000
"# Onyx" 
