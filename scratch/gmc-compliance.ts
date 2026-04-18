import fs from 'fs';
import path from 'path';

const dirsToScan = ['app', 'lib', 'components'];

const fileExtensions = ['.tsx', '.ts', '.js', '.jsx'];

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // 1. Company name replacements
  // First, fix the DBA one to avoid redundancy
  newContent = newContent.replace(/TOY HAULERZ LLC DBA TGC Lore/g, 'TCG Lore Operated by A TOY HAULERZ LLC Company');
  newContent = newContent.replace(/TOY HAULERZ LLC DBA TCG Lore/g, 'TCG Lore Operated by A TOY HAULERZ LLC Company');
  
  // Then explicit Inc ones
  const incRegex = /\b(?:TGC|TCG)\s+Lore(?:,\s*Inc\.?|\s+Inc\.?)\b/gi;
  newContent = newContent.replace(incRegex, 'TCG Lore Operated by A TOY HAULERZ LLC Company');

  // Then standalone ones, avoiding .com, email, and already replaced ones
  const standaloneRegex = /\b(?:TGC|TCG)\s+Lore\b(?!\s*Operated by A TOY HAULERZ LLC Company)(?![\w\-\.])/gi;
  newContent = newContent.replace(standaloneRegex, 'TCG Lore Operated by A TOY HAULERZ LLC Company');

  // 2. Address replacement
  // We saw '1924 N Miami Ave, Miami, FL 33136, United States' and '1924 N Miami Ave'
  const oldAddress1 = /1924 N Miami Ave, Miami, FL 33136, United States/gi;
  const oldAddress2 = /1924 N Miami Ave/gi;
  const miamiFL = /Miami, FL 33136/gi;
  const miamiFlorida = /Miami, Florida/gi;
  
  newContent = newContent.replace(oldAddress1, '1757 NORTH CENTRAL AVENUE, FLAGLER BEACH, FL 32136');
  newContent = newContent.replace(oldAddress2, '1757 NORTH CENTRAL AVENUE');
  newContent = newContent.replace(miamiFL, 'FLAGLER BEACH, FL 32136');
  // Also 'Miami, Florida TGC Lore...' in about page
  newContent = newContent.replace(/Miami,\s*Florida\s*TCG Lore Operated by A TOY HAULERZ LLC Company/gi, 'Flagler Beach, Florida TCG Lore Operated by A TOY HAULERZ LLC Company');

  // 3. Payment Methods
  // "We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, Google Pay, and Shop Pay. All payments are processed securely through encrypted connections."
  newContent = newContent.replace(/We accept all major credit cards \(Visa, MasterCard, American Express, Discover\), PayPal, Apple Pay, Google Pay, and Shop Pay\./gi, 'We accept Credit Card payments.');
  newContent = newContent.replace(/We accept all major credit cards \(Visa, MasterCard, American Express, Discover\), PayPal, and Apple Pay for secure transactions\./gi, 'We accept Credit Card payments.');
  newContent = newContent.replace(/We accept all major credit cards \(Visa, Mastercard, American Express, Discover\), PayPal, and other secure payment methods\./gi, 'We accept Credit Card payments.');
  
  // Specific list items or generic mentions
  newContent = newContent.replace(/<li>• Digital wallets \(PayPal, Apple Pay, etc\.\)<\/li>/gi, '');
  newContent = newContent.replace(/Stripe, PayPal, and other secure payment gateways/gi, 'secure Credit Card processing gateways');
  newContent = newContent.replace(/Secure payment processing services \(Stripe, PayPal\)/gi, 'Secure payment processing services');

  // Footer specific items
  // <div className="font-medium text-sm">PayPal</div>
  newContent = newContent.replace(/<div className="font-medium text-sm">PayPal<\/div>/gi, '');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${filePath}`);
    return true;
  }
  return false;
}

function walkDir(dir: string, callback: (filePath: string) => void) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      const ext = path.extname(fullPath);
      if (fileExtensions.includes(ext)) {
        callback(fullPath);
      }
    }
  }
}

let count = 0;
for (const dir of dirsToScan) {
  walkDir(dir, (filePath) => {
    if (processFile(filePath)) {
      count++;
    }
  });
}

console.log(`Total files updated: ${count}`);
