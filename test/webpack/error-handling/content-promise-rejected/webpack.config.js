const path = require('path');
const generate = require('../../../../src/index');

module.exports = {
    entry: path.resolve(__dirname, 'test.js'),
    output: {
        path: process.env.outputDir
    },
    plugins: [
       generate({
            file: path.resolve(process.env.outputDir, 'output.txt'),
            content: () => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject('promise rejected');
                    }, 500);
                });
            }
        })
    ]
};