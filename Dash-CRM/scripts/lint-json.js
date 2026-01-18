const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();
const errors = [];
const targets = [];

function hasUtf8Bom(buffer) {
  return (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  );
}

function shouldSkipDir(name) {
  return (
    name === "node_modules" ||
    name === ".git" ||
    name === ".next" ||
    name === "dist" ||
    name === "build"
  );
}

function isTargetPackageJson(filePath) {
  const rel = path.relative(rootDir, filePath);
  const parts = rel.split(path.sep);
  return parts.includes("apps") || parts.includes("packages");
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) {
        continue;
      }
      walk(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name === "package.json" && isTargetPackageJson(fullPath)) {
      targets.push(fullPath);
    }
  }
}

walk(rootDir);

if (targets.length === 0) {
  console.log("No apps/**/package.json or packages/**/package.json found.");
  process.exit(0);
}

for (const filePath of targets) {
  const buffer = fs.readFileSync(filePath);
  if (hasUtf8Bom(buffer)) {
    errors.push(`${filePath} has UTF-8 BOM`);
    continue;
  }
  try {
    JSON.parse(buffer.toString("utf8"));
  } catch (err) {
    errors.push(`${filePath} invalid JSON: ${err.message}`);
  }
}

if (errors.length) {
  console.error("JSON lint failed:");
  for (const message of errors) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log(`Validated ${targets.length} package.json files.`);
