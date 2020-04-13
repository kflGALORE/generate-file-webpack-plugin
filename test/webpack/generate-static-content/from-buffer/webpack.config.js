const path = require('path');
const fs = require('fs');
const generate = require('../../../../src/index');

module.exports = {
    entry: path.resolve(__dirname, 'test.js'),
    output: {
        path: process.env.outputDir
    },
    plugins: [
        generate({
            file: path.resolve(process.env.outputDir, 'output.txt'),
            content:
                fs.readFileSync(path.resolve(process.env.testDir, 'input.txt'))
        })
    ]
};