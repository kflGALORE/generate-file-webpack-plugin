import * as webpack from "webpack";
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
    }

    public apply(compiler: webpack.Compiler):void {
        compiler.hooks.emit.tapAsync(this.name, (compilation, callback) => {
            try {
                const targetFile = this.inferTargetFile(compilation);
                this.resolveContent()
                    .then(content => {
                        fs.writeFileSync(targetFile, content);
                        callback();
                    })
                    .catch(e => {
                        compilation.errors.push(e);
                        callback();
                    });
            } catch (e) {
                compilation.errors.push(e);
                callback();
            }
        });
    }

    private inferTargetFile(compilation: Compilation): string {
        if (path.isAbsolute(this.options.file)) {
            return this.options.file;
        }

        if (! compilation.compiler.outputPath) {
            throw new Error('Could not infer target file path: No webpack output path configured.');
        }
        const outputPath = compilation.compiler.outputPath;
        if (! path.isAbsolute(outputPath)) {
            throw new Error('Could not infer target file path: Configured webpack output path is not an absolute path.');
        }

        return path.resolve(outputPath, this.options.file);
    }

    private async resolveContent(): Promise<string> {
        const contentSource = this.options.content;
        if (typeof contentSource === 'string' || contentSource instanceof String) {
            return contentSource as string;
        } else if (typeof contentSource === 'object' && Buffer.isBuffer(contentSource)) {
            return contentSource.toString();
        } else if  (typeof contentSource === 'object' && contentSource instanceof Promise) {
            return contentSource;
        } else if (typeof contentSource === 'function') {
            return contentSource.call();
        } else {
            throw new Error('Unsupported content source: ' + typeof contentSource);
        }
    }
}

interface Options {
    file: string;
    content: any;
}