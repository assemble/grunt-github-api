<<<<<<< HEAD
## Github API

Used to query the Github API and save the returned JSON files locally.

## Getting Started

This plugin requires Grunt ~0.4.0

If you haven't used Grunt before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a Gruntfile as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

    npm install grunt-github-api --save-dev

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

    grunt.loadNpmTasks('grunt-github-api');

Run this task with the `grunt github` command.

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

## Usage

The grunt-github-api module accepts options at both the global and local task level. Special options include `oAuth`, `filters` and `screenDump`.

### Options

- `oAuth` - contain two specific properties; `client_id` and `client_secret`. These credentials are provided by Github, and need to be created by a user with corrent permissions before any secure query will work. Additional information about Github and oAuth2 can be found in their [oAuth documentation](http://developer.github.com/v3/oauth/).

- `filters` - should contain the filtering parameters avaliable to the `src` query defined. Additional information about specific filters can be found in the [Github Developer Documentation](http://developer.github.com/).

- `screenDump` - boolean flag used to determine if the returned JSON should be dumped to the screen. (default is `false`)

- `reqType` - string to indicate if the request type is either `data` or a `file` - (default is `data`)

- `fileEncode` - string to indicate the desired encoding type file contents should be switched to before saving to disk.

### Targets

- `src` - is the specified API query path. Soruce paths are everything that appears after `api.github.com`. Additional information about different query paths can be found in the [Github Developer Documentation](http://developer.github.com/).

- `dest` - is the path and filename where the retured request should be saved.

Example
```js
github: {
    options: {
        oAuth: {
            'client_id': 'XXXXXXXXXXXX',
            'client_secret': 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYY'
        }
    },
    changelog: {
        options: {
            filters: {
                'state': 'open'
            }
        },
        src: '/repos/:org/:repo1/issues', // Get a JSON file for all open issues from repo1
        dest: 'open.json'
    },
    snagFile: {
        options: {
            filters: {
                type: 'public'
            },
            reqType: 'file'
        },
        src: '/repos/:org/:repo/contents/:filename.:ext', // Get a the specific file listed
        dest: 'saveFile.json' // Save the file with this name
    }
}
```
=======
# Github API

Used to query the Github API and save the returned JSON files locally.

## Getting Started

This plugin requires Grunt ~0.4.0

If you haven't used Grunt before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a Gruntfile as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

    npm install grunt-github-api --save-dev

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

    grunt.loadNpmTasks('grunt-github-api');

Run this task with the `grunt github` command.

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

## Usage

The grunt-github-api module accepts options at both the global and local task level. Please note that local options will override those found at the global level.

### Options

Options for this plugin are broken down into multiple category as defined below. Please note that all option sections by default are objects and contain simple key-value pairs unless otherwise noted.

- **output** - used to idenify where cache and downloaded request data should be stored by default

    - **path** - _default: 'api-data'_ - location where all data is collected when saved to disk, if no specific destination is definded under the targets dest.
    - **cache** -  _default: '.cache.json'_ - plugin cache file name. Will be stored under under the output path defined above.


- **connection** - connection headers used when connecting the GitHub

    - **host** - _default: api.github.com_ - default GitHub API portal
    - **headers** - _default: [Object]_ used to define the nodejs HTTPS headers.

        - User-Agent: node-http/0.10.1
        - Content-Type: application/json

- **task** - task meta data settings

    - **type** - _default: 'data'_ - Indicates the type of request being named can be either `data` or `file`
    - **concat** - _default: false_ - Indicates that the multi-source requested data should be combined together. This only works with `data` type requests.
    - **cache** - _default: true_ - defines if  the task should be tracked in the cache.

- **filters** - query search parameters. Additional information about different filters can be found in the [Github Developer Documentation](http://developer.github.com/).

- **oAuth** - GitHub access credentials. These credentials are required to preform many actions or continual usage of the plugin. In order to get access using oAuth the repo owner will need to create an access token via their [Application Settings](https://github.com/settings/applications) page.

### Targets

- `src` - is the specified API query path. Source paths are everything that appears after `api.github.com`. Additional information about different query paths can be found in the [Github Developer Documentation](http://developer.github.com/). The `src` can be an `array` or a `string` value.

- `dest` - (optional) - is the path and filename where the retured request should be saved. If nothing is given files will be saved into the same path as the task cache file and will be broken down into a folder structure that mimics its query path. (EXCEPTION: If you define multiple sources that are being concatenated together, you must define at least a filename).

## Example

```js
github: {
    
    // Creates a single json file based on the return json responses
    combindedIssues: {
        options: {
            filters: {
                state: "open"
            },
            task: {
                concat: true
            }
        },
        src: ['/repos/jeffherb/grunt-github-api-example/issues', '/repos/jeffherb/grunt-github-api/issues'],
        dest: "combinded-issues.json"
    },

    // Created two different files from two different repos.
    seperateIssues: {
        options: {
            // Access repo using credentials provided
            oAuth: {
                access_token: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            }
        },
        src: ['/repos/jeffherb/grunt-github-api-example/issues', '/repos/jeffherb/grunt-github-api/issues'],
    },

    // Downloads a copy of the example.json file from GitHub.
    examplePkg: {
        options: {
            task: {
                type: "file",
            }
        },
        src: '/repos/jeffherb/grunt-github-api-example/contents/example.json',
    },
}
```
>>>>>>> dev
