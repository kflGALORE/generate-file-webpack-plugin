import * as webpack from "webpack";

export class GenerateFileWebpackPlugin {
    public constructor(public options: Options) {
    }

    public apply(compiler: webpack.Compiler):void {
        compiler.hooks.emit.tap('GenerateFileWebpackPlugin', (compilation, callback) => {
            compilation.getLogger('GenerateFileWebpackPlugin').info()
            console.log('Hello World:' + this.options.file);
        });
    }
}

interface Options {
    file: string;
}