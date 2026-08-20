const parser = require('@babel/parser');
try {
    parser.parse(`const A = () => <div><div>hello</div>;`, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
} catch(e) { console.log(e.message); }
