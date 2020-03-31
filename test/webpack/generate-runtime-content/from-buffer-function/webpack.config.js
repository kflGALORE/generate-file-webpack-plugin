const fs = require('fs');
const path = require('path');
const {GenerateFileWebpackPlugin} = require('../../../../src/index');

module.exports = {
    entry: path.resolve(__dirname, 'test.js'),
    plugins: [
        new GenerateFileWebpackPlugin({
            file: path.resolve(process.env.outputDir, 'output.txt'),
            content: generateContent
        })
    ]
};

function generateContent() {
    return fs.readFileSync(path.resolve(process.env.testDir, 'input.txt'));
}