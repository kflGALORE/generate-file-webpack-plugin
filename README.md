[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)
![CI (master)](https://github.com/kflGALORE/generate-file-webpack-plugin/workflows/CI%20(master)/badge.svg?branch=master)
[![dependencies](https://david-dm.org/kflGALORE/generate-file-webpack-plugin.svg)](https://david-dm.org/kflGALORE/generate-file-webpack-plugin)
[![dev-dependencies](https://david-dm.org/kflGALORE/generate-file-webpack-plugin/dev-status.svg)](https://david-dm.org/kflGALORE/generate-file-webpack-plugin#info=devDependencies)

# generate-file-webpack-plugin
**This is still work-in-progress. _Do not use, yet_**.

General purpose Webpack plugin for generating files.

* [Getting Started](#getting-started)
    * [Requirements](#getting-started--requirements)
    * [Install](#getting-started--install)
    * [Usage](#getting-started--usage)
* [Configuration](#configuration)
    * [file](#configuration--file)
    * [content](#configuration--content)
    * [debug](#configuration--debug)
* [Examples](#examples)

<a name="getting-started"></a>
## Getting Started

<a name="getting-started--requirements"></a>
### Requirements

* Webpack 4.x
  * Earlier version of Webpack probably won't work.
  * Latest version 5.x may work, but has not been tested.
  
* Node.js 12.x
  * Earlier versions may also work, but have not been tested.
  * Later versions most probably also work, but have not been tested.

* npm 6.x
  * Earlier versions may also work, but have not been tested.
  * Later versions most probably also work, but have not been tested.

<a name="getting-started--install"></a>
### Install

Using npm:

```bash
npm install generate-file-webpack-plugin --save-dev
```

Even if not been tested yet, installation using [yarn](https://classic.yarnpkg.com/en/) should work without problems:

 ```bash
 yarn add generate-file-webpack-plugin --dev
 ```

<a name="getting-started--usage"></a>
### Usage

**webpack.config.js**
```javascript
const generate = require('generate-file-webpack-plugin');

module.exports = {
    // ...
    plugins: [
       generate({
            file: 'output.txt',
            content: 'Hello World'
        })
    ]
};
```

Running `webpack` via your preferred method will generate a file named `output.txt` in your root output directory with
the content `Hello World`.

<a name="configuration"></a>
## Configuration

**webpack.config.js**
```javascript
const generate = require('generate-file-webpack-plugin');

module.exports = {
    // ...
    plugins: [
       generate(options)
    ]
};
```

Thereby, `options` is the main configuration object for this plugin, supporting the following properties:

<a name="configuration--file"></a>
#### `file`

The file that is to be generated. 

This may either be a relative or an absolute file path. In case it is a relative file path, it will be resolved
 relative to the `output.path` you specified in your webpack configuration.

* type: `string`
* required: true
* since: 1.0.0

<a name="configuration--content"></a>
#### `content`

The content to be written into the specified `file`. 

This property is designed to be quite flexible, in order to cover as much use cases as possible. In its simplest form 
it is just a `string` or a `Buffer`. But it may also be a `Promise` that will later resolve to either a `string` or a 
`Buffer`. Further, it may be a `Function` that either returns a  `string` or a `Buffer`, or a `Promise` resolving to one
of the aforementioned types.

* type: `string` 
| [`Buffer`](https://nodejs.org/api/buffer.html#buffer_class_buffer) 
| [`Promise<string>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) 
| [`Promise<Buffer>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) 
| `Function`
* required: true
* since: 1.0.0

<a name="configuration--debug"></a>
#### `debug`

Flag, indicating if additional debug output should be logged.

* type: `boolean`
* required: false
* default: `false`
* since: 1.0.0

<a name="examples"></a>
## Examples

### Copy File

Given, you have a `file my-file.txt` in your `src` directory. Then you can copy that file into webpack's default output
directory like this:

```javascript
const fs = require('fs');
const generate = require('generate-file-webpack-plugin');

module.exports = {
    // ...
    plugins: [
       generate({
            file: 'my-file.txt',
            content:  fs.readFileSync(path.resolve(__dirname, 'src/my-file.txt'))
        })
    ]
};
```

