import * as webpack from "webpack";
import * as fs from 'fs';
import * as path from 'path';

export class GenerateFileWebpackPlugin {
    public constructor(public options: Options) {
    }

    public apply(compiler: webpack.Compiler):void {
        compiler.hooks.emit.tap('GenerateFileWebpackPlugin', (compilation, callback) => {
            if (typeof this.options.content === 'string' ||  this.options.content instanceof String) {
                const dir = path.dirname(this.options.file);
                if (! fs.existsSync(dir)) {
                    fs.mkdirSync(dir, {recursive: true})
                }
                console.log('generating file ' + this.options.file + ' with content ' + this.options.content);
                fs.writeFileSync(this.options.file,  this.options.content);
            } else {
                // what?
            }
            //compilation.getLogger('GenerateFileWebpackPlugin').info()
        });
    }
}

interface Options {
    file: string;
    content: any;
}