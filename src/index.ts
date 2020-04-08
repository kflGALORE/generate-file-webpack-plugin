import * as webpack from "webpack";
import * as fs from 'fs';
import * as path from 'path';
import Compilation = webpack.compilation.Compilation;

export class GenerateFileWebpackPlugin {
    public constructor(public options: Options) {
    }

    public apply(compiler: webpack.Compiler):void {
        compiler.hooks.emit.tap('GenerateFileWebpackPlugin', (compilation, callback) => {
            try {
                const targetFile = this.inferTargetFile(compilation);
                // TODO remove: const resolvedContent = this.resolveContent();
                // TODO this.resolveContent().then(...).catch(...) is better
                const dir = path.dirname(targetFile);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, {recursive: true})
                }
                this.writeTargetFile(targetFile, this.options.content);
                // TODO remove: fs.writeFileSync(targetFile, resolvedContent);
            } catch (e) {
                compilation.errors.push(e);
            }

            // TODO when to invoke callback -> promises?
            if (callback) {
                callback();
            }

            //compilation.getLogger('GenerateFileWebpackPlugin').info()
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

    private writeTargetFile(targetFile: string, contentSource: any) {
        let content;
        if (typeof contentSource === 'string' || contentSource instanceof String) {
            content = contentSource as string;
        } else if (typeof contentSource === 'object' && Buffer.isBuffer(contentSource)) {
            content = contentSource.toString();
        } else if (typeof contentSource === 'function') {
            content = contentSource.call();
        } else {
            throw new Error('Unsupported content source: ' + typeof contentSource);
        }

        if (typeof content === 'object' && content instanceof Promise) {
            content
                .then(resolvedContent => {
                    fs.writeFileSync(targetFile, resolvedContent);
                })
                .catch(err => {
                    throw err;
                });
        } else {
            fs.writeFileSync(targetFile, content);
        }
    }

    private resolveContent(): string {
        const contentSource = this.options.content;
        if (typeof contentSource === 'string' || contentSource instanceof String) {
            return contentSource as string;
        } else if (typeof contentSource === 'object' && Buffer.isBuffer(contentSource)) {
            return contentSource.toString();
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