// Cross-platform `rm -rf` for the package.json scripts (Windows cmd.exe has
// no rm, so the old `rm -rf .next &&` prefix broke pnpm dev/build there).
// Usage: node script/clean.mjs .next .open-next
import fs from "node:fs";

for (const dir of process.argv.slice(2)) {
  fs.rmSync(dir, { recursive: true, force: true, maxRetries: 2 });
}
