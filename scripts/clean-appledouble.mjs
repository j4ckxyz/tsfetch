#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
let removed = 0;

function walk(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.name.startsWith("._")) {
      fs.rmSync(fullPath, { force: true, recursive: true });
      removed += 1;
      continue;
    }

    if (entry.isDirectory()) {
      walk(fullPath);
    }
  }
}

walk(root);
process.stdout.write(`Removed ${removed} AppleDouble file(s)\n`);
