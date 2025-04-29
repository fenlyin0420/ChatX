const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const htmlPath = 'index.html';

let html = fs.readFileSync(htmlPath, 'utf-8');

const tagRegex = /<(script|link)([^>]+?(src|href)\s*=\s*["'])([^"']*?\{hash\}[^"']*)(["'][^>]*)>/g;

html = html.replace(tagRegex, (match, tag, beforeAttr, attrType, url, afterAttr) => {
    const originalUrl = url.replace(/\.{hash}\./, '.');
    const filePath = path.resolve(path.dirname(htmlPath), originalUrl);

    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ File not found: ${filePath}`);
        return match;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex').slice(0, 8);
    const newUrl = url.replace('{hash}', hash);

    return `<${tag}${beforeAttr}${newUrl}${afterAttr}>`;
});

fs.writeFileSync('index.hashed.html', html, 'utf-8');
console.log('✅ index.hashed.html 已生成');
