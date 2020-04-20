import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as webpack from "webpack";
import DoneCallback = jest.DoneCallback;

describe('webpack', () => {
    describe('generate static content', () => {
        const feature = 'generate-static-content';

        it('should generate from string', (done) => {
            test(done, feature, 'from-string', success());
        });

        it('should generate from buffer', (done) => {
            test(done, feature, 'from-buffer', success());
        });
    });

    describe('generate runtime content', () => {
        const feature = 'generate-runtime-content';

        it('should generate from function returning a string', (done) => {
            test(done, feature, 'from-string-function', success());
        });

        it('should generate from function returning a buffer', (done) => {
            test(done, feature, 'from-buffer-function', success());
        });

        it('should generate from anonymous function', (done) => {
            test(done, feature, 'from-anonymous-function', success());
        });

        it('should generate from arrow function', (done) => {
            test(done, feature, 'from-arrow-function', success());
        });
    });

    describe('relative target file paths', () => {
        const feature = 'relative-target-file-paths';

        it('should use configured output path', (done) => {
            test(done, feature, 'with-output-path', success());
        });

        it('should use default output path if no output path is configured', (done) => {
            const webpackDefaultOutputPath = path.normalize(path.resolve(__dirname, '../dist'));
            test(done, feature, 'without-output-path', {
                result: TestResult.Success,
                outputDir: webpackDefaultOutputPath
            });
        });

        it('should use configured output path with relative parent navigation', (done) => {
            const outputDir = path.resolve(__dirname, '.tmp/webpack/' + feature + '/with-relative-parent-navigation-alt');
            test(done, feature, 'with-relative-parent-navigation', {
                result: TestResult.Success,
                outputDir: outputDir
            });
        });
    });

    describe('generate promise content', () => {
        const feature = 'generate-promise-content';

        it('should generate from promise function', (done) => {
            test(done, feature, 'from-promise-function', success());
        });

        it('should generate from promise object', (done) => {
            test(done, feature, 'from-promise-object', success());
        });
    });

    describe('simplify usage', () => {
        const feature = 'simplify-usage';

        it('should generate using original plugin function name', (done) => {
            test(done, feature, 'simple-import-with-original-name', success());
        });
        it('should generate using custom plugin function name', (done) => {
            test(done, feature, 'simple-import-with-custom-name', success());
        });
        it('should generate using multiple generator configurations', (done) => {
            test(done, feature, 'multiple-generator-configs', success());
        });
    });

    describe('error handling', () => {
        const feature = 'error-handling';

        it('should fail if input file not found', (done) => {
            test(done, feature, 'input-file-not-found', {
                result: TestResult.Failure,
                expectedMessages: [
                    [
                        'ERROR in \\[GenerateFileWebpackPlugin\\] \\[output.txt\\]',
                        'no such file or directory',
                        'non-existing-input.txt'
                    ]
                ]
            });
        });

        it('should fail on unsupported content source', (done) => {
            test(done, feature, 'unsupported-content-source', {
                result: TestResult.Failure,
                expectedMessages:[
                    [
                        'ERROR in \\[GenerateFileWebpackPlugin\\] \\[output.txt\\]',
                        'Unsupported content source: URL'
                    ]
                ]
            });
        });

        it('should fail on function with unsupported content source', (done) => {
            test(done, feature, 'unsupported-content-source-function', {
                result: TestResult.Failure,
                expectedMessages: [
                    [
                        'ERROR in \\[GenerateFileWebpackPlugin\\] \\[output.txt\\]',
                        'Unsupported function content source: URL'
                    ]
                ]
            });
        });

        it('should fail on error executing content function', (done) => {
            test(done, feature, 'content-function-error', {
                result: TestResult.Failure,
                expectedMessages: [
                    [
                        'ERROR in \\[GenerateFileWebpackPlugin\\] \\[output.txt\\]',
                        'error while executing content function'
                    ]
                ]
            });
        });

        it('should fail on content promise rejection', (done) => {
            test(done, feature, 'content-promise-rejected', {
                result: TestResult.Failure,
                expectedMessages: [
                    [
                        'ERROR in \\[GenerateFileWebpackPlugin\\] \\[output.txt\\]',
                        'promise rejected'
                    ]
                ]
            });
        });
    });

    describe('logging', () => {
        const feature = 'logging';

        it('should log generated file only per default', (done) => {
            test(done, feature, 'default',  {
                result: TestResult.Success,
                expectedMessages: [
                    ['\\[GenerateFileWebpackPlugin\\] \\[output.txt\\] \\[generated\\]']
                ],
                unwantedMessages: [
                    ['\\[GenerateFileWebpackPlugin\\] \\[created\\]'],
                    ['\\[GenerateFileWebpackPlugin\\] \\[called\\]'],
                    ['\\[GenerateFileWebpackPlugin\\] \\[emit.tapAsync\\]'],
                    ['\\[GenerateFileWebpackPlugin\\] \\[output.txt\\] \\[generating\\]']
                ],
                ignoreOutput: true
            });
        });

        it('should log generated file only if debug is disabled', (done) => {
            test(done, feature, 'debug-disabled',  {
                result: TestResult.Success,
                expectedMessages: [
                    ['\\[GenerateFileWebpackPlugin\\] \\[output.txt\\] \\[generated\\]']
                ],
                unwantedMessages: [
                    ['\\[GenerateFileWebpackPlugin\\] \\[created\\]'],
                    ['\\[GenerateFileWebpackPlugin\\] \\[called\\]'],
                    ['\\[GenerateFileWebpackPlugin\\] \\[emit.tapAsync\\]'],
                    ['\\[GenerateFileWebpackPlugin\\] \\[output.txt\\] \\[generating\\]']
                ],
                ignoreOutput: true
            });
        });

        it('should log full lifecycle if debug is enabled', (done) => {
            test(done, feature, 'debug-enabled',  {
                result: TestResult.Success,
                expectedMessages:  [
                    ['\\[GenerateFileWebpackPlugin\\] \\[created\\]'],
                    ['\\[GenerateFileWebpackPlugin\\] \\[called\\]'],
                    ['\\[GenerateFileWebpackPlugin\\] \\[emit.tapAsync\\]'],
                    ['\\[GenerateFileWebpackPlugin\\] \\[output.txt\\] \\[generating\\]'],
                    ['\\[GenerateFileWebpackPlugin\\] \\[output.txt\\] \\[generated\\]']
                ],
                ignoreOutput: true
            });
        });
    });

});

function testCase(feature: string, scenario: string): string {
    return feature + '/' + scenario;
}

function test(done: DoneCallback, feature: string, scenario: string, spec: TestSpec) {
    const consoleSpy = jest.spyOn(console, 'info');
    consoleSpy.mockReset();

    const testEnv = TestEnv.of(testCase(feature, scenario), spec.outputDir);
    const config = require(testEnv.configFile);

    testEnv.cleanup();

    // Run Webpack
    webpack(config, (webpackError, webpackStats) => {
        if (webpackError) {
            return done(webpackError);
        }

        switch (spec.result) {
            case TestResult.Failure: {
                expect(webpackStats.hasErrors()).toBe(true);
                break;
            }
            case TestResult.Success: {
                if (! spec.ignoreOutput) {
                    fs.readdirSync(testEnv.expectedOutputDir).forEach((file) => {
                        const expectedFile = path.resolve(testEnv.expectedOutputDir, file);
                        const actualFile = path.join(testEnv.actualOutputDir, file);

                        expectFile(actualFile)
                            .toExist()
                            .toHaveSameContentAs(expectedFile);
                    });
                }
                break;
            }
        }

        if (spec.expectedMessages || spec.unwantedMessages) {
            const actualMessages =
                // @ts-ignore
                consoleSpy.mock.calls.flat(1).join('\n')
                    .concat('\n')
                    .concat(webpackStats.toString());

            if (spec.expectedMessages) {
                spec.expectedMessages.forEach(expectedMessageParts => {
                    expect(actualMessages).toMatch(new RegExp(expectedMessageParts.join('.*') + '.*$', 'm'));
                });
            }
            if (spec.unwantedMessages) {
                spec.unwantedMessages.forEach(unwantedMessageParts => {
                    expect(actualMessages).not.toMatch(new RegExp(unwantedMessageParts.join('.*') + '.*$', 'm'));
                });
            }
        }

        testEnv.cleanup();
        done();
    });
}

function success(): TestSpec {
    return {
        result: TestResult.Success
    }
}

interface TestSpec {
    result: TestResult;
    outputDir?: string;
    ignoreOutput?: boolean;
    expectedMessages?: string[][];
    unwantedMessages?: string[][];
}

enum TestResult {
    Success,
    Failure
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
            'caused by:\n' + e.message;
        return e;
    }

    private static fileContent(path: string): string | null {
        if (!fs.existsSync(path)) {
            return null;
        }
        return fs.readFileSync(path, 'utf-8');
    }
}

class TestEnv {
    static of(testCase: string, outputDir?: string): TestEnv {
        const testDir = path.resolve(__dirname, 'webpack/' + testCase);
        const expectedOutputDir = path.resolve(testDir, 'expected');
        const actualOutputDir = outputDir ? outputDir : path.resolve(__dirname, '.tmp/webpack/' + testCase);
        const configFile = path.resolve(testDir, 'webpack.config.js');

        process.env.testDir = testDir;
        process.env.outputDir = actualOutputDir;

        return new TestEnv(testDir, expectedOutputDir, actualOutputDir, configFile);
    }

    constructor(public testDir: string, public expectedOutputDir: string, public actualOutputDir: string, public configFile: string) {
    }

    cleanup() {
        if (fs.existsSync(this.actualOutputDir)) {
            rimraf.sync(this.actualOutputDir);
        }
    }
}