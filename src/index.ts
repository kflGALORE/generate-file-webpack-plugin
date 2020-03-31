import * as webpack from "webpack";
import * as fs from 'fs';
import * as path from 'path';

export class GenerateFileWebpackPlugin {
    public constructor(public options: Options) {
    }

    public apply(compiler: webpack.Compiler):void {
        compiler.hooks.emit.tap('GenerateFileWebpackPlugin', (compilation, callback) => {
            try {
                const resolvedContent = this.resolveContent();
                const dir = path.dirname(this.options.file);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, {recursive: true})
                }
                fs.writeFileSync(this.options.file, resolvedContent);
            } catch (e) {
                compilation.errors.push(e);
            }

            if (callback) {
                callback();
            }

            //compilation.getLogger('GenerateFileWebpackPlugin').info()
        });
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