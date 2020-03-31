import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as webpack from "webpack";
import DoneCallback = jest.DoneCallback;

describe('webpack', () => {
    describe('generate static content', () => {
        const feature = 'generate-static-content';

        it('should generate from string', (done) => {
            test(done, testCase(feature, 'from-string'));
        });

        it('should generate from buffer', (done) => {
            test(done, testCase(feature, 'from-buffer'));
        });
    });

    describe('generate runtime content', () => {
        const feature = 'generate-runtime-content';

        it('should generate from function returning a string', (done) => {
            test(done, testCase(feature,'from-string-function'));
        });

        it('should generate from function returning a buffer', (done) => {
            test(done, testCase(feature,'from-buffer-function'));
        });

        it('should generate from anonymous function', (done) => {
            test(done, testCase(feature,'from-anonymous-function'));
        });

        it('should generate from arrow function', (done) => {
            test(done, testCase(feature,'from-arrow-function'));
        });
    });
});

function testCase(feature: string, scenario: string): string {
    return feature + '/' + scenario;
}

function test(done: DoneCallback, testCase: string) {
    const testDir = path.resolve(__dirname, 'webpack/' + testCase);
    const expectedOutputDir = path.resolve(testDir, 'expected');
    const outputDir = emptyDir(path.resolve(__dirname, '.tmp/webpack/' + testCase));

    process.env.testDir = testDir;
    process.env.outputDir = outputDir;

    const configFile = path.resolve(testDir, 'webpack.config.js');
    const config = require(configFile);

    // Run Webpack
    webpack(config, (webpackError, webpackStats) => {
        if (webpackError) {
            return done(webpackError);
        }
        if (webpackStats.hasErrors()) {
            return done(webpackStats.toString());
        }
        try {
            fs.readdirSync(expectedOutputDir).forEach((file) => {
                const expectedFile = path.resolve(expectedOutputDir, file);
                const actualFile = path.join(outputDir, file);

                try {
                    expect(fs.existsSync(actualFile)).toBe(true);
                } catch (e) {
                    throw new Error('file-exists [' + actualFile + ']\n' + e.toString());
                }
                try {
                    expect(fileContent(actualFile)).toEqual(fileContent(expectedFile));
                } catch (e) {
                    throw new Error('file-content-equals [' + actualFile + '] [' + expectedFile + ']\n' + e.toString());
                }
            });
            done();
        } catch (e) {
            done(e);
        }
    });
}

function fileContent(path: string): string | null {
    if (! fs.existsSync(path)) {
        return null;
    }
    return fs.readFileSync(path, 'utf-8');
}

function emptyDir(path: string): string {
    if (fs.existsSync(path)) {
        rimraf.sync(path);
    }
    fs.mkdirSync(path, {recursive: true});

    return path;
}