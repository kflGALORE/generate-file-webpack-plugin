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

    describe('generate promise content', () => {
        const feature = 'generate-promise-content';

        it('should generate from promise function', (done) => {
            test(done, testCase(feature,'from-promise-function'));
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

        fs.readdirSync(expectedOutputDir).forEach((file) => {
            const expectedFile = path.resolve(expectedOutputDir, file);
            const actualFile = path.join(actualOutputDir, file);

            waitForFile(actualFile, 100, 5_000)
                .then(() => {
                    expectFile(actualFile)
                        .toExist()
                        .toHaveSameContentAs(expectedFile);

                    // Cleanup on success
                    deleteDir(actualOutputDir);

                    done();
                })
        });
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

/*
 * Note: The returned promise will resolve even if the specified file does not exists after the timeout exceeded.
 */
function waitForFile(file:string , checkInterval: number, timeout: number): Promise<boolean> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        function check() {
            try {
                if (fs.existsSync(file)) {
                    resolve(true);
                    return;
                }

                const elapsedTime = Date.now() - startTime;
                if (elapsedTime > timeout) {
                    resolve(false);
                    return;
                }

                setTimeout(check, checkInterval);
            } catch (e) {
                reject(e);
            }
        }

        check();
    });
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