const fs = require('fs');
const files = ['Design.js', 'Firm.js', 'Party.js', 'Stock.js', 'Challan.js', 'Bill.js'];
files.forEach(f => {
  const p = './src/models/' + f;
  let c = fs.readFileSync(p, 'utf8');
  if (!c.includes('companyId')) {
    c = c.replace(/  },\s*\{\s*timestamps/g, '    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },\n  },\n  { timestamps');
    fs.writeFileSync(p, c);
    console.log('Patched ' + f);
  }
});
