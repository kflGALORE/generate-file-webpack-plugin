import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as webpack from "webpack";
import DoneCallback = jest.DoneCallback;

describe('webpack', () => {
    describe('generate static content', () => {
        const feature = 'generate-static-content';

        it('should generate from string', (done) => {
            testSuccess(done, testCase(feature, 'from-string'));
        });

        it('should generate from buffer', (done) => {
            testSuccess(done, testCase(feature, 'from-buffer'));
        });
    });

    describe('generate runtime content', () => {
        const feature = 'generate-runtime-content';

        it('should generate from function returning a string', (done) => {
            testSuccess(done, testCase(feature,'from-string-function'));
        });

        it('should generate from function returning a buffer', (done) => {
            testSuccess(done, testCase(feature,'from-buffer-function'));
        });

        it('should generate from anonymous function', (done) => {
            testSuccess(done, testCase(feature,'from-anonymous-function'));
        });

        it('should generate from arrow function', (done) => {
            testSuccess(done, testCase(feature,'from-arrow-function'));
        });
    });

    describe('relative target file paths', () => {
        const feature = 'relative-target-file-paths';

        it('should use configured output path', (done) => {
            testSuccess(done, testCase(feature,'with-output-path'));
        });

        it('should use default output path if no output path is configured', (done) => {
            const webpackDefaultOutputPath = path.normalize(path.resolve(__dirname, '../dist'));
            testSuccess(done, testCase(feature,'without-output-path'), webpackDefaultOutputPath);
        });

        it('should use configured output path with relative parent navigation', (done) => {
            const outputDir = path.resolve(__dirname, '.tmp/webpack/' + feature + '/with-relative-parent-navigation-alt');
            testSuccess(done, testCase(feature,'with-relative-parent-navigation'), outputDir);
        });
    });

    describe('generate promise content', () => {
        const feature = 'generate-promise-content';

        it('should generate from promise function', (done) => {
            testSuccess(done, testCase(feature,'from-promise-function'));
        });

        it('should generate from promise object', (done) => {
            testSuccess(done, testCase(feature,'from-promise-object'));
        });
    });

    describe('simplify usage', () => {
        const feature = 'simplify-usage';

        it('should generate using original plugin function name', (done) => {
            testSuccess(done, testCase(feature,'simple-import-with-original-name'));
        });
        it('should generate using custom plugin function name', (done) => {
            testSuccess(done, testCase(feature,'simple-import-with-custom-name'));
        });
        it('should generate using multiple generator configurations', (done) => {
            testSuccess(done, testCase(feature,'multiple-generator-configs'));
        });
    });

    describe('error handling', () => {
        const feature = 'error-handling';

        it('should fail if input file not found', (done) => {
            testFailure(done, testCase(feature,'input-file-not-found'),
                [
                    'ERROR in \\[GenerateFileWebpackPlugin\\]',
                    'no such file or directory',
                    'non-existing-input.txt'
                ]
            );
        });

        it('should fail on unsupported content source', (done) => {
            testFailure(done, testCase(feature,'unsupported-content-source'),
                [
                    'ERROR in \\[GenerateFileWebpackPlugin\\]',
                    'Unsupported content source:'
                ]
            );
        });
    });

});

function testCase(feature: string, scenario: string): string {
    return feature + '/' + scenario;
}

function testSuccess(done: DoneCallback, testCase: string, outputDir?: string) {
    const testEnv = TestEnv.of(testCase, outputDir);
    const config = require(testEnv.configFile);

    // Run Webpack
    webpack(config, (webpackError, webpackStats) => {
        if (webpackError) {
            return done(webpackError);
        }
        if (webpackStats.hasErrors()) {
            return done(webpackStats.toString());
        }

        fs.readdirSync(testEnv.expectedOutputDir).forEach((file) => {
            const expectedFile = path.resolve(testEnv.expectedOutputDir, file);
            const actualFile = path.join(testEnv.actualOutputDir, file);

            expectFile(actualFile)
                .toExist()
                .toHaveSameContentAs(expectedFile);
        });

        // Cleanup on success
        deleteDir(testEnv.actualOutputDir);

        done();
    });
}

function testFailure(done: DoneCallback, testCase: string, expectedFailureMessageParts: string[]) {
    const testEnv = TestEnv.of(testCase);
    const config = require(testEnv.configFile);

    // Run Webpack
    webpack(config, (webpackError, webpackStats) => {
        if (webpackError) {
            // Even in case of a failure we do NOT expect a Webpack error to occur.
            // Instead we expect the error to appear in the stats!
            return done(webpackError);
        }

        expect(webpackStats.hasErrors()).toBe(true);
        expect(webpackStats.toString()).toMatch(new RegExp(expectedFailureMessageParts.join('.*') + '.*$', 'm'));

        // Cleanup on success
        deleteDir(testEnv.actualOutputDir);

        done();
    });
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

function expectFile(file: string): FileExpectations {
    return new FileExpectations(file);
}

class FileExpectations {
    constructor(public actualFile: string) {
    }

    public toExist(): FileExpectations {
        try {
            expect(fs.existsSync(this.actualFile)).toBe(true);
        } catch (e) {
            throw this.describe(e, 'to exist');
        }
        return this;
    }

    public toHaveSameContentAs(expectedFile: string): FileExpectations {
        try {
            expect(FileExpectations.fileContent(this.actualFile)).toEqual(FileExpectations.fileContent(expectedFile));
        } catch (e) {
            throw this.describe(e, 'to have same content as [' + expectedFile + ']');
        }
        return this;
    }

    private describe(e: Error, description: string): Error {
        e.message =
            'expected file\n  [' + this.actualFile + ']\n' + description + '\n\n' +
            'caused by:\n' +  e.message;
        return e;
    }

    private static fileContent(path: string): string | null {
        if (! fs.existsSync(path)) {
            return null;
        }
        return fs.readFileSync(path, 'utf-8');
    }
}

class TestEnv {
    static of(testCase: string, outputDir?: string): TestEnv {
        const testDir = path.resolve(__dirname, 'webpack/' + testCase);
        const expectedOutputDir = path.resolve(testDir, 'expected');
        const actualOutputDir = outputDir? emptyDir(outputDir) : emptyDir(path.resolve(__dirname, '.tmp/webpack/' + testCase));
        const configFile = path.resolve(testDir, 'webpack.config.js');

        process.env.testDir = testDir;
        process.env.outputDir = actualOutputDir;

        return new TestEnv(testDir, expectedOutputDir, actualOutputDir, configFile);
    }

    constructor(public testDir: string, public expectedOutputDir: string, public actualOutputDir: string, public configFile: string) {}
}