import fs from 'fs';
import path from 'path';

const dir = 'c:/Users/admin/Documents/Toy App/b_UOCfTeKk43v-1774686443811/lib/email/templates';
const files = [
  'welcome.tsx',
  'password-reset.tsx',
  'password-changed.tsx',
  'order-confirmation.tsx',
  'email-verification.tsx'
];

for (const file of files) {
  const filepath = path.join(dir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  
  if (file === 'welcome.tsx') {
    content = content.replace(
      '<h1 style={{ color: "white", margin: 0, fontSize: "32px" }}>Welcome to TCG Lore Inc.!</h1>',
      `<img src={\`\${process.env.NEXT_PUBLIC_APP_URL || "https://www.tgclore.com"}/logo.png\`} alt="TGC Lore Logo" width="180" style={{ height: "auto", display: "block", margin: "0 auto" }} />\n            <p style={{ color: "white", margin: "10px 0 0 0", fontSize: "20px" }}>Welcome to our community!</p>`
    );
  } else if (file === 'order-confirmation.tsx') {
    content = content.replace(
      '<h1 style={{ color: "white", margin: 0, fontSize: "28px" }}>TCG Lore Inc.</h1>',
      `<img src={\`\${process.env.NEXT_PUBLIC_APP_URL || "https://www.tgclore.com"}/logo.png\`} alt="TGC Lore Logo" width="180" style={{ height: "auto", display: "block", margin: "0 auto" }} />`
    );
  } else {
    content = content.replace(
      '<h1 style={{ color: "white", margin: 0, fontSize: "32px" }}>TCG Lore Inc.</h1>',
      `<img src={\`\${process.env.NEXT_PUBLIC_APP_URL || "https://www.tgclore.com"}/logo.png\`} alt="TGC Lore Logo" width="180" style={{ height: "auto", display: "block", margin: "0 auto" }} />`
    );
  }

  // Also replace footer text in email templates just in case
  content = content.replace("TGC Lore Inc.", "TGC Lore");
  content = content.replace("TCG Lore Inc.", "TGC Lore");

  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`Updated ${file}`);
}
