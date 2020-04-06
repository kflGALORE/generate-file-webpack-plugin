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

    describe('relative target file paths', () => {
        const feature = 'relative-target-file-paths';

        it('should use configured output path', (done) => {
            test(done, testCase(feature,'with-output-path'));
        });

        it('should use default output path if no output path is configured', (done) => {
            const webpackDefaultOutputPath = path.normalize(path.resolve(__dirname, '../dist'));
            test(done, testCase(feature,'without-output-path'), webpackDefaultOutputPath);
        });

        it('should use configured output path with relative parent navigation', (done) => {
            const outputDir = path.resolve(__dirname, '.tmp/webpack/' + feature + '/with-relative-parent-navigation-alt');
            test(done, testCase(feature,'with-relative-parent-navigation'), outputDir);
        });
    });
});

function testCase(feature: string, scenario: string): string {
    return feature + '/' + scenario;
}

function test(done: DoneCallback, testCase: string, outputDir?: string) {
    const testDir = path.resolve(__dirname, 'webpack/' + testCase);
    const expectedOutputDir = path.resolve(testDir, 'expected');
    const actualOutputDir = outputDir? emptyDir(outputDir) : emptyDir(path.resolve(__dirname, '.tmp/webpack/' + testCase));

    process.env.testDir = testDir;
    process.env.outputDir = actualOutputDir;

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
                const actualFile = path.join(actualOutputDir, file);

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

            // Cleanup on success
            deleteDir(actualOutputDir);

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
    deleteDir(path);
    fs.mkdirSync(path, {recursive: true});

    return path;
}

function deleteDir(path: string) {
    if (fs.existsSync(path)) {
        rimraf.sync(path);
    }
}