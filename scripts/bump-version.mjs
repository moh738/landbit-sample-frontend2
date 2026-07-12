// scripts/bump-version.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkgPath = resolve(__dirname, '..', 'package.json');

const text = await readFile(pkgPath, 'utf8');
const pkg = JSON.parse(text);

// Ensure a valid semver-like version exists
const parts = String(pkg.version || '0.0.0')
  .split('.')
  .map((n) => Number(n) || 0);
while (parts.length < 3) parts.push(0);

// Increment PATCH (x.y.z -> x.y.(z+1)).
parts[2] += 1;
pkg.version = parts.join('.');

await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

console.log(`✅ Bumped version to ${pkg.version}`);
