const fs = require('fs');
let code = fs.readFileSync('apps/api/src/__tests__/qr-attendance.unit.test.js', 'utf8');

code = code.replace(
  `const str = args.join(' ');`,
  `const str = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');`
);

fs.writeFileSync('apps/api/src/__tests__/qr-attendance.unit.test.js', code);
