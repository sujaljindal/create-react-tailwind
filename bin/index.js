#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });
};

const projectName = process.argv[2];

if (!projectName) {
  console.error("❌ Please provide a project name");
  process.exit(1);
}

const run = (cmd, options = {}) => {
  console.log(`\n> ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit", ...options });
  } catch (error) {
    console.error(`❌ Command failed: ${cmd}`);
    process.exit(1);
  }
};

const createProject = async () => {
  console.log(`\n🚀 Creating new Vite + Tailwind project: ${projectName}\n`);

  // Step 1: Ask for framework
  const framework = await askQuestion(
    "Select a framework (react, vue, svelte, etc.) [react]: "
  ) || "react";

  // Step 2: Ask for variant
  const variant = await askQuestion(
    "Select a variant (javascript, typescript) [javascript]: "
  ) || "javascript";

  // Step 3: Determine correct template name
  let template;
  if (framework === 'react') {
    template = variant === 'typescript' ? 'react-ts' : 'react';
  } else if (framework === 'vue') {
    template = variant === 'typescript' ? 'vue-ts' : 'vue';
  } else if (framework === 'svelte') {
    template = variant === 'typescript' ? 'svelte-ts' : 'svelte';
  } else {
    template = framework;
  }

  // Step 4: Scaffold project
  run(`npm create vite@latest "${projectName}" -- --template ${template}`);

  // Step 5: Change directory
  process.chdir(path.join(process.cwd(), projectName));

  // Step 6: Install dependencies
  run(`npm install`);
  run(`npm install -D tailwindcss@latest postcss@latest autoprefixer@latest @tailwindcss/postcss`);

  // Step 7: Create config files
  fs.writeFileSync(
    "tailwind.config.js",
    `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,${framework === 'vue' ? 'vue' : ''}${framework === 'svelte' ? 'svelte' : ''}}",
  ],
  experimental: {
    optimizeUniversalDefaults: true
  },
  plugins: [],
};`
  );

  fs.writeFileSync(
    "postcss.config.js",
    `export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};`
  );

  // Step 8: Create CSS file
  fs.writeFileSync(
    path.join("src", "index.css"),
    `@import "tailwindcss";`
  );

  // Step 9: Ensure CSS is imported in main file
  const mainFile = framework === 'vue' ? 
    'src/main.js' : 
    variant === 'typescript' ? 'src/main.tsx' : 'src/main.jsx';
  
  let mainContent = fs.readFileSync(mainFile, "utf-8");
  if (!mainContent.includes("./index.css")) {
    fs.writeFileSync(
      mainFile,
      `import './index.css';\n${mainContent}`
    );
  }

  // Step 10: Create test component
  const appFile = framework === 'vue' ? 'src/App.vue' : 
    variant === 'typescript' ? 'src/App.tsx' : 'src/App.jsx';
  
  const testComponent = framework === 'vue' ? `
<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold mb-4">Tailwind CSS v4 Test</h1>
    <div class="p-4 bg-blue-500/20 rounded-lg border border-blue-500">
      <p>If this has light blue background, Tailwind is working!</p>
    </div>
  </div>
</template>
` : `
export default function App() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Tailwind CSS v4 Test</h1>
      <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500">
        <p>If this has light blue background, Tailwind is working!</p>
      </div>
    </div>
  );
}
`;

  fs.writeFileSync(appFile, framework === 'vue' ? 
    `<script ${variant === 'typescript' ? 'lang="ts"' : ''} setup>
</script>

${testComponent}
` : testComponent);

  console.log(`\n✅ Setup complete! Run:
  cd "${path.join(process.cwd())}"
  npm run dev\n`);

  rl.close();
};

createProject();