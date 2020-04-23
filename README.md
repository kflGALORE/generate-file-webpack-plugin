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
    * [Copy File](#examples--copy-file)
    * [Generate Application Info](#examples--generate-app-info)
    * [Using Handlebars Templates](#examples--using-handlebars-templates)
    * [Generate Multiple Files](#examples--generate-multiple-files)
* [Known Problems](#known-problems)


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

<a name="examples--copy-file"></a>
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

Note, that this plugin's intend is _not_ to replace the well known 
[copy](https://github.com/webpack-contrib/copy-webpack-plugin) webpack plugin. In case you just want to copy over some
file into webpack's output directory, you'll probably be better suited to use the copy-webpack-plugin, since it may be
easier to use for this case.

Nevertheless, this plugin got some features, that make it extremely useful in more complex scenarios as described in the 
following examples.

<a name="examples--generate-app-info"></a>
### Generate Application Info

Say, you want to generate some metadata information for your app, that is to served by a web server and displayed in 
your application on demand, you can do it like this:

```javascript
const fs = require('fs');
const path = require('path');
const generate = require('generate-file-webpack-plugin');

// Load package.json as object
const appPackage = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json')).toString());

module.exports = {
    // ...
    plugins: [
        generate({
            file: 'app-info.js',
            content: `const appInfo = {
                name: "${appPackage.name}",
                version: "${appPackage.version}"
            }`
        })
    ]
};
```

This will generate a file `app-info.js` with the name and the version of the app, that can be served and included by 
your web application, using the following tag:

```html
<script type="text/javascript" language="javascript" src="app-info.js"></script>
```

Note, that this approach of specifying the content of the generated file as a (template) string has several drawbacks:
* The `package.json` object is created as a global variable.
* The content will be resolved as soon as the webpack configuration is loaded, and not at the time the 
  plugin is actually executed. This is OK in this case, but there may be situations where referenced information is not 
  available at the time the webpack configuration is being loaded.

We can circumvent those issues by using a function as the content source for the generated file, like this:

```javascript
const fs = require('fs');
const path = require('path');
const generate = require('generate-file-webpack-plugin');

module.exports = {
    // ...
    plugins: [
        generate({
            file: 'app-info.js',
            content: () => {
                const appPackage = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json')).toString());
                return `const appInfo = {
                            name: "${appPackage.name}",
                            version: "${appPackage.version}"
                        }`
            }
        })
    ]
};
```

Note, that we used an anonymous arrow function in this case. We could have also used a "regular" anonymous function, or
a named function declared in the webpack configuration.

We can further enhance this example by not only using information from the `package.json`, but also from a different
information source. It would be useful to add an unique identifier (called `hash` in this case) for the source code from
which the application has been build. We use the latest Git commit ID for that in this example. This can be done like 
this:

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const generate = require('generate-file-webpack-plugin');

module.exports = {
    // ...
    plugins: [
        generate({
            file: 'app-info.js',
            content: () => {
                const appPackage = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json')).toString());
                const lastCommitId = execSync('git rev-parse HEAD', {timeout: 1000}).toString().trim();
                return `const appInfo = {
                            name: "${appPackage.name}",
                            version: "${appPackage.version}",
                            hash: "${lastCommitId}"
                        }`
            }
        })
    ]
};
```

Just for readability, we can extract parsing of the `package.json` file and the retrieval of the latest Git commit ID
into named functions declared in the webpack configuration. 

Note: Calling functions from within a content function is allowed.

```javascript
module.exports = {
    // ...
    plugins: [
        generate({
            file: 'app-info.js',
            content: () => {
                const appPackage = parseAppPackage();
                const lastCommitId = getLastCommitId();
                return `const appInfo = {
                            name: "${appPackage.name}",
                            version: "${appPackage.version}",
                            hash: "${lastCommitId}"
                        }`
            }
        })
    ]
};

function parseAppPackage() {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json')).toString());
}

function getLastCommitId() {
    return execSync('git rev-parse HEAD', {timeout: 1000}).toString().trim();
}
```

<a name="examples--using-handlebars-templates"></a>
### Using Handlebars Templates

Picking up the [Generate Application Info](#examples--generate-app-info) example, we can also use the 
[handlebars](https://handlebarsjs.com/) template engine for generating our `app-info.js` file (or any other file you 
like).

First, we have to install the `handlebars` npm package:

```bash
npm install handlebars --save-dev
```

Then, we have to create a handlebars template file, for generating our `app-info.js` file, for this example located in
`src/app-info.hbs`:

```hbs
const appInfo = {
    name: "{{appPackage.name}}",
    version: "{{appPackage.version}}",
    hash: "{{lastCommitId}}"
}
```

Finally, we add the following to our webpack configuration:

```javascript
const handlebars = require('handlebars');
const generate = require('generate-file-webpack-plugin');

module.exports = {
    // ...
    plugins: [
        generate({
            file: 'app-info.js',
            content: () => {
                return template('src/app-info.hbs')({
                    appPackage: parseAppPackage(),
                    lastCommitId: getLastCommitId()
                });
            }
        })
    ]
};

function template(file) {
    return handlebars.compile(fs.readFileSync(path.resolve(__dirname, file)).toString());
}
```

Note, that for clarity we omitted the definition of the `parseAppPackage()` and `getLastCommitId()` functions. Have a look
at the [Generate Application Info](#examples--generate-app-info) example if you need to know how they are implemented.

Note, that we defined a (more or less) generic function `template(file)` for compiling our handlebars template file. We
are not relying on the [handlebars-loader](https://github.com/pcardune/handlebars-loader) webpack loader, because the 
webpack configuration setup for making this work would be too complex. Especially, we would have to defined an entry 
point for the loader, and still could not ensure that our plugin gets executed _after_ the loader has done its work.
In theory we could somehow make it work, but in reality this is just a configuration overkill that you should avoid.


<a name="examples--generate-multiple-files"></a>
### Generate Multiple Files

In order to generate multiple files, you have to specify multiple invocations of this plugin in the webpack 
configuration, like this:

```javascript
module.exports = {
    // ...
    plugins: [
        generate({
            file: 'file-1.txt',
            content: 'some content for file 1'
        }),
        generate({
            file: 'file-2.txt',
            content: 'some content for file 2'
        })
    ]
};
```

Of course you can use all of the features described in previous examples for specifying the content.

<a name="known-problems"></a>
## Known Problems

See [bugs](https://github.com/kflGALORE/generate-file-webpack-plugin/labels/bug)