import * as webpack from "webpack";

export class GenerateFileWebpackPlugin {
    public constructor(public options: any) {
    }

    public apply(compiler: webpack.Compiler):void {
        compiler.hooks.emit.tap('GenerateFileWebpackPlugin', (compilation, callback) => {
            console.log('Hello World');
        });
    }
}