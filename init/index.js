#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// URL of your GitHub repository (replace with your repo)
const repoURL = 'https://github.com/csagar131/next14-shadcn';

// Directory where the app will be installed
const targetDir = process.argv[2] || 'my-next-shadcn-app'; // defaults to 'my-next-shadcn-app' if no directory specified

// Function to execute shell commands
function runCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error executing command: ${command}`, error);
    process.exit(1);
  }
}

// Clone the repository
console.log(`Cloning repository from ${repoURL}...`);
runCommand(`git clone ${repoURL} ${targetDir}`);

// Change into the directory
process.chdir(targetDir);

// Check if the directory exists
if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
  console.error('Cloning failed or invalid repository. No package.json found.');
  process.exit(1);
}

// Install dependencies
console.log('Installing dependencies...');
runCommand('npm install');

console.log('Next.js + Shadcn app setup complete!');
