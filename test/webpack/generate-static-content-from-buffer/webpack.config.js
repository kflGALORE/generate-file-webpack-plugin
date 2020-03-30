const path = require('path');
const fs = require('fs');
const {GenerateFileWebpackPlugin} = require('../../../src/index');

module.exports = {
    entry: path.resolve(__dirname, 'test.js'),
    plugins: [
        new GenerateFileWebpackPlugin({
            file: path.resolve(process.env.outputDir, 'output.txt'),
            content:
                fs.readFileSync(path.resolve(process.env.testDir, 'input.txt'))
        })
    ]
};