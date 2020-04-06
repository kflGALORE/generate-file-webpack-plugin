const fs = require('fs');
const path = require('path');
const {GenerateFileWebpackPlugin} = require('../../../../src/index');

module.exports = {
    entry: path.resolve(__dirname, 'test.js'),
    output: {
        path: process.env.outputDir
    },
    plugins: [
        new GenerateFileWebpackPlugin({
            file: path.resolve(process.env.outputDir, 'output.txt'),
            content: () => {
                return fs.readFileSync(path.resolve(process.env.testDir, 'input.txt'));
            }
        })
    ]
};