const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();
const errors = [];

function shouldSkipDir(name) {
  return name === "node_modules" || name === ".git" || name === ".next" || name === ".turbo";
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) continue;
      walk(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name === "package-lock.json") {
      const rel = path.relative(rootDir, fullPath).split(path.sep).join("/");
      if (rel !== "package-lock.json") {
        errors.push(`Unexpected lockfile: ${rel}`);
      }
    }
    if (entry.isFile() && entry.name === "yarn.lock") {
      errors.push("Found yarn.lock; remove to avoid mixed package managers.");
    }
    if (entry.isFile() && entry.name === "pnpm-lock.yaml") {
      errors.push("Found pnpm-lock.yaml; remove to avoid mixed package managers.");
    }
  }
}

walk(rootDir);

if (errors.length) {
  console.error("Lockfile check failed:");
  for (const message of errors) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log("Lockfile check passed.");
