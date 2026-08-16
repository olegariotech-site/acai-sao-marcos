import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const required = [
  'assets/css/mobile-fixes.css?v=20260816-clickfix-2',
  'assets/js/site-v2.js?v=20260816-clickfix-2',
  'assets/js/mobile-fixes.js?v=20260816-clickfix-2'
];

const missing = required.filter((item) => !html.includes(item));
if (missing.length) {
  console.error(`Assets sem versão nova: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Assets críticos de clique com cache-bust novo.');
