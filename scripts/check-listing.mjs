// Checks Play Store field lengths in docs/store-listing.md.
import { readFileSync } from 'node:fs';

const text = readFileSync(new URL('../docs/store-listing.md', import.meta.url), 'utf8');
const field = (heading) => {
  const start = text.indexOf(`## ${heading}`);
  const block = text.slice(start).match(/```\n([\s\S]*?)\n```/);
  return block ? block[1] : '';
};
const limits = { 'App name': 30, 'Short description': 80, 'Full description': 4000 };
let ok = true;
for (const [name, max] of Object.entries(limits)) {
  const value = field(name);
  const length = [...value].length;
  const pass = length > 0 && length <= max;
  ok &&= pass;
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}: ${length}/${max}`);
}
process.exit(ok ? 0 : 1);
