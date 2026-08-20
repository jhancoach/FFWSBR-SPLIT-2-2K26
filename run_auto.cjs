const { execSync } = require('child_process');

for (let i = 0; i < 50; i++) {
    try {
        execSync('node auto_fix_babel.cjs', { stdio: 'inherit' });
        break;
    } catch (e) {
        console.log("Error on iteration", i);
    }
}
