const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('route.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./app/api');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let modified = false;

  const sqlRegex = /^const sql = neon\(process\.env\.DATABASE_URL!\)\r?\n/m;
  if (sqlRegex.test(content)) {
    content = content.replace(sqlRegex, '');
    const handlerRegex = /^export async function (GET|POST|PATCH|DELETE|PUT)\((.*?)\) \{/gm;
    content = content.replace(handlerRegex, match => match + '\n  const sql = neon(process.env.DATABASE_URL!);\n');
    modified = true;
  }

  if (!content.includes('export const dynamic')) {
    // find the end of imports
    let lines = content.split('\n');
    let lastImportIndex = -1;
    for(let i=0; i<lines.length; i++) {
        if(lines[i].startsWith('import ')) lastImportIndex = i;
    }
    
    const configLines = '\nexport const dynamic = "force-dynamic";\nexport const runtime = "nodejs";\n';
    
    if (lastImportIndex !== -1) {
        lines.splice(lastImportIndex + 1, 0, configLines);
    } else {
        lines.unshift(configLines);
    }
    content = lines.join('\n');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(f, content);
  }
});
