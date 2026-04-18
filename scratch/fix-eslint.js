const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('app', function(filePath) {
    if (filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        content = content.replace(/We're/g, 'We&apos;re')
                         .replace(/we're/g, 'we&apos;re')
                         .replace(/we'll/g, 'we&apos;ll')
                         .replace(/We'll/g, 'We&apos;ll')
                         .replace(/we've/g, 'we&apos;ve')
                         .replace(/We've/g, 'We&apos;ve')
                         .replace(/You're/g, 'You&apos;re')
                         .replace(/you're/g, 'you&apos;re')
                         .replace(/you'll/g, 'you&apos;ll')
                         .replace(/You'll/g, 'You&apos;ll')
                         .replace(/you've/g, 'you&apos;ve')
                         .replace(/they're/g, 'they&apos;re')
                         .replace(/They're/g, 'They&apos;re')
                         .replace(/isn't/g, 'isn&apos;t')
                         .replace(/don't/g, 'don&apos;t')
                         .replace(/doesn't/g, 'doesn&apos;t')
                         .replace(/didn't/g, 'didn&apos;t')
                         .replace(/can't/g, 'can&apos;t')
                         .replace(/Can't/g, 'Can&apos;t')
                         .replace(/won't/g, 'won&apos;t')
                         .replace(/it's/g, 'it&apos;s')
                         .replace(/It's/g, 'It&apos;s')
                         .replace(/that's/g, 'that&apos;s')
                         .replace(/That's/g, 'That&apos;s')
                         .replace(/there's/g, 'there&apos;s')
                         .replace(/There's/g, 'There&apos;s')
                         .replace(/what's/g, 'what&apos;s')
                         .replace(/What's/g, 'What&apos;s')
                         .replace(/Let's/g, 'Let&apos;s')
                         .replace(/let's/g, 'let&apos;s')
                         .replace(/I'm/g, 'I&apos;m')
                         .replace(/I'll/g, 'I&apos;ll')
                         .replace(/I've/g, 'I&apos;ve')
                         .replace(/hasn't/g, 'hasn&apos;t')
                         .replace(/haven't/g, 'haven&apos;t')
                         .replace(/today's/g, 'today&apos;s')
                         .replace(/\"(30-day|money-back|No Questions Asked)\"/g, '&quot;$1&quot;')
                         .replace(/\"(TCG Lore|Tire Vix|Legal Entity)\"/g, '&quot;$1&quot;')
                         .replace(/\"(AS IS)\"/gi, '&quot;$1&quot;');
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
        }
    }
});
console.log('JSX entity replacements complete');
