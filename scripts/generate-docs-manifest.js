const fs = require('fs');
const path = require('path');

const routesFile = path.join(
    __dirname,
    '../src/app/common/common-routing.module.ts'
);
const outFile = path.join(__dirname, '../src/assets/docs-pages.json');

const src = fs.readFileSync(routesFile, 'utf8');

const routeBlockRe = /\{[^{}]*'path'\s*:\s*'docs[^']*'[^{}]*\}/g;
const pages = [];

let block;
while ((block = routeBlockRe.exec(src)) !== null) {
    const pathMatch = block[0].match(/'path'\s*:\s*'(docs[^']*)'/);
    const titleMatch = block[0].match(/'title'\s*:\s*'((?:[^'\\]|\\.)*)'/);
    if (!pathMatch) continue;

    const routePath = pathMatch[1];
    const pagePath = '/' + routePath;
    const title = titleMatch
        ? titleMatch[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\')
        : undefined;

    if (!pages.some((p) => p.path === pagePath)) {
        pages.push({ path: pagePath, ...(title ? { title } : {}) });
    }
}

pages.sort((a, b) => a.path.localeCompare(b.path));
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(pages, null, 4) + '\n');
console.log(`docs-pages.json: ${pages.length} page(s) -> ${outFile}`);
