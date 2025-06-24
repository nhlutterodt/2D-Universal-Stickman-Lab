const fs = require('fs');
const path = require('path');

function findPackages(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      if (fs.existsSync(path.join(full, 'package.json'))) {
        results.push(full);
      } else {
        results.push(...findPackages(full));
      }
    }
  }
  return results;
}

const roots = ['packages', 'apps', 'cli'];
const all = roots.flatMap(r => findPackages(path.join(__dirname, '..', r)));
console.log('Workspace packages:');
all.forEach(p => console.log(' -', path.relative(path.join(__dirname, '..'), p)));
