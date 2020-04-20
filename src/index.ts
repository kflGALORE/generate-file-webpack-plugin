import * as webpack from "webpack";
import {Logger} from "webpack";
import * as fs from 'fs';
import * as path from 'path';
import Compilation = webpack.compilation.Compilation;

export = generate;

function generate(options: Options) {
    return new GenerateFileWebpackPlugin(options);
}

class GenerateFileWebpackPlugin {
    private readonly name: string;

    public constructor(public options: Options) {
        this.name = 'GenerateFileWebpackPlugin';
        this.debug(null, '[created]');
    }

    // noinspection JSUnusedGlobalSymbols
    public apply(compiler: webpack.Compiler):void {
        this.debug(null, '[called]');
        compiler.hooks.emit.tapAsync(this.name, (compilation, callback) => {
            this.debug(compilation, '[emit.tapAsync]');
            try {
                const targetFile = this.inferTargetFile(compilation);

                this.debug(compilation, '[generating]', targetFile);
                this.resolveContent()
                    .then(content => {
                        const targetDir = path.dirname(targetFile);
                        if (! fs.existsSync(targetDir)) {
                            fs.mkdirSync(targetDir, {recursive: true});
                        }
                        fs.writeFileSync(targetFile, content);
                        this.info(compilation, '[generated]', targetFile);
                        callback();
                    })
                    .catch(e => {
                        this.fail(compilation, e, targetFile);
                        callback();
                    });
            } catch (e) {
                this.fail(compilation, e);
                callback();
            }
        });
    }

    private inferTargetFile(compilation: Compilation): string {
        if (path.isAbsolute(this.options.file)) {
            return this.options.file;
        }

        if (! compilation.compiler.outputPath) {
            // This should never occur in real-life - we catch that case anyways, just because of paranoia
            throw new Error('Could not infer target file path: No webpack output path configured.');
        }
        const outputPath = compilation.compiler.outputPath;
        if (! path.isAbsolute(outputPath)) {
            // This should never occur in real-life - we catch that case anyways, just because of paranoia
            throw new Error('Could not infer target file path: Configured webpack output path is not an absolute path.');
        }

        return path.resolve(outputPath, this.options.file);
    }

    private async resolveContent(): Promise<string> {
        const contentSource = this.options.content;
        if (isString(contentSource)) {
            return contentSource as string;
        } else if (isBuffer(contentSource)) {
            return contentSource.toString();
        } else if  (isPromise(contentSource)) {
            return contentSource;
        } else if (isFunction(contentSource)) {
            const functionResult =  contentSource.call();
            if (! isString(functionResult) && ! isBuffer(functionResult) && ! isPromise(functionResult)) {
                throw new Error('Unsupported function content source: ' + typeNameOf(functionResult));
            }
            return functionResult;
        } else {
            throw new Error('Unsupported content source: ' + typeNameOf(contentSource));
        }
    }

    private fail(compilation: Compilation, e: any, targetFile?: string): void {
        const errorMessage = e instanceof Error? e.message : e.toString();

        let message = '[' + this.name + '] ';
        if (targetFile) {
            message = message + '[' + path.basename(targetFile) + '] ';
        }
        message = message + errorMessage;

        compilation.errors.push(new Error(message));
    }

    private debug(compilation: Compilation|null, logMessage: string, targetFile?: string) {
        if (! this.options.debug) {
            return;
        }
        this.getLogger(compilation).info(this.message(logMessage, targetFile));
    }

    private info(compilation: Compilation, logMessage: string, targetFile?: string) {
        this.getLogger(compilation).info(this.message(logMessage, targetFile));
    }

    private getLogger(compilation: Compilation|null): Logger|Console {
        return compilation && compilation.getLogger ? compilation.getLogger(this.name) : console;
    }

    private message(logMessage: string, targetFile?: string): string {
        let message = '[' + this.name + '] ';
        if (targetFile) {
            message = message + '[' + path.basename(targetFile) + '] ';
        }
        message = message + logMessage;

        return message;
    }
}

function isString(value: any): boolean {
    return typeof value === 'string' || value instanceof String;
}

function isBuffer(value: any): boolean {
    return typeof value === 'object' && Buffer.isBuffer(value);
}

function isPromise(value: any): boolean {
    return typeof value === 'object' && value instanceof Promise;
}

function isFunction(value: any): boolean {
    return typeof value === 'function';
}

function typeNameOf(value: any): string {
    if (typeof value === 'object') {
        return value.constructor.name;
    } else {
        return typeof value;
    }
}

interface Options {
    file: string;
    content: any;
    debug?: boolean
}