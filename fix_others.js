const fs = require("fs");

function addCache(filePath, functions) {
  let code = fs.readFileSync(filePath, "utf8");
  
  // Add import if not present
  if (!code.includes("import { cache }")) {
    if (code.includes("import \"server-only\"")) {
      code = code.replace("import \"server-only\"", "import \"server-only\"\nimport { cache } from \"react\"");
    } else {
      code = "import { cache } from \"react\"\n" + code;
    }
  }

  for (const fn of functions) {
    const regex = new RegExp(`export async function ${fn}([\\s\\S]*?)\n}`, "m");
    code = code.replace(regex, `export const ${fn} = cache(async function ${fn}$1\n})`);
  }

  fs.writeFileSync(filePath, code);
}

addCache("lib/site-settings.ts", ["getSiteSettings"]);
addCache("lib/repositories/filters.ts", ["getFilterAggregations"]);
addCache("lib/repositories/feeds.ts", ["getFeedConfigurationById", "listFeedConfigurations", "countFeedProducts", "streamFeedProducts"]);
addCache("lib/repositories/reviews.ts", ["getReviewsByProductId"]);
addCache("lib/auth-database.ts", ["findUserById", "findUserByEmail"]);

